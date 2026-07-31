#!/usr/bin/env node
/**
 * Batch image compression script
 * Converts images to WebP at quality 85, max 2000px wide
 *
 * Usage:
 *   node scripts/compress-images.mjs <input-dir> [output-dir] [--skip-existing]
 *
 * Examples:
 *   node scripts/compress-images.mjs ./raw-photos ./compressed
 *   node scripts/compress-images.mjs ./public/photography ./public/photography-webp
 *
 * The script preserves directory structure. If no output dir is given,
 * it defaults to <input-dir>-webp/
 *
 * --skip-existing only writes WebPs that are missing, which is what you want when a handful
 * of new originals have landed in an archive of several hundred.
 */

import fs from "node:fs";
import path from "node:path";
import { toWebp, MAX_WIDTH, QUALITY } from "./lib/webp.mjs";

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp", ".avif", ".heic", ".heif", ".dng", ".cr2", ".nef", ".arw", ".orf", ".rw2", ".webp"]);

const args = process.argv.slice(2);
const SKIP_EXISTING = args.includes("--skip-existing");
const positional = args.filter((a) => !a.startsWith("--"));

const inputDir = positional[0];
const outputDir = positional[1] || `${inputDir}-webp`;

if (!inputDir) {
  console.error("Usage: node scripts/compress-images.mjs <input-dir> [output-dir]");
  process.exit(1);
}

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory not found: ${inputDir}`);
  process.exit(1);
}

function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else if (SUPPORTED.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
}

async function compressOne(src) {
  const rel = path.relative(inputDir, src);
  const dest = path.join(outputDir, rel.replace(path.extname(rel), ".webp"));

  if (SKIP_EXISTING && fs.existsSync(dest)) return null;

  const via = await toWebp(src, dest, { maxWidth: MAX_WIDTH, quality: QUALITY });

  const srcSize = fs.statSync(src).size;
  const destSize = fs.statSync(dest).size;
  const saved = ((1 - destSize / srcSize) * 100).toFixed(1);

  return { src: rel, dest: path.relative(outputDir, dest), srcSize, destSize, saved, via };
}

async function main() {
  const files = collectFiles(inputDir);
  console.log(`\nFound ${files.length} images in ${inputDir}`);
  console.log(`Output: ${outputDir}\n`);

  let totalSrc = 0;
  let totalDest = 0;
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const result = await compressOne(file);
      if (!result) {
        skipped++;
        continue;
      }
      totalSrc += result.srcSize;
      totalDest += result.destSize;
      processed++;
      const srcMB = (result.srcSize / 1024 / 1024).toFixed(1);
      const destMB = (result.destSize / 1024 / 1024).toFixed(1);
      console.log(
        `  ✓ ${result.src}  ${srcMB}MB → ${destMB}MB  (-${result.saved}%)${
          result.via === "sips" ? "  (via sips)" : ""
        }`
      );
    } catch (err) {
      failed++;
      console.error(`  ✗ ${path.relative(inputDir, file)}: ${err.message}`);
    }
  }

  const totalSrcMB = (totalSrc / 1024 / 1024).toFixed(1);
  const totalDestMB = (totalDest / 1024 / 1024).toFixed(1);
  const totalSaved = totalSrc > 0 ? ((1 - totalDest / totalSrc) * 100).toFixed(1) : 0;

  console.log(`\n── Summary ──`);
  console.log(`  Processed: ${processed} images`);
  if (skipped) console.log(`  Skipped:   ${skipped} (WebP already exists)`);
  if (failed) console.log(`  Failed: ${failed}`);
  console.log(`  Original:   ${totalSrcMB} MB`);
  console.log(`  Compressed: ${totalDestMB} MB`);
  console.log(`  Saved:      ${totalSaved}%\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
