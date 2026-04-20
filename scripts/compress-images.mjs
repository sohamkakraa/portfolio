#!/usr/bin/env node
/**
 * Batch image compression script
 * Converts images to WebP at quality 85, max 2000px wide
 *
 * Usage:
 *   node scripts/compress-images.mjs <input-dir> [output-dir]
 *
 * Examples:
 *   node scripts/compress-images.mjs ./raw-photos ./compressed
 *   node scripts/compress-images.mjs ./public/photography ./public/photography-webp
 *
 * The script preserves directory structure. If no output dir is given,
 * it defaults to <input-dir>-webp/
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const MAX_WIDTH = 2000;
const QUALITY = 85;
const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp", ".avif", ".heic", ".heif"]);

const inputDir = process.argv[2];
const outputDir = process.argv[3] || `${inputDir}-webp`;

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
  const destDir = path.dirname(dest);

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const meta = await sharp(src).metadata();
  let pipeline = sharp(src).rotate(); // auto-rotate by EXIF

  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: QUALITY, effort: 4 }).toFile(dest);

  const srcSize = fs.statSync(src).size;
  const destSize = fs.statSync(dest).size;
  const saved = ((1 - destSize / srcSize) * 100).toFixed(1);

  return { src: rel, dest: path.relative(outputDir, dest), srcSize, destSize, saved };
}

async function main() {
  const files = collectFiles(inputDir);
  console.log(`\nFound ${files.length} images in ${inputDir}`);
  console.log(`Output: ${outputDir}\n`);

  let totalSrc = 0;
  let totalDest = 0;
  let processed = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const result = await compressOne(file);
      totalSrc += result.srcSize;
      totalDest += result.destSize;
      processed++;
      const srcMB = (result.srcSize / 1024 / 1024).toFixed(1);
      const destMB = (result.destSize / 1024 / 1024).toFixed(1);
      console.log(`  ✓ ${result.src}  ${srcMB}MB → ${destMB}MB  (-${result.saved}%)`);
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
  if (failed) console.log(`  Failed: ${failed}`);
  console.log(`  Original:   ${totalSrcMB} MB`);
  console.log(`  Compressed: ${totalDestMB} MB`);
  console.log(`  Saved:      ${totalSaved}%\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
