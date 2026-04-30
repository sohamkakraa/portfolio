import type { PhotoMeta } from "@/lib/portfolio-types";

// ── EXIF extraction ───────────────────────────────────────────────────────────

interface RawExif {
  Make?: string;
  Model?: string;
  LensMake?: string;
  LensModel?: string;
  FNumber?: number;
  ExposureTime?: number;
  ISO?: number;
  FocalLength?: number;
  DateTimeOriginal?: Date | string;
  latitude?: number;
  longitude?: number;
}

function formatShutter(t: number): string {
  if (t >= 1) return `${t}s`;
  const denom = Math.round(1 / t);
  return `1/${denom}s`;
}

function formatDate(d: Date | string): string {
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

export async function extractExif(file: File): Promise<PhotoMeta> {
  try {
    // Dynamic import so exifr is never bundled server-side
    const exifr = await import("exifr");
    const raw: RawExif | undefined = await exifr.default.parse(file, {
      pick: [
        "Make", "Model", "LensMake", "LensModel",
        "FNumber", "ExposureTime", "ISO", "FocalLength",
        "DateTimeOriginal", "latitude", "longitude",
      ],
      translateValues: false,
    });

    if (!raw) return {};

    const camera = [raw.Make, raw.Model].filter(Boolean).join(" ").trim() || undefined;
    const lens = raw.LensModel
      ? [raw.LensMake, raw.LensModel].filter(Boolean).join(" ").trim()
      : undefined;
    const aperture = raw.FNumber != null ? `f/${raw.FNumber}` : undefined;
    const shutter = raw.ExposureTime != null ? formatShutter(raw.ExposureTime) : undefined;
    const iso = raw.ISO != null ? String(raw.ISO) : undefined;
    const focalLength = raw.FocalLength != null ? `${raw.FocalLength}mm` : undefined;
    const date = raw.DateTimeOriginal ? formatDate(raw.DateTimeOriginal) : undefined;

    let location: string | undefined;
    if (raw.latitude != null && raw.longitude != null) {
      location = await reverseGeocode(raw.latitude, raw.longitude);
    }

    const meta: PhotoMeta = {};
    if (camera) meta.camera = camera;
    if (lens) meta.lens = lens;
    if (aperture) meta.aperture = aperture;
    if (shutter) meta.shutter = shutter;
    if (iso) meta.iso = iso;
    if (focalLength) meta.focalLength = focalLength;
    if (date) meta.date = date;
    if (location) meta.location = location;
    return meta;
  } catch {
    return {};
  }
}

// ── Reverse geocoding (Nominatim) ─────────────────────────────────────────────

const geocodeCache = new Map<string, string>();
let lastGeocodeFetch = 0;

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;

  // Nominatim: max 1 req/s
  const now = Date.now();
  const wait = 1000 - (now - lastGeocodeFetch);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastGeocodeFetch = Date.now();

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "User-Agent": "portfolio-cms/1.0" } }
    );
    if (!res.ok) return "";
    const json = await res.json() as {
      address?: {
        city?: string; town?: string; village?: string;
        state?: string; country?: string; country_code?: string;
      };
    };
    const addr = json.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? "";
    const country = addr.country_code?.toUpperCase() ?? addr.country ?? "";
    const location = [city, country].filter(Boolean).join(", ");
    geocodeCache.set(key, location);
    return location;
  } catch {
    return "";
  }
}
