#!/usr/bin/env node
/**
 * Enrich photo locations using Nominatim (OpenStreetMap) free geocoding API.
 *
 * Reads `data/photography-rankings.json`, takes the AI-generated `location` text
 * for each photo, geocodes it, and writes structured city/country/lat/lon to
 * `data/photo-locations.json`.
 *
 * Nominatim usage policy: max 1 req/s, valid User-Agent required.
 * https://operations.osmfoundation.org/policies/nominatim/
 *
 * Run: node scripts/enrich-photo-locations.mjs [--force]
 *
 * --force re-queries every entry; otherwise resume from existing output.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const RANKINGS = path.join(ROOT, "data/photography-rankings.json");
const OUT = path.join(ROOT, "data/photo-locations.json");
const FORCE = process.argv.includes("--force");

const UA = "sohamkakra-portfolio/1.0 (https://sohamkakra.com)";
const RATE_MS = 1100;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function geocode(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
  if (!r.ok) throw new Error(`nominatim ${r.status}`);
  const arr = await r.json();
  if (!arr.length) return null;
  const m = arr[0];
  const a = m.address || {};
  return {
    city: a.city || a.town || a.village || a.county || a.state || m.display_name.split(",")[0].trim(),
    country: a.country || m.display_name.split(",").slice(-1)[0].trim(),
    countryCode: (a.country_code || "").toUpperCase(),
    lat: parseFloat(m.lat),
    lon: parseFloat(m.lon),
    source: "nominatim",
    raw: query,
  };
}

(async () => {
  if (!fs.existsSync(RANKINGS)) {
    console.error("rankings file missing:", RANKINGS);
    process.exit(1);
  }
  const rankings = JSON.parse(fs.readFileSync(RANKINGS, "utf8"));
  const existing = !FORCE && fs.existsSync(OUT)
    ? JSON.parse(fs.readFileSync(OUT, "utf8"))
    : {};

  const keys = Object.keys(rankings);
  let done = 0, hit = 0, skip = 0, miss = 0;

  for (const key of keys) {
    done++;
    const entry = rankings[key];
    if (!entry?.location) { skip++; continue; }
    if (!FORCE && existing[key]) { skip++; continue; }
    try {
      const result = await geocode(entry.location);
      if (result) {
        existing[key] = result;
        hit++;
        console.log(`[${done}/${keys.length}] ${key} → ${result.city}, ${result.country}`);
      } else {
        miss++;
        console.log(`[${done}/${keys.length}] ${key} → no match for "${entry.location}"`);
      }
    } catch (err) {
      miss++;
      console.error(`[${done}/${keys.length}] ${key} error:`, err.message);
    }
    fs.writeFileSync(OUT, JSON.stringify(existing, null, 2));
    await sleep(RATE_MS);
  }

  console.log(`\nresolved: ${hit}  skipped: ${skip}  missed: ${miss}  total: ${keys.length}`);
})();
