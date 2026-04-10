import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { PortfolioData } from "@/lib/portfolio-types";
import { getDefaultPortfolioData } from "@/lib/portfolio-data";

const DATA_PATH = path.join(process.cwd(), "data", "portfolio.json");

const ensureDataDir = () => {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const readStoredData = (): PortfolioData | null => {
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

export async function GET() {
  const defaults = getDefaultPortfolioData();
  const stored = readStoredData();

  if (stored) {
    // Merge stored data with defaults (stored takes priority)
    const merged: PortfolioData = {
      ...defaults,
      ...stored,
      photography: {
        ...defaults.photography,
        ...stored.photography,
        // Keep filesystem-scanned images as base, merge stored overrides
        categories: defaults.photography.categories.map((defCat) => {
          const storedCat = stored.photography?.categories?.find(
            (c) => c.slug === defCat.slug
          );
          if (!storedCat) return defCat;
          return {
            ...defCat,
            ...storedCat,
            images:
              storedCat.images?.length > 0
                ? storedCat.images
                : defCat.images,
          };
        }),
      },
    };

    // Also include any new categories from stored data
    const extraCategories = (stored.photography?.categories || []).filter(
      (sc) => !defaults.photography.categories.some((dc) => dc.slug === sc.slug)
    );
    if (extraCategories.length) {
      merged.photography.categories.push(...extraCategories);
    }

    return NextResponse.json(merged);
  }

  return NextResponse.json(defaults);
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as PortfolioData;

    ensureDataDir();
    fs.writeFileSync(DATA_PATH, JSON.stringify(body, null, 2), "utf-8");

    return NextResponse.json({ success: true, message: "Portfolio data saved." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to save data." },
      { status: 500 }
    );
  }
}
