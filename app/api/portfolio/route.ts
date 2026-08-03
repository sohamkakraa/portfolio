import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import type { PortfolioData } from "@/lib/portfolio-types";
import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import {
  isPortfolioRedisConfigured,
  readPortfolioFromRedis,
  writePortfolioToRedis,
} from "@/lib/portfolio-redis";
import { verifyAdminSession } from "@/lib/auth";
import { stripHiddenContent } from "@/lib/portfolio-visibility";

const DATA_PATH = path.join(process.cwd(), "data", "portfolio.json");

const ensureDataDir = () => {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

/**
 * The reading surfaces are cached, so a save has to tell them. Without this an edit would sit
 * invisible until the hourly revalidation happened to come round.
 */
function revalidateSiteSurfaces(): void {
  for (const p of ["/projects", "/photography", "/about", "/work"]) {
    revalidatePath(p);
  }
}

const readStoredDataFromFile = (): PortfolioData | null => {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, "utf-8");
      return JSON.parse(raw) as PortfolioData;
    }
  } catch {
    // ignore parse errors
  }
  return null;
};

// Merge stored project items over defaults by id so older payloads inherit
// storyline / metrics / stack / discipline metadata instead of wiping them.
function mergeProjects(defaults: PortfolioData["projects"], stored?: PortfolioData["projects"]): PortfolioData["projects"] {
  if (!stored) return defaults;
  const defaultsById = new Map(defaults.items.map((p) => [p.id, p]));
  const items = (stored.items ?? []).map((s) => {
    const d = defaultsById.get(s.id);
    if (!d) return s;
    return {
      ...d,
      ...s,
      storyline: s.storyline?.length ? s.storyline : d.storyline,
      metrics: s.metrics?.length ? s.metrics : d.metrics,
      stack: s.stack?.length ? s.stack : d.stack,
    };
  });
  // Append any default items that the stored payload dropped (rare, but keeps
  // the editorial defaults visible after a partial save).
  const seen = new Set(items.map((p) => p.id));
  for (const d of defaults.items) if (!seen.has(d.id)) items.push(d);
  return {
    ...defaults,
    ...stored,
    items,
  };
}

/** Merge stored CMS JSON with build-time defaults (photography from disk, etc.).
 * Deep-merges per top-level section so older stored payloads that pre-date
 * editorial fields still inherit those defaults instead of nulling them out.
 */
function mergeStoredWithDefaults(stored: PortfolioData, defaults: PortfolioData): PortfolioData {
  const merged: PortfolioData = {
    ...defaults,
    ...stored,
    site: { ...defaults.site, ...stored.site },
    hero: { ...defaults.hero, ...stored.hero },
    // Matches app/page.tsx: the CV log is projected from lib/work.ts and cannot be
    // overridden by a stored payload, so the admin panel reads the same truth the site does.
    about: { ...defaults.about, ...stored.about, log: defaults.about.log },
    highlights: { ...defaults.highlights, ...stored.highlights },
    projects: mergeProjects(defaults.projects, stored.projects),
    life: { ...defaults.life, ...stored.life },
    contact: { ...defaults.contact, ...stored.contact },
    footer: { ...defaults.footer, ...stored.footer },
    photography: {
      ...defaults.photography,
      ...stored.photography,
      categories: defaults.photography.categories.map((defCat) => {
        const storedCat = stored.photography?.categories?.find((c) => c.slug === defCat.slug);
        if (!storedCat) return defCat;
        const storedImages = storedCat.images;
        return {
          ...defCat,
          ...storedCat,
          images: storedImages?.length ? storedImages : defCat.images,
        };
      }),
    },
  };

  const extraCategories = (stored.photography?.categories || []).filter(
    (sc) => !defaults.photography.categories.some((dc) => dc.slug === sc.slug)
  );
  if (extraCategories.length) {
    merged.photography.categories.push(...extraCategories);
  }

  return merged;
}

async function readStoredData(): Promise<PortfolioData | null> {
  if (isPortfolioRedisConfigured()) {
    const fromRedis = await readPortfolioFromRedis();
    if (fromRedis) return fromRedis;
  }
  return readStoredDataFromFile();
}

export async function GET(request: Request) {
  const defaults = getDefaultPortfolioData();
  const stored = await readStoredData();
  const merged = stored ? mergeStoredWithDefaults(stored, defaults) : defaults;

  // The admin panel reads this endpoint to edit, so it needs to see hidden items in order to
  // unhide them. Everyone else gets them stripped.
  const session = await verifyAdminSession(request.headers.get("cookie"));
  if (session) return NextResponse.json(merged);

  // Says so out loud, because the editor saves back whatever it loaded. If it ever received a
  // filtered payload and then saved, hiding a photograph would quietly become deleting it. The
  // editor refuses to load when it sees this.
  return NextResponse.json(stripHiddenContent(merged), {
    headers: { "X-Content-Filtered": "hidden" },
  });
}

export async function PUT(request: Request) {
  const session = await verifyAdminSession(request.headers.get("cookie"));
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const csrf = request.headers.get("x-csrf-token");
  if (!csrf || csrf !== session.csrfToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as PortfolioData;

    if (isPortfolioRedisConfigured()) {
      await writePortfolioToRedis(body);
      revalidateSiteSurfaces();
      return NextResponse.json({
        success: true,
        message: "Portfolio data saved (Upstash Redis).",
        storage: "redis",
      });
    }

    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(body, null, 2), "utf-8");
    revalidateSiteSurfaces();

    return NextResponse.json({
      success: true,
      message: "Portfolio data saved (local file).",
      storage: "file",
    });
  } catch (error) {
    console.error("[portfolio PUT]", error);
    const onVercel = process.env.VERCEL === "1";
    const errMsg = error instanceof Error ? error.message : String(error);
    const hint =
      onVercel && !isPortfolioRedisConfigured()
        ? " Add Upstash Redis (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) in Vercel env, or save only via local dev + git."
        : "";
    return NextResponse.json(
      {
        success: false,
        message: onVercel
          ? `Server cannot persist portfolio data.${hint}`
          : `Failed to save: ${errMsg}`,
      },
      { status: 500 }
    );
  }
}
