import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { getVariant, variants } from "../resume/resume-data.mjs";
import { renderResume } from "../resume/template.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDirectory = path.join(root, "public", "resume");
const privateDirectory = path.join(root, "resume", "private");
const stylesheet = await fs.readFile(path.join(root, "resume", "resume.css"), "utf8");
const phone = process.env.RESUME_PHONE?.trim() ?? "";

await Promise.all([
  fs.mkdir(publicDirectory, { recursive: true }),
  fs.mkdir(privateDirectory, { recursive: true }),
]);

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

async function exportPdf(variant, outputPath, contactPhone = "") {
  const page = await browser.newPage({
    viewport: { width: 1240, height: 1754 },
    deviceScaleFactor: 1,
  });

  try {
    await page.setContent(
      renderResume({ variant, stylesheet, phone: contactPhone }),
      { waitUntil: "load" }
    );
    await page.emulateMedia({ media: "print" });
    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true,
    });
  } finally {
    await page.close();
  }
}

try {
  const master = getVariant("master");
  const publicPath = path.join(publicDirectory, master.publicFilename);
  await exportPdf(master, publicPath);
  console.log(`Exported public resume: ${path.relative(root, publicPath)}`);

  for (const variant of Object.values(variants)) {
    const privatePath = path.join(privateDirectory, variant.privateFilename);
    await exportPdf(variant, privatePath, phone);
    console.log(`Exported application resume: ${path.relative(root, privatePath)}`);
  }

  if (!phone) {
    console.warn(
      "RESUME_PHONE was not set; private application PDFs were exported without a phone number."
    );
  }
} finally {
  await browser.close();
}
