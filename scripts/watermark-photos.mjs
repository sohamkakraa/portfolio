/**
 * Rebuild the public derivatives with an invisible watermark embedded in every frame.
 *
 * The chain is decode -> watermark -> encode, and the order is the whole point. The watermark
 * has to go into real pixels before anything lossy happens, so originals are decoded to
 * lossless PNG first, marked, and only then encoded to the WebP the site actually serves.
 *
 * What this buys, and what it does not. It does not stop anyone taking a copy — nothing on the
 * web can, and screenshot blocking in particular is not a thing browsers offer for images. What
 * it buys is that every copy stays attributable: the mark survives screenshotting, re-encoding,
 * social re-upload and moderate cropping, so a stolen frame can still be shown to be yours.
 *
 *   npm run photos:watermark          rebuild anything missing or out of date
 *   npm run photos:watermark -- --all rebuild everything from scratch
 *   npm run photos:watermark -- --dry list what would change
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { decodeToPng } from "./lib/webp.mjs";

const ORIGINALS = "public/photography";
const DERIVATIVES = "public/photography-webp";
const MANIFEST = "data/watermarks.json";
const PYTHON = ".venv-photo/bin/python";
const EMBED = "scripts/lib/trustmark_embed.py";

/** 1600px long edge: still excellent on a retina display, much less useful as a print. */
const LONG_EDGE = 1600;
/** Higher than the old 85. The cap on size is the deterrent; within it, quality should be real. */
const QUALITY = 92;

const SOURCE_EXT = new Set([
  ".jpg", ".jpeg", ".png", ".tif", ".tiff", ".heic", ".heif",
  ".nef", ".dng", ".cr2", ".cr3", ".arw", ".raf", ".orf", ".rw2", ".srw",
]);

const args = new Set(process.argv.slice(2));
const REBUILD_ALL = args.has("--all");
const DRY_RUN = args.has("--dry");

/**
 * A stable 8-character id derived from the photograph's path.
 *
 * Deterministic on purpose: re-running the pipeline must not reissue identifiers, or the
 * manifest stops matching frames that are already out in the world. Uppercase base36 so it
 * fits the ASCII7 payload TrustMark encodes.
 */
function watermarkId(relPath) {
  const digest = crypto.createHash("sha256").update(relPath).digest();
  let n = digest.readUInt32BE(0) * 2 ** 16 + digest.readUInt16BE(4);
  let out = "";
  while (out.length < 6) {
    out = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 36] + out;
    n = Math.floor(n / 36);
  }
  return `SK${out}`;
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (SOURCE_EXT.has(path.extname(entry.name).toLowerCase())) out.push(full);
  }
  return out;
}

const derivativeFor = (src) =>
  path.join(
    DERIVATIVES,
    path.relative(ORIGINALS, path.dirname(src)),
    `${path.basename(src, path.extname(src))}.webp`
  );

function isStale(src, dest) {
  if (REBUILD_ALL || !fs.existsSync(dest)) return true;
  return fs.statSync(src).mtimeMs > fs.statSync(dest).mtimeMs;
}

async function main() {
  if (!fs.existsSync(PYTHON)) {
    console.error(
      `TrustMark environment missing. Run:\n  npm run photos:setup\n(expected ${PYTHON})`
    );
    process.exit(1);
  }
  if (!fs.existsSync(ORIGINALS)) {
    console.error(`no originals at ${ORIGINALS}`);
    process.exit(1);
  }

  const sources = walk(ORIGINALS);
  const todo = sources.filter((s) => isStale(s, derivativeFor(s)));

  console.log(`${sources.length} originals, ${todo.length} to (re)build at ${LONG_EDGE}px q${QUALITY}`);
  if (!todo.length) return;

  // Collisions are vanishingly unlikely across a few hundred files, but a silent one would
  // attribute two photographs to a single identifier, so check rather than hope.
  const byId = new Map();
  for (const src of sources) {
    const rel = path.relative(ORIGINALS, src);
    const id = watermarkId(rel);
    if (byId.has(id)) {
      console.error(`id collision ${id}: ${byId.get(id)} and ${rel}`);
      process.exit(1);
    }
    byId.set(id, rel);
  }

  if (DRY_RUN) {
    for (const src of todo) {
      console.log(`  ${watermarkId(path.relative(ORIGINALS, src))}  ${path.relative(ORIGINALS, src)}`);
    }
    return;
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "wm-"));
  const jobs = [];
  const failures = [];

  process.stdout.write("decoding");
  for (const src of todo) {
    const rel = path.relative(ORIGINALS, src);
    const id = watermarkId(rel);
    const flat = id;
    const plain = path.join(work, `${flat}.in.png`);
    try {
      await decodeToPng(src, plain, { maxWidth: LONG_EDGE });
      jobs.push({ in: plain, out: path.join(work, `${flat}.out.png`), id, rel, src });
      process.stdout.write(".");
    } catch (err) {
      failures.push(`${rel}: ${err.message}`);
      process.stdout.write("x");
    }
  }
  console.log(` ${jobs.length} decoded`);

  const jobsFile = path.join(work, "jobs.json");
  const resultsFile = path.join(work, "results.json");
  fs.writeFileSync(
    jobsFile,
    JSON.stringify(jobs.map(({ in: i, out, id }) => ({ in: i, out, id })))
  );

  console.log("embedding watermarks");
  execFileSync(PYTHON, [EMBED, jobsFile, resultsFile], { stdio: "inherit" });

  const results = new Map(
    JSON.parse(fs.readFileSync(resultsFile, "utf8")).map((r) => [r.id, r])
  );

  const manifest = fs.existsSync(MANIFEST)
    ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
    : { note: "", photographs: {} };
  manifest.note =
    "Maps the invisible TrustMark identifier embedded in each published frame to the photograph " +
    "it belongs to. This is the lookup side of a C2PA-style soft binding: the pixels carry the " +
    "id, this file carries the meaning. Committed so git history timestamps the claim.";
  manifest.algorithm = "TrustMark variant Q, BCH_4 error correction (C2PA approved soft binding)";
  manifest.photographs ??= {};

  process.stdout.write("encoding");
  for (const job of jobs) {
    const result = results.get(job.id);
    if (!result?.verified) {
      failures.push(`${job.rel}: watermark did not verify`);
      process.stdout.write("x");
      continue;
    }
    const dest = derivativeFor(job.src);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await sharp(job.out).webp({ quality: QUALITY, effort: 6 }).toFile(dest);

    manifest.photographs[job.id] = {
      file: job.rel,
      published: path.relative("public", dest),
      category: path.dirname(job.rel).split(path.sep)[0],
      width: result.width,
      height: result.height,
      psnr: result.psnr,
      sha256: crypto.createHash("sha256").update(fs.readFileSync(dest)).digest("hex").slice(0, 32),
      embedded: new Date().toISOString().slice(0, 10),
    };
    process.stdout.write(".");
  }
  console.log("");

  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.rmSync(work, { recursive: true, force: true });

  const marked = Object.keys(manifest.photographs).length;
  console.log(`\n${marked} photographs watermarked and catalogued in ${MANIFEST}`);
  if (failures.length) {
    console.log(`\n${failures.length} failed:`);
    for (const f of failures) console.log(`  ${f}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
