#!/usr/bin/env node
/**
 * Upload compressed images/frames to Cloudflare R2
 *
 * Setup:
 *   npm install @aws-sdk/client-s3
 *
 * Environment variables (add to .env.local):
 *   R2_ACCOUNT_ID=your-cloudflare-account-id
 *   R2_ACCESS_KEY_ID=your-r2-access-key
 *   R2_SECRET_ACCESS_KEY=your-r2-secret-key
 *   R2_BUCKET_NAME=photography  (or whatever you named it)
 *   R2_PUBLIC_URL=https://photography.sohamkakra.com  (your custom domain)
 *
 * Usage:
 *   node scripts/upload-to-r2.mjs <dir> [prefix]
 *
 * Examples:
 *   node scripts/upload-to-r2.mjs ./compressed photography
 *   node scripts/upload-to-r2.mjs ./frames/startrail1 videos/startrail1
 */

import fs from "node:fs";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Load .env.local if present
try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^(\w+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  }
} catch { /* ignore */ }

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME = "photography",
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error("Missing R2 credentials. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY in .env.local");
  process.exit(1);
}

const inputDir = process.argv[2];
const prefix = process.argv[3] || "";

if (!inputDir) {
  console.error("Usage: node scripts/upload-to-r2.mjs <dir> [prefix]");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

const MIME_MAP = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".avif": "image/avif",
  ".json": "application/json",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

function collectFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

async function uploadOne(filePath) {
  const rel = path.relative(inputDir, filePath);
  const key = prefix ? `${prefix}/${rel}` : rel;
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_MAP[ext] || "application/octet-stream";
  const body = fs.readFileSync(filePath);

  await client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return { key, size: body.length };
}

async function main() {
  const files = collectFiles(inputDir);
  console.log(`\nUploading ${files.length} files to R2 bucket "${R2_BUCKET_NAME}"...`);
  if (prefix) console.log(`Prefix: ${prefix}/`);
  console.log("");

  let uploaded = 0;
  let failed = 0;
  let totalSize = 0;

  for (const file of files) {
    try {
      const result = await uploadOne(file);
      totalSize += result.size;
      uploaded++;
      console.log(`  ✓ ${result.key}  (${(result.size / 1024).toFixed(0)} KB)`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${path.relative(inputDir, file)}: ${err.message}`);
    }
  }

  const totalMB = (totalSize / 1024 / 1024).toFixed(1);
  console.log(`\n── Summary ──`);
  console.log(`  Uploaded: ${uploaded} files (${totalMB} MB)`);
  if (failed) console.log(`  Failed: ${failed}`);
  console.log(`  Bucket: ${R2_BUCKET_NAME}`);
  if (process.env.R2_PUBLIC_URL) {
    console.log(`  Public URL: ${process.env.R2_PUBLIC_URL}/${prefix || ""}`);
  }
  console.log("");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
