import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import manifest from "@/data/photography-manifest.json";
import { placeKey, type PlacesFile, type VerifiedPlace } from "@/lib/lab/places";

/**
 * Writes hand-verified photograph locations to data/photo-places.json.
 *
 * Authoring tool, not a site feature: it only responds in development, and it only accepts
 * keys that already exist in the photography manifest so a request can never write outside
 * the known photo set.
 */

const MAX_FIELD = 120;

function devOnly() {
  return process.env.NODE_ENV !== "development";
}

function allowedKeys() {
  const categories = manifest.categories as Record<string, string[]>;
  const keys = new Set<string>();
  for (const [category, files] of Object.entries(categories)) {
    for (const file of files) keys.add(placeKey(category, file));
  }
  return keys;
}

const FILE = path.join(process.cwd(), "data", "photo-places.json");

async function readPlaces(): Promise<PlacesFile> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as PlacesFile;
  } catch {
    return {};
  }
}

export async function GET() {
  if (devOnly()) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(await readPlaces());
}

export async function POST(request: Request) {
  if (devOnly()) return new NextResponse("Not found", { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const entries = (body as { entries?: unknown })?.entries;
  if (!entries || typeof entries !== "object" || Array.isArray(entries)) {
    return NextResponse.json({ error: "expected { entries: object }" }, { status: 400 });
  }

  const allowed = allowedKeys();
  const places = await readPlaces();
  const now = new Date().toISOString();
  let written = 0;
  const rejected: string[] = [];

  for (const [key, value] of Object.entries(entries as Record<string, unknown>)) {
    if (!allowed.has(key)) {
      rejected.push(key);
      continue;
    }
    const v = value as Partial<VerifiedPlace> | null;
    if (v === null) {
      delete places[key];
      written += 1;
      continue;
    }
    const label = String(v?.label ?? "").slice(0, MAX_FIELD).trim();
    const country = String(v?.country ?? "").slice(0, MAX_FIELD).trim();
    places[key] = { label, country, confirmedAt: now };
    written += 1;
  }

  const sorted = Object.fromEntries(Object.entries(places).sort(([a], [b]) => a.localeCompare(b)));
  await fs.writeFile(FILE, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");

  return NextResponse.json({ written, rejected, total: Object.keys(sorted).length });
}
