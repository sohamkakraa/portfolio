/**
 * Read watermarks back out of images and say whose they are.
 *
 * Two jobs, because there are two questions worth asking:
 *
 *   npm run photos:verify                    audit: do the published frames still carry a mark?
 *   npm run photos:verify -- suspect.jpg     forensics: is this one of mine, and which?
 *
 * The audit matters because a watermark is silent when it breaks. Re-encode the gallery with
 * different settings, or run an optimiser over public/, and every mark could be gone with
 * nothing on screen to tell you. So this is the regression test for the archive.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const DERIVATIVES = "public/photography-webp";
const MANIFEST = "data/watermarks.json";
const PYTHON = ".venv-photo/bin/python";
const DECODE = "scripts/lib/trustmark_decode.py";

const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const SAMPLE = Number(process.env.SAMPLE ?? 12);

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else if (e.name.toLowerCase().endsWith(".webp")) out.push(full);
  }
  return out;
}

if (!fs.existsSync(PYTHON)) {
  console.error(`TrustMark environment missing. Run:\n  npm run photos:setup`);
  process.exit(1);
}

const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : { photographs: {} };

const forensic = targets.length > 0;
let files = targets;

if (!forensic) {
  const all = walk(DERIVATIVES);
  // A spot check by default: decoding is a model forward pass per image, and checking a dozen
  // is enough to catch "the whole gallery got re-encoded". SAMPLE=0 checks everything.
  files = SAMPLE > 0 && all.length > SAMPLE
    ? all.sort(() => Math.random() - 0.5).slice(0, SAMPLE)
    : all;
  console.log(`auditing ${files.length} of ${all.length} published frames`);
}

const work = fs.mkdtempSync(path.join(os.tmpdir(), "wmv-"));
const out = path.join(work, "found.json");
execFileSync(PYTHON, [DECODE, out, ...files], { stdio: "inherit" });
const results = JSON.parse(fs.readFileSync(out, "utf8"));
fs.rmSync(work, { recursive: true, force: true });

console.log("");
let clean = 0;
for (const r of results) {
  if (r.error) {
    console.log(`  could not read ${r.path}: ${r.error}`);
    continue;
  }
  const entry = r.id ? manifest.photographs?.[r.id] : null;
  if (entry) {
    clean++;
    console.log(`  ${r.id}  ${entry.file}`);
    if (forensic) {
      console.log(`         published as ${entry.published}, marked ${entry.embedded}`);
    }
  } else if (r.id) {
    console.log(`  ${r.id}  carries a mark, but it is not in ${MANIFEST}`);
  } else {
    console.log(`  no watermark found in ${r.path}`);
  }
}

if (forensic) {
  const mine = results.filter((r) => r.id && manifest.photographs?.[r.id]).length;
  console.log(`\n${mine} of ${results.length} are yours`);
} else {
  console.log(`\n${clean}/${results.length} published frames still carry a recoverable mark`);
  if (clean !== results.length) {
    console.log("A published frame without a mark means the pipeline was bypassed. Re-run:");
    console.log("  npm run photos:watermark -- --all");
    process.exitCode = 1;
  }
}
