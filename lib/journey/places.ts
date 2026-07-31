/**
 * Hand-verified photograph locations.
 *
 * `data/photo-locations.json` was produced by feeding filenames to a geocoder and is wrong
 * for roughly a quarter of its entries — Himalayas frames land in China, a star trail in
 * Hawaii, Nagaru in Nepal. Nothing in this file is machine-guessed: an entry exists only
 * because it was confirmed by hand, and an absent entry means no label gets printed.
 */

export type VerifiedPlace = {
  /** Printed under the frame. An empty string means "confirmed that there is no label". */
  label: string;
  /** Coarse fallback, safe to plot on a map. */
  country: string;
  confirmedAt: string;
};

export type PlacesFile = Record<string, VerifiedPlace>;

/** Manifest category keys and public folder names disagree for exactly one category. */
const FOLDER: Record<string, string> = {
  "light-trails": "Startrails",
};

export function placeKey(category: string, file: string) {
  return `${category}/${file}`;
}

export function photoUrl(category: string, file: string) {
  return `/photography-webp/${FOLDER[category] ?? category}/${encodeURIComponent(file)}`;
}

const CATEGORY_OF_FOLDER: Record<string, string> = Object.fromEntries(
  Object.entries(FOLDER).map(([category, folder]) => [folder, category])
);

/** Inverse of photoUrl, so content files can be checked against the manifest. */
export function keyFromUrl(url: string): string | null {
  const match = /^\/photography-webp\/([^/]+)\/(.+)$/.exec(url);
  if (!match) return null;
  const [, folder, file] = match;
  return placeKey(CATEGORY_OF_FOLDER[folder] ?? folder, decodeURIComponent(file));
}

/** The label to print, or null when nobody has confirmed one. */
export function verifiedLabel(places: PlacesFile, key: string): string | null {
  const entry = places[key];
  if (!entry) return null;
  return entry.label.trim() || null;
}
