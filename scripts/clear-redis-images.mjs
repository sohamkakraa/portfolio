/**
 * clear-redis-images.mjs
 *
 * Clears the photography images stored in Upstash Redis so production
 * falls back to the manifest (photography-manifest.json) for all categories.
 *
 * Usage:
 *   node scripts/clear-redis-images.mjs
 *
 * Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from .env.local
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

// Read .env.local
const envPath = path.join(ROOT, ".env.local");
const env = {};
try {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key?.trim()) env[key.trim()] = rest.join("=").trim();
  }
} catch {
  console.error("Could not read .env.local");
  process.exit(1);
}

const URL = env.UPSTASH_REDIS_REST_URL;
const TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
const KEY = "portfolio:cms-v2";

if (!URL || !TOKEN) {
  console.error("UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing in .env.local");
  process.exit(1);
}

// Fetch current Redis value
async function redisGet(key) {
  const res = await fetch(`${URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const json = await res.json();
  return json.result;
}

async function redisSet(key, value) {
  const res = await fetch(`${URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
  return res.json();
}

const raw = await redisGet(KEY);
if (!raw) {
  console.log("No data found in Redis — nothing to clear.");
  process.exit(0);
}

const data = typeof raw === "string" ? JSON.parse(raw) : raw;
const cats = data?.photography?.categories ?? [];

console.log("Current stored categories:");
for (const c of cats) {
  console.log(`  ${c.slug}: ${c.images?.length ?? 0} stored images`);
}

// Clear images on all categories so they fall back to manifest defaults
const cleared = {
  ...data,
  photography: {
    ...data.photography,
    categories: cats.map((c) => ({ ...c, images: [] })),
  },
};

await redisSet(KEY, JSON.stringify(cleared));
console.log("\nCleared all stored images from Redis. Production will now use manifest defaults.");
