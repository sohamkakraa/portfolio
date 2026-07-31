#!/usr/bin/env node
/**
 * File photographs from photo-inbox/ into the subject-organised archive.
 *
 * The archive is organised by subject and the sync pipeline only reads one level below
 * public/photography/, so a trip cannot own a folder there. This bridges the two: each
 * inbox folder is named "<category>--<Prefix>" and declares its own destination, so
 * uploading is a drag-and-drop and the renaming happens here rather than in Finder.
 *
 * Usage:
 *   node scripts/file-photos.mjs [--dry-run]
 *
 * For every photo-inbox/<category>--<Prefix>/ folder, moves each image to
 * public/photography/<category>/<Prefix> N.<ext>, where N carries on from the highest <Prefix>
 * already filed in that category.
 *
 * Filing no longer produces the published WebP. That belongs to `npm run photos:watermark`,
 * which is the only thing allowed to write public/photography-webp/, because a derivative made
 * any other way would be published without an invisible watermark and nothing on screen would
 * say so. One producer, so a frame cannot reach the web unmarked by anyone forgetting a step.
 *
 * Afterwards:
 *   npm run photos:watermark   mark and publish the new frames
 *   npm run photos:sync        push to R2 and rebuild the manifest
 */

import fs from "node:fs";
import path from "node:path";

const INBOX = path.resolve("photo-inbox");
const PHOTOS_DIR = path.resolve("public/photography");

const READABLE = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".heic", ".heif", ".tif", ".tiff", ".dng", ".cr2", ".nef", ".arw", ".orf", ".rw2"]);

const DRY_RUN = process.argv.includes("--dry-run");

function categories() {
  return fs
    .readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);
}

/** Highest N already used by "<prefix> N.<ext>" in a category, so numbering never collides. */
function highestIndex(dir, prefix) {
  if (!fs.existsSync(dir)) return 0;
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} (\\d+)\\.`, "i");
  let max = 0;
  for (const name of fs.readdirSync(dir)) {
    const m = name.match(pattern);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max;
}

function move(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch {
    // Different volume, or an external drive: fall back to a copy.
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
  }
}

async function main() {
  if (!fs.existsSync(INBOX)) {
    console.error(`No inbox at ${path.relative(process.cwd(), INBOX)}/`);
    process.exit(1);
  }

  const valid = categories();
  const folders = fs
    .readdirSync(INBOX, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith("."))
    .map((e) => e.name);

  console.log(`\n── File photos ────────────────────────────────────────────────`);
  if (DRY_RUN) console.log(`   DRY RUN — nothing will be moved\n`);

  let filed = 0;
  let empty = 0;
  const problems = [];

  for (const folder of folders) {
    const match = folder.match(/^(.+?)--(.+)$/);
    if (!match) {
      problems.push(`${folder}/ — name it "<category>--<Prefix>", e.g. "landscape--Grindelwald"`);
      continue;
    }
    const [, category, prefix] = match;
    if (!valid.includes(category)) {
      problems.push(`${folder}/ — no category "${category}". Valid: ${valid.join(", ")}`);
      continue;
    }

    const srcDir = path.join(INBOX, folder);
    const files = fs
      .readdirSync(srcDir)
      .filter((f) => !f.startsWith(".") && READABLE.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (files.length === 0) {
      empty += 1;
      continue;
    }

    const destDir = path.join(PHOTOS_DIR, category);
    let n = highestIndex(destDir, prefix);

    console.log(`  ${folder}/ → ${category}/ as "${prefix} ${n + 1}"…`);

    for (const file of files) {
      const ext = path.extname(file);
      n += 1;
      const base = `${prefix} ${n}`;
      const dest = path.join(destDir, `${base}${ext}`);

      if (DRY_RUN) {
        console.log(`    ${file}  →  ${category}/${base}${ext}`);
        filed += 1;
        continue;
      }

      move(path.join(srcDir, file), dest);
      filed += 1;
      console.log(`    ✓ ${base}${ext}`);
    }
  }

  console.log(`\n── Summary ─────────────────────────────────────────────────────`);
  console.log(`  Filed:       ${filed} files`);
  if (empty) console.log(`  Empty:       ${empty} folder(s) waiting for uploads`);
  if (problems.length) {
    console.log(`\n  Needs attention:`);
    for (const p of problems) console.log(`    ! ${p}`);
  }
  if (filed && !DRY_RUN) {
    console.log(`\n  Next: npm run photos:watermark   (mark and publish — nothing is on the`);
    console.log(`        web until this runs, by design)`);
    console.log(`        npm run photos:sync         (upload to R2, rebuild manifest)`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
