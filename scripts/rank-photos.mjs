/**
 * rank-photos.mjs
 *
 * Uses Claude claude-haiku-4-5-20251001 to analyze every image in public/photography-webp/,
 * assigns a quality rank (1–10), generates a short creative description,
 * and predicts a location where relevant.
 *
 * Results are written to data/photography-rankings.json and consumed
 * by lib/portfolio-data.ts to sort images and populate descriptions.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-... node scripts/rank-photos.mjs
 *
 * To re-analyze only missing entries (skip already-ranked images):
 *   ANTHROPIC_API_KEY=sk-... node scripts/rank-photos.mjs --incremental
 *
 * To force a full re-run:
 *   ANTHROPIC_API_KEY=sk-... node scripts/rank-photos.mjs --force
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const WEBP_DIR = path.join(ROOT, "public", "photography-webp");
const RANKINGS_PATH = path.join(ROOT, "data", "photography-rankings.json");

const INCREMENTAL = process.argv.includes("--incremental");
const FORCE = process.argv.includes("--force");

// Concurrency limit to avoid hitting API rate limits
const CONCURRENCY = 3;

// ─── helpers ────────────────────────────────────────────────────────────────

function loadExisting() {
  if (FORCE) return {};
  try {
    if (fs.existsSync(RANKINGS_PATH)) {
      return JSON.parse(fs.readFileSync(RANKINGS_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function imageToBase64(filePath) {
  return fs.readFileSync(filePath).toString("base64");
}

function slugToFolder(slug) {
  const MAP = { "light-trails": "Startrails" };
  return MAP[slug] ?? slug;
}

/** Scan public/photography-webp/ and return list of { slug, folder, file, key } */
function collectImages() {
  const images = [];
  if (!fs.existsSync(WEBP_DIR)) {
    console.error("No photography-webp directory found at", WEBP_DIR);
    process.exit(1);
  }
  for (const entry of fs.readdirSync(WEBP_DIR)) {
    const dir = path.join(WEBP_DIR, entry);
    if (!fs.statSync(dir).isDirectory()) continue;
    // The folder name is the slug in most cases; reverse-map Startrails → light-trails
    const slug = entry === "Startrails" ? "light-trails" : entry;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".webp"))) {
      images.push({
        slug,
        folder: entry,
        file,
        key: `${slug}/${file}`,
        filePath: path.join(dir, file),
      });
    }
  }
  return images;
}

async function analyzeImage(client, image, retries = 2) {
  const b64 = imageToBase64(image.filePath);

  const prompt = `You are a professional photography editor reviewing a portfolio image.

Category: ${image.slug.replace(/-/g, " ")}
Filename: ${image.file.replace(/\.[^/.]+$/, "")}

Analyze this photograph and respond with a single JSON object (no markdown fences). Fields:
- rank: integer 1–10 (10 = exceptional, publishable; 7–9 = strong portfolio quality; 4–6 = decent; 1–3 = weak technically or artistically)
- description: one evocative sentence (max 15 words) that captures the feeling or subject of the shot. No generic phrases like "a beautiful photo of" — be specific and poetic.
- location: the most specific real-world location you can infer (city, region, country, or landmark). If not determinable, return null.

Respond only with valid JSON, example: {"rank":8,"description":"Dust-gold light dissolves into a herd moving at dusk.","location":"Amboseli National Park, Kenya"}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 256,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: "image/webp", data: b64 },
              },
              { type: "text", text: prompt },
            ],
          },
        ],
      });

      const text = response.content.find((b) => b.type === "text")?.text ?? "";
      // Strip markdown fences if model adds them despite instructions
      const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      return {
        rank: Math.min(10, Math.max(1, Math.round(Number(parsed.rank) || 5))),
        description: (parsed.description ?? "").slice(0, 120),
        location: parsed.location ?? null,
      };
    } catch (err) {
      if (attempt === retries) {
        console.warn(`  ⚠  Failed to analyze ${image.key}: ${err.message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  return null;
}

async function runBatch(tasks, fn, concurrency) {
  const results = new Array(tasks.length);
  let idx = 0;
  async function worker() {
    while (idx < tasks.length) {
      const i = idx++;
      results[i] = await fn(tasks[i], i);
    }
  }
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── main ────────────────────────────────────────────────────────────────────

const key = process.env.ANTHROPIC_API_KEY;
if (!key) {
  console.error("Set ANTHROPIC_API_KEY environment variable.");
  process.exit(1);
}

const client = new Anthropic({ apiKey: key });
const existing = loadExisting();
const allImages = collectImages();

const toProcess = INCREMENTAL
  ? allImages.filter((img) => !existing[img.key])
  : allImages;

console.log(
  `Analyzing ${toProcess.length} image(s) (${allImages.length - toProcess.length} already ranked, skipped).`
);

if (toProcess.length === 0) {
  console.log("Nothing to do. Use --force to re-analyze all images.");
  process.exit(0);
}

let done = 0;
const results = await runBatch(toProcess, async (image) => {
  process.stdout.write(`  [${++done}/${toProcess.length}] ${image.key} … `);
  const result = await analyzeImage(client, image);
  if (result) {
    console.log(`rank=${result.rank} | ${result.description}`);
  } else {
    console.log("skipped (error)");
  }
  return { key: image.key, result };
}, CONCURRENCY);

// Merge into existing rankings
for (const { key: k, result } of results) {
  if (result) existing[k] = result;
}

fs.mkdirSync(path.dirname(RANKINGS_PATH), { recursive: true });
fs.writeFileSync(RANKINGS_PATH, JSON.stringify(existing, null, 2), "utf-8");
console.log(`\nSaved ${Object.keys(existing).length} entries to ${RANKINGS_PATH}`);
