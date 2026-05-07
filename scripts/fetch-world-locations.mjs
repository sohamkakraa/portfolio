#!/usr/bin/env node
/**
 * Fetch the dr5hn countries+cities dataset (MIT-licensed, GitHub) and bake a
 * compact `data/world-locations.json` for the admin's country/city dropdowns.
 *
 * Source: https://github.com/dr5hn/countries-states-cities-database
 * Output shape:
 *   {
 *     "generated": "2026-05-07T00:00:00.000Z",
 *     "countries": [
 *       { "name": "Kenya", "iso2": "KE", "cities": ["Nairobi", "Mombasa", …] },
 *       …
 *     ]
 *   }
 *
 * Run: node scripts/fetch-world-locations.mjs
 */

import fs from "node:fs";
import path from "node:path";

const BASE = "https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json";
const SRC_CITIES = `${BASE}/countries+cities.json`;
const SRC_COUNTRIES = `${BASE}/countries.json`;
const OUT = path.join(process.cwd(), "data", "world-locations.json");

async function fetchJson(url) {
  console.log("fetching", url);
  const r = await fetch(url);
  if (!r.ok) {
    console.error("fetch failed", r.status, url);
    process.exit(1);
  }
  return r.json();
}

(async () => {
  const [raw, rawCountries] = await Promise.all([
    fetchJson(SRC_CITIES),
    fetchJson(SRC_COUNTRIES),
  ]);

  const iso2ByName = new Map();
  const emojiByName = new Map();
  for (const c of rawCountries) {
    if (c.name) {
      if (c.iso2) iso2ByName.set(c.name, c.iso2);
      if (c.emoji) emojiByName.set(c.name, c.emoji);
    }
  }

  const countries = raw
    .map((c) => {
      // dr5hn ships cities as either array of strings or objects depending on
      // the snapshot. Handle both.
      const rawCities = c.cities || [];
      const cityNames = rawCities
        .map((x) => (typeof x === "string" ? x : x?.name))
        .filter(Boolean);
      const dedup = Array.from(new Set(cityNames)).sort((a, b) => a.localeCompare(b));
      return {
        name: c.name,
        iso2: c.iso2 || iso2ByName.get(c.name),
        emoji: emojiByName.get(c.name),
        cities: dedup,
      };
    })
    .filter((c) => c.name)
    .sort((a, b) => a.name.localeCompare(b.name));

  const out = {
    generated: new Date().toISOString(),
    countries,
  };

  fs.writeFileSync(OUT, JSON.stringify(out));
  const size = fs.statSync(OUT).size;
  const totalCities = countries.reduce((s, c) => s + c.cities.length, 0);
  console.log(
    `wrote ${OUT}: ${(size / 1024).toFixed(0)} KB, ${countries.length} countries, ${totalCities} cities`
  );
})();
