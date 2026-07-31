/**
 * Shared WebP conversion, with a macOS fallback for the formats sharp cannot really read.
 *
 * Two separate failures, one fix. HEIC fails loudly: libvips parses the container but the
 * bundled build has no HEVC decoder, so it throws at pixel time. Camera RAW fails silently,
 * which is worse — sharp "succeeds" on a NEF or DNG by returning the embedded preview, so a
 * 6000x4000 exposure converts to a 160x120 thumbnail and nothing reports a problem until you
 * look at the picture. Sixteen frames in this archive were quietly ruined that way.
 *
 * macOS ImageIO decodes both properly, so hand it the decode and let sharp finish the job.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";

export const MAX_WIDTH = 2000;
export const QUALITY = 85;

const HEIC = new Set([".heic", ".heif"]);

/**
 * Formats where sharp returns the embedded thumbnail rather than the real image.
 *
 * These must bypass sharp entirely: an attempt "succeeds" and writes a tiny file, so there is
 * no error to catch and fall back from.
 */
const RAW = new Set([".nef", ".dng", ".cr2", ".cr3", ".arw", ".raf", ".orf", ".rw2", ".srw"]);

/** True when sharp decoded a preview instead of the photograph. */
function looksLikeThumbnail(meta) {
  return (meta.width ?? 0) < 1000 && (meta.height ?? 0) < 1000;
}

function isDecodeUnsupported(err) {
  return /has not been built in|bad seek|unsupported image format/i.test(err.message ?? "");
}

/** Decode to a temporary PNG through macOS ImageIO. Returns the temp path, or null. */
function decodeViaSips(src) {
  if (process.platform !== "darwin") return null;
  const tmp = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "webp-")),
    `${path.basename(src, path.extname(src))}.png`
  );
  try {
    execFileSync("sips", ["--setProperty", "format", "png", src, "--out", tmp], {
      stdio: "ignore",
    });
    return fs.existsSync(tmp) ? tmp : null;
  } catch {
    return null;
  }
}

async function encode(src, dest, { maxWidth = MAX_WIDTH, quality = QUALITY } = {}) {
  // Bounds the long edge, not just the width. Testing width alone let an upright frame through
  // at full height — a 1500x4000 portrait is under any width cap and still a printable file.
  // failOn:'error' ignores non-fatal EXIF warnings in NEF/DNG files.
  await sharp(src, { failOn: "error" })
    .rotate()
    .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toFile(dest);
}

/**
 * Decode `src` to a lossless PNG at `dest`, auto-rotated and capped at maxWidth.
 *
 * The watermarking pass needs real pixels it can modify before anything lossy happens, so it
 * cannot go through toWebp. Same two-path decode as below, kept separate rather than factored
 * out: toWebp is what rescued sixteen frames from being silently thumbnailed, and it is not
 * worth risking that logic to save a dozen lines.
 *
 * Resolves to "sharp" or "sips".
 */
export async function decodeToPng(src, dest, { maxWidth = MAX_WIDTH } = {}) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const write = async (from) => {
    // fit:"inside" bounds both axes, so the long edge lands on maxWidth whichever way up the
    // frame is. Deciding the axis myself from metadata was wrong: metadata reports the stored
    // dimensions, .rotate() then applies EXIF orientation and swaps them, so an upright frame
    // shot in landscape had its short edge capped and shipped at 2400px instead of 1600px.
    await sharp(from, { failOn: "error" })
      .rotate()
      .resize({ width: maxWidth, height: maxWidth, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 6 })
      .toFile(dest);
  };

  const ext = path.extname(src).toLowerCase();
  if (!HEIC.has(ext) && !RAW.has(ext)) {
    try {
      await write(src);
      const written = await sharp(dest).metadata();
      if (!looksLikeThumbnail(written)) return "sharp";
    } catch (err) {
      if (!isDecodeUnsupported(err)) throw err;
    }
  }

  const tmp = decodeViaSips(src);
  if (!tmp) {
    throw new Error(
      `cannot decode ${ext} — sharp cannot read it properly and sips ${
        process.platform === "darwin" ? "failed" : "is macOS-only"
      }`
    );
  }
  try {
    await write(tmp);
    return "sips";
  } finally {
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }
}

/**
 * Write `src` to `dest` as WebP, auto-rotated and capped at maxWidth.
 * Resolves to "sharp" or "sips" so callers can report which path was taken.
 */
export async function toWebp(src, dest, opts = {}) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const ext = path.extname(src).toLowerCase();
  // Skip the sharp attempt for formats it either cannot decode or decodes deceptively.
  if (!HEIC.has(ext) && !RAW.has(ext)) {
    try {
      await encode(src, dest, opts);
      // A TIFF can also carry only a preview, so verify rather than trust the exit code.
      const written = await sharp(dest).metadata();
      if (!looksLikeThumbnail(written)) return "sharp";
    } catch (err) {
      if (!isDecodeUnsupported(err)) throw err;
    }
  }

  const tmp = decodeViaSips(src);
  if (!tmp) {
    throw new Error(
      `cannot decode ${ext} — sharp cannot read it properly and sips ${
        process.platform === "darwin" ? "failed" : "is macOS-only"
      }`
    );
  }
  try {
    await encode(tmp, dest, opts);
    return "sips";
  } finally {
    fs.rmSync(path.dirname(tmp), { recursive: true, force: true });
  }
}
