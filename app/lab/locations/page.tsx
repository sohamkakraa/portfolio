import { promises as fs } from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import geocoded from "@/data/photo-locations.json";
import manifest from "@/data/photography-manifest.json";
import { CLIMB_STOPS, HOURS, HUB_JOURNEYS, ROUTE_CHAPTERS } from "@/lib/lab/lab-content";
import { keyFromUrl, photoUrl, placeKey, type PlacesFile } from "@/lib/lab/places";
import LocationReview, { type Row } from "./LocationReview";

/**
 * Authoring tool for rebuilding photograph locations by hand. Development only, because it
 * writes into the repo. Frames already used in the prototypes sort to the top, so the
 * twenty that matter can be confirmed without touching the other hundred.
 */

type Geo = Record<string, { raw?: string; city?: string; country?: string }>;

function usedKeys() {
  const urls = [
    ...ROUTE_CHAPTERS.flatMap((c) => c.frames.map((f) => f.src)),
    ...HOURS.flatMap((h) => h.frames.map((f) => f.src)),
    ...CLIMB_STOPS.flatMap((s) => s.frames.map((f) => f.src)),
    ...HUB_JOURNEYS.map((j) => j.cover),
  ];
  return new Set(urls.map(keyFromUrl).filter((k): k is string => k !== null));
}

async function readPlaces(): Promise<PlacesFile> {
  try {
    const file = path.join(process.cwd(), "data", "photo-places.json");
    return JSON.parse(await fs.readFile(file, "utf8")) as PlacesFile;
  } catch {
    return {};
  }
}

export default async function LocationsPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const places = await readPlaces();
  const geo = geocoded as Geo;
  const used = usedKeys();
  const categories = manifest.categories as Record<string, string[]>;

  const rows: Row[] = [];
  for (const [category, files] of Object.entries(categories)) {
    for (const file of files) {
      const key = placeKey(category, file);
      const guess = geo[key];
      rows.push({
        key,
        category,
        file,
        url: photoUrl(category, file),
        guess: guess ? [guess.city, guess.country].filter(Boolean).join(", ") : "",
        label: places[key]?.label ?? "",
        country: places[key]?.country ?? "",
        confirmed: Boolean(places[key]),
        used: used.has(key),
      });
    }
  }

  rows.sort((a, b) => {
    if (a.used !== b.used) return a.used ? -1 : 1;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.file.localeCompare(b.file);
  });

  return <LocationReview rows={rows} />;
}
