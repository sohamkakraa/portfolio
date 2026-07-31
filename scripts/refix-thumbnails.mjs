/**
 * Re-convert photographs whose WebP is really an embedded camera thumbnail.
 *
 * sharp reports success on RAW files by handing back the preview JPEG the camera wrote into
 * the file, so a full exposure became a 160x120 WebP with no error anywhere. This finds the
 * casualties by measuring the output rather than trusting it, and reconverts from the original.
 *
 *   node scripts/refix-thumbnails.mjs --dry-run
 *   node scripts/refix-thumbnails.mjs
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { toWebp, MAX_WIDTH, QUALITY } from "./lib/webp.mjs";

const SRC_ROOT = "public/photography";
const OUT_ROOT = "public/photography-webp";
const DRY = process.argv.includes("--dry-run");
const MIN_WIDTH = 1000;

/** The original a WebP was made from, whatever extension it used. */
function findOriginal(category, base) {
  const dir = path.join(SRC_ROOT, category);
  if (!fs.existsSync(dir)) return null;
  const match = fs
    .readdirSync(dir)
    .find((f) => path.basename(f, path.extname(f)).toLowerCase() === base.toLowerCase());
  return match ? path.join(dir, match) : null;
}

const suspects = [];
for (const category of fs.readdirSync(OUT_ROOT)) {
  const dir = path.join(OUT_ROOT, category);
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".webp")) continue;
    const webp = path.join(dir, file);
    let meta;
    try {
      meta = await sharp(webp).metadata();
    } catch {
      suspects.push({ category, file, webp, why: "unreadable" });
      continue;
    }
    if ((meta.width ?? 0) < MIN_WIDTH && (meta.height ?? 0) < MIN_WIDTH) {
      suspects.push({ category, file, webp, why: `${meta.width}x${meta.height}` });
    }
  }
}

console.log(`${suspects.length} thumbnail-sized WebP file(s) found\n`);

let fixed = 0;
const failed = [];
for (const s of suspects) {
  const base = path.basename(s.file, ".webp");
  const original = findOriginal(s.category, base);
  if (!original) {
    failed.push(`${s.category}/${s.file} — no original found`);
    continue;
  }
  if (DRY) {
    console.log(`  would refix ${s.category}/${s.file} (${s.why}) from ${path.extname(original)}`);
    continue;
  }
  try {
    const via = await toWebp(original, s.webp, { maxWidth: MAX_WIDTH, quality: QUALITY });
    const after = await sharp(s.webp).metadata();
    const kb = Math.round(fs.statSync(s.webp).size / 1024);
    console.log(
      `  ${s.category}/${s.file}: ${s.why} → ${after.width}x${after.height} (${kb}kb, via ${via})`
    );
    fixed += 1;
  } catch (err) {
    failed.push(`${s.category}/${s.file} — ${err.message}`);
  }
}

console.log(`\n${DRY ? "dry run" : `refixed ${fixed}`}`);
if (failed.length) {
  console.log(`\nstill broken (${failed.length}):`);
  for (const f of failed) console.log(`  ${f}`);
  process.exitCode = 1;
}
