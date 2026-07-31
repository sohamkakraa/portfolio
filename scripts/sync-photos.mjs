#!/usr/bin/env node
/**
 * Sync photos to Cloudflare R2
 *
 * What it does:
 *   1. Uploads every WebP from public/photography-webp/ to R2, refusing any file that is not
 *      recorded in data/watermarks.json. Skips files already in R2 unless --force is passed.
 *   2. Maps the disk folder name "Startrails" to the CMS slug "light-trails"
 *      so R2 keys match what portfolio-data.ts expects.
 *
 * This script used to compress originals itself whenever a WebP was missing, which made it a
 * second, silent producer of published images — and the copies it made carried no watermark.
 * R2 is what visitors actually read, so it is the right place for the last check rather than
 * another way in. Derivatives are made in exactly one place now: `npm run photos:watermark`.
 *
 * It also no longer needs the originals to be on disk, which matters because they are gitignored
 * and a fresh clone will not have them.
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

// Disk folder name → CMS/R2 slug (keys must match SLUG_TO_FOLDER in portfolio-data.ts)
const FOLDER_TO_SLUG = { Startrails: "light-trails" };

const WEBP_DIR      = path.resolve("public/photography-webp");
const WATERMARKS    = path.resolve("data/watermarks.json");

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * The set of derivatives that are known to carry an invisible watermark, keyed the way the
 * watermark manifest records them: paths relative to public/.
 */
function watermarkedPaths() {
  if (!fs.existsSync(WATERMARKS)) return null;
  const manifest = JSON.parse(fs.readFileSync(WATERMARKS, "utf-8"));
  return new Set(Object.values(manifest.photographs ?? {}).map((p) => p.published));
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
  if (!fs.existsSync(WEBP_DIR)) {
    console.error(`public/photography-webp not found (cwd: ${process.cwd()})`);
    console.error(`Run: npm run photos:watermark`);
    process.exit(1);
  }

  const marked = watermarkedPaths();
  if (!marked) {
    console.error(`No watermark manifest at data/watermarks.json.`);
    console.error(`Nothing should reach R2 unmarked, so run this first:`);
    console.error(`  npm run photos:watermark -- --all`);
    process.exit(1);
  }

  const folders = fs.readdirSync(WEBP_DIR).filter((f) => {
    const full = path.join(WEBP_DIR, f);
    return fs.statSync(full).isDirectory() && !f.startsWith(".");
  });

  console.log(`\n── Sync photos to R2 ──────────────────────────────────────────`);
  console.log(`   Bucket: ${R2_BUCKET_NAME}`);
  if (R2_PUBLIC_URL) console.log(`   Public: ${R2_PUBLIC_URL}`);
  console.log(`   Mode:   ${DRY_RUN ? "dry-run" : FORCE ? "force (re-upload all)" : "skip existing"}`);
  console.log(`   Marked: ${marked.size} watermarked derivatives on record`);
  console.log(`   Folders: ${folders.join(", ")}\n`);

  let totalUploaded   = 0;
  let totalSkipped    = 0;
  let totalFailed     = 0;
  let totalBytes      = 0;
  const unmarked      = [];

  for (const folder of folders) {
    const slug = FOLDER_TO_SLUG[folder] ?? folder;
    console.log(`\n▸ ${folder}  →  photography/${slug}/`);

    const webpFolder = path.join(WEBP_DIR, folder);
    const webpFiles = fs.readdirSync(webpFolder).filter((f) => f.endsWith(".webp")).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );

    for (const webpFile of webpFiles) {
      const key = `photography/${slug}/${webpFile}`;
      const filePath = path.join(webpFolder, webpFile);

      // The gate. A derivative that is not in the manifest was made by something other than the
      // watermark pipeline, so it carries no mark and does not go to the public bucket.
      const rel = path.relative(path.resolve("public"), filePath);
      if (!marked.has(rel)) {
        console.log(`  ✗ refused (no watermark on record)  ${webpFile}`);
        unmarked.push(rel);
        totalFailed++;
        continue;
      }

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

  // ── Write photography manifest ────────────────────────────────────────────
  // Regenerate data/photography-manifest.json from public/photography-webp/
  // so portfolio-data.ts knows what photos exist without filesystem scanning.

  if (!DRY_RUN) {
    const manifestCategories = {};
    for (const folder of folders) {
      const slug = FOLDER_TO_SLUG[folder] ?? folder;
      const webpFolder = path.join(WEBP_DIR, folder);
      if (!fs.existsSync(webpFolder)) continue;
      const files = fs.readdirSync(webpFolder)
        .filter((f) => f.endsWith(".webp"))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      if (files.length) manifestCategories[slug] = files;
    }
    const manifestPath = path.resolve("data/photography-manifest.json");
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, JSON.stringify(
      { generated: new Date().toISOString(), categories: manifestCategories }, null, 2
    ));
    const total = Object.values(manifestCategories).reduce((s, a) => s + a.length, 0);
    console.log(`  Manifest:    data/photography-manifest.json  (${total} photos across ${Object.keys(manifestCategories).length} categories)`);
  }

  console.log(`\n── Summary ─────────────────────────────────────────────────────`);
  console.log(`  Uploaded:    ${totalUploaded} files  (${(totalBytes / 1024 / 1024).toFixed(1)} MB)`);
  if (totalSkipped)   console.log(`  Skipped:     ${totalSkipped} (already in R2)`);
  if (totalFailed)    console.log(`  Failed:      ${totalFailed}`);
  if (unmarked.length) {
    console.log(`\n  ${unmarked.length} derivative(s) refused for having no watermark on record:`);
    for (const u of unmarked.slice(0, 10)) console.log(`    ${u}`);
    if (unmarked.length > 10) console.log(`    …and ${unmarked.length - 10} more`);
    console.log(`\n  Publish them properly with:  npm run photos:watermark`);
    process.exitCode = 1;
  }
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
