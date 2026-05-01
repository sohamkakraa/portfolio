import { NextResponse } from "next/server";
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

const DATA_PATH = path.join(process.cwd(), "data", "portfolio.json");

const ensureDataDir = () => {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

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

/** Merge stored CMS JSON with build-time defaults (photography from disk, etc.). */
function mergeStoredWithDefaults(stored: PortfolioData, defaults: PortfolioData): PortfolioData {
  const merged: PortfolioData = {
    ...defaults,
    ...stored,
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

export async function GET() {
  const defaults = getDefaultPortfolioData();
  const stored = await readStoredData();

  if (stored) {
    return NextResponse.json(mergeStoredWithDefaults(stored, defaults));
  }

  return NextResponse.json(defaults);
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
      return NextResponse.json({
        success: true,
        message: "Portfolio data saved (Upstash Redis).",
        storage: "redis",
      });
    }

    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(body, null, 2), "utf-8");

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
