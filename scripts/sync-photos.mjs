#!/usr/bin/env node
/**
 * Sync photos to Cloudflare R2
 *
 * What it does:
 *   1. For every category folder under public/photography/, finds originals that
 *      don't have a matching WebP in public/photography-webp/ yet, then compresses
 *      them with sharp (WebP, quality 85, max 2000px, auto-rotate).
 *   2. Uploads every WebP from public/photography-webp/ to R2.
 *      Skips files already in R2 unless --force is passed.
 *   3. Maps the disk folder name "Startrails" to the CMS slug "light-trails"
 *      so R2 keys match what portfolio-data.ts expects.
 *
 * Usage:
 *   node scripts/sync-photos.mjs            # skip files already in R2
 *   node scripts/sync-photos.mjs --force    # re-upload everything
 *   node scripts/sync-photos.mjs --dry-run  # print plan, no uploads
 *
 * Environment (reads from .env.local automatically):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
 *   R2_BUCKET_NAME  (default: "photography")
 *   R2_PUBLIC_URL   (e.g. https://photography.sohamkakra.com)
 */

import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

// ── Load .env.local ───────────────────────────────────────────────────────────

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch { /* ignore */ }

// ── Config ────────────────────────────────────────────────────────────────────

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME = "photography",
  R2_PUBLIC_URL = "",
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const FORCE     = process.argv.includes("--force");
const DRY_RUN   = process.argv.includes("--dry-run");
const MAX_WIDTH = 2000;
const QUALITY   = 85;

// Disk folder name → CMS/R2 slug (keys must match SLUG_TO_FOLDER in portfolio-data.ts)
const FOLDER_TO_SLUG = { Startrails: "light-trails" };

const PHOTOS_DIR      = path.resolve("public/photography");
const WEBP_DIR        = path.resolve("public/photography-webp");
const RAW_EXTENSIONS  = new Set([".nef", ".dng", ".cr2", ".arw", ".orf", ".rw2"]);
const SKIP_EXTENSIONS = new Set([".ds_store", ".tif", ".tiff"]); // tiff support unreliable; skip .DS_Store

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function canConvert(filename) {
  const ext = path.extname(filename).toLowerCase();
  return !SKIP_EXTENSIONS.has(ext) && ext !== "";
}

async function compress(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  // failOn:'error' ignores non-fatal EXIF warnings in NEF/DNG files
  const instance = sharp(src, { failOn: "error" });
  const meta = await instance.metadata();
  let pipeline = sharp(src, { failOn: "error" }).rotate();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
  }
  await pipeline.webp({ quality: QUALITY, effort: 4 }).toFile(dest);
}

async function existsInR2(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function upload(key, filePath) {
  const body = fs.readFileSync(filePath);
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: "image/webp",
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return body.length;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.error(`public/photography not found (cwd: ${process.cwd()})`);
    process.exit(1);
  }

  const folders = fs.readdirSync(PHOTOS_DIR).filter((f) => {
    const full = path.join(PHOTOS_DIR, f);
    return fs.statSync(full).isDirectory() && !f.startsWith(".");
  });

  console.log(`\n── Sync photos to R2 ──────────────────────────────────────────`);
  console.log(`   Bucket: ${R2_BUCKET_NAME}`);
  if (R2_PUBLIC_URL) console.log(`   Public: ${R2_PUBLIC_URL}`);
  console.log(`   Mode:   ${DRY_RUN ? "dry-run" : FORCE ? "force (re-upload all)" : "skip existing"}`);
  console.log(`   Folders: ${folders.join(", ")}\n`);

  let totalCompressed = 0;
  let totalUploaded   = 0;
  let totalSkipped    = 0;
  let totalFailed     = 0;
  let totalBytes      = 0;

  for (const folder of folders) {
    const slug = FOLDER_TO_SLUG[folder] ?? folder;
    console.log(`\n▸ ${folder}  →  photography/${slug}/`);

    // ── Step 1: compress any originals that don't have a WebP yet ─────────────

    const origDir = path.join(PHOTOS_DIR, folder);
    const webpFolder = path.join(WEBP_DIR, folder);
    const origFiles = fs.readdirSync(origDir).filter((f) => !f.startsWith("."));

    for (const origFile of origFiles) {
      if (!canConvert(origFile)) continue;
      const baseName = path.basename(origFile, path.extname(origFile));
      const webpDest = path.join(webpFolder, `${baseName}.webp`);
      if (fs.existsSync(webpDest)) continue; // already converted

      const ext = path.extname(origFile).toLowerCase();
      if (SKIP_EXTENSIONS.has(ext)) {
        console.log(`  ⚠ skip (unsupported format): ${origFile}`);
        continue;
      }

      process.stdout.write(`  ⟳ compress  ${origFile} …`);
      if (DRY_RUN) { console.log(" (dry-run)"); continue; }
      try {
        await compress(path.join(origDir, origFile), webpDest);
        const kb = Math.round(fs.statSync(webpDest).size / 1024);
        console.log(` ✓  ${kb} KB`);
        totalCompressed++;
      } catch (err) {
        console.log(` ✗  ${err.message}`);
        totalFailed++;
      }
    }

    // ── Step 2: upload all WebP files for this folder ─────────────────────────

    if (!fs.existsSync(webpFolder)) {
      console.log(`  (no webp files, skipping upload)`);
      continue;
    }

    const webpFiles = fs.readdirSync(webpFolder).filter((f) => f.endsWith(".webp")).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    for (const webpFile of webpFiles) {
      const key = `photography/${slug}/${webpFile}`;
      const filePath = path.join(webpFolder, webpFile);

      if (!FORCE && !DRY_RUN) {
        const exists = await existsInR2(key);
        if (exists) {
          process.stdout.write(`  · skip (exists)  ${webpFile}\n`);
          totalSkipped++;
          continue;
        }
      }

      const publicUrl = R2_PUBLIC_URL
        ? `${R2_PUBLIC_URL}/${key}`
        : `https://${R2_BUCKET_NAME}.r2.cloudflarestorage.com/${key}`;

      process.stdout.write(`  ↑ upload  ${webpFile} …`);
      if (DRY_RUN) { console.log(` (dry-run) → ${publicUrl}`); totalUploaded++; continue; }
      try {
        const bytes = await upload(key, filePath);
        totalBytes += bytes;
        totalUploaded++;
        console.log(` ✓  ${(bytes / 1024).toFixed(0)} KB → ${publicUrl}`);
      } catch (err) {
        console.log(` ✗  ${err.message}`);
        totalFailed++;
      }
    }
  }

  console.log(`\n── Summary ─────────────────────────────────────────────────────`);
  if (totalCompressed) console.log(`  Compressed:  ${totalCompressed} files`);
  console.log(`  Uploaded:    ${totalUploaded} files  (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
  if (totalSkipped)   console.log(`  Skipped:     ${totalSkipped} (already in R2)`);
  if (totalFailed)    console.log(`  Failed:      ${totalFailed}`);
  console.log("");

  if (R2_PUBLIC_URL) {
    console.log(`  Portfolio data source for photos:`);
    console.log(`    R2_PUBLIC_URL=${R2_PUBLIC_URL}  →  all photo srcs auto-switch to R2\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
