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

// Strip hedging words and split into candidate place strings to try in order.
// AI descriptions often look like:
//   "Southern African savanna, likely Botswana or Zimbabwe"
//   "Atlantic Coast salt marsh, Eastern United States"
//   "East African savanna (likely Kenya or Tanzania)"
// We try the most specific phrase first, then fall back to any country names found.
function buildQueries(raw) {
  const HEDGE = /\b(likely|possibly|perhaps|either|or similar|or comparable|maybe|presumably)\b/gi;
  const NOISE = /[()]/g;
  const cleaned = raw.replace(HEDGE, "").replace(NOISE, " ").replace(/\s+/g, " ").trim();
  const candidates = new Set();
  candidates.add(cleaned);

  // Comma chunks, longest-first
  const parts = cleaned.split(",").map((s) => s.trim()).filter(Boolean);
  for (const p of parts) candidates.add(p);

  // " or " splits — try each side
  for (const p of parts) {
    if (/\bor\b/i.test(p)) {
      for (const sub of p.split(/\bor\b/i).map((s) => s.trim()).filter(Boolean)) candidates.add(sub);
    }
  }

  // Strip leading directionals from comma chunks: "Eastern United States" → "United States"
  const DIR = /^(northern|southern|eastern|western|central|north|south|east|west|upper|lower|coastal|inland)\s+/i;
  for (const c of [...candidates]) {
    const stripped = c.replace(DIR, "").trim();
    if (stripped && stripped !== c) candidates.add(stripped);
  }

  // Last-resort country guesses by keyword
  const COUNTRY_HINTS = [
    "Botswana","Zimbabwe","Kenya","Tanzania","South Africa","Namibia","Iceland","Hawaii",
    "United States","Scandinavia","Norway","Finland","India","Karnataka","Himachal Pradesh",
    "Ladakh","Maharashtra","Goa","Netherlands","UAE","United Arab Emirates","Dubai","Abu Dhabi",
    "Japan","Tokyo","UK","Scotland","England",
  ];
  for (const c of COUNTRY_HINTS) {
    if (cleaned.toLowerCase().includes(c.toLowerCase())) candidates.add(c);
  }

  return [...candidates].filter((q) => q.length >= 3);
}

async function geocodeOne(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=3&addressdetails=1&accept-language=en`;
  const r = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json",
      "Accept-Language": "en",
    },
  });
  if (!r.ok) throw new Error(`nominatim ${r.status}`);
  const arr = await r.json();
  if (!arr.length) return null;

  // Prefer Latin-script display names; skip results whose name is non-ASCII when alternates exist.
  const isLatin = (s) => /^[\x00-\x7FÀ-ſ]+$/.test(s);
  const sorted = [...arr].sort((a, b) => (isLatin(a.display_name) ? 0 : 1) - (isLatin(b.display_name) ? 0 : 1));
  const m = sorted[0];

  const a = m.address || {};
  const city = a.city || a.town || a.village || a.county || a.state || m.display_name.split(",")[0].trim();
  const country = a.country || m.display_name.split(",").slice(-1)[0].trim();
  return {
    city,
    country,
    countryCode: (a.country_code || "").toUpperCase(),
    lat: parseFloat(m.lat),
    lon: parseFloat(m.lon),
    source: "nominatim",
    raw: query,
  };
}

// If the original query mentions a continent or specific country, the resolved
// country must be on the same continent / match. Otherwise reject.
const CONTINENT_KEYWORDS = {
  africa: ["AF"],
  african: ["AF"],
  europe: ["EU"],
  european: ["EU"],
  asian: ["AS"],
  asia: ["AS"],
  scandinavia: ["EU"],
  scandinavian: ["EU"],
  himalaya: ["AS"],
  himalayas: ["AS"],
  himalayan: ["AS"],
  arctic: ["AR"],
};
const COUNTRY_TO_CONT = {
  // Africa
  KE: "AF", TZ: "AF", UG: "AF", ZA: "AF", BW: "AF", ZW: "AF", NA: "AF",
  ET: "AF", RW: "AF", MZ: "AF", MW: "AF", AO: "AF", CM: "AF", NG: "AF",
  SN: "AF", GH: "AF", MA: "AF", EG: "AF", DZ: "AF", TN: "AF", LY: "AF",
  // Europe
  NL: "EU", DE: "EU", FR: "EU", IT: "EU", ES: "EU", PT: "EU", GB: "EU",
  IE: "EU", BE: "EU", AT: "EU", CH: "EU", DK: "EU", SE: "EU", NO: "EU",
  FI: "EU", IS: "EU", PL: "EU", CZ: "EU", HU: "EU", RO: "EU", GR: "EU",
  // Asia
  IN: "AS", CN: "AS", JP: "AS", KR: "AS", TH: "AS", VN: "AS", PH: "AS",
  ID: "AS", MY: "AS", SG: "AS", AE: "AS", SA: "AS", QA: "AS", OM: "AS",
  IL: "AS", LB: "AS", TR: "AS", IR: "AS", PK: "AS", BD: "AS", LK: "AS",
  NP: "AS", MM: "AS", KH: "AS", LA: "AS", TW: "AS",
  // Americas
  US: "NA", CA: "NA", MX: "NA", BR: "SA", AR: "SA", CL: "SA", PE: "SA",
  CO: "SA", VE: "SA", EC: "SA", BO: "SA", UY: "SA", PY: "SA",
  // Oceania
  AU: "OC", NZ: "OC", FJ: "OC",
};

function checkContinent(query, result) {
  if (!result?.countryCode) return true;
  const lower = query.toLowerCase();
  const expected = new Set();
  for (const [kw, conts] of Object.entries(CONTINENT_KEYWORDS)) {
    if (lower.includes(kw)) for (const c of conts) expected.add(c);
  }
  if (!expected.size) return true; // no continent hint — trust geocoder
  const got = COUNTRY_TO_CONT[result.countryCode];
  return got ? expected.has(got) : true;
}

async function geocode(rawQuery) {
  const queries = buildQueries(rawQuery);
  let firstAcceptable = null;
  for (const q of queries) {
    try {
      const result = await geocodeOne(q);
      if (result) {
        if (checkContinent(rawQuery, result)) return result;
        if (!firstAcceptable) firstAcceptable = result; // remember as last-resort
      }
    } catch (err) {
      console.error("  query failed:", q, err.message);
    }
    await sleep(RATE_MS);
  }
  return null; // strict: no continent-mismatched match returned
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
