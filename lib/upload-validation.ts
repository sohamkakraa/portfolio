const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".heic",
  ".heif",
  ".avif",
]);

const ALLOWED_MIME_PREFIX = "image/";

export function isAllowedUpload(file: File): { ok: true } | { ok: false; message: string } {
  const ext = (file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "").toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      ok: false,
      message: "Only image files are allowed (jpg, png, webp, gif, heic, avif).",
    };
  }

  const type = file.type?.toLowerCase() ?? "";
  if (type && !type.startsWith(ALLOWED_MIME_PREFIX)) {
    return { ok: false, message: "File must be an image." };
  }

  return { ok: true };
}

/**
 * The content type an upload is actually made of, read from its leading bytes.
 *
 * The checks above look at the filename and at `file.type`, and both of those are supplied by
 * whoever is uploading. Handing `file.type` to Blob as the contentType it should serve with means
 * a file named `photo.jpg` could be stored and then served as `image/svg+xml` — and an SVG served
 * from the blob host is a script running on that origin. Signatures are a property of the file, so
 * they are what we serve on.
 *
 * Returns null when the bytes match nothing we accept, which is the caller's cue to refuse.
 */
export async function sniffImageType(file: File): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const at = (offset: number, ...bytes: number[]) =>
    bytes.every((b, i) => head[offset + i] === b);
  const ascii = (offset: number, text: string) =>
    [...text].every((ch, i) => head[offset + i] === ch.charCodeAt(0));

  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (ascii(0, "GIF87a") || ascii(0, "GIF89a")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";

  // HEIC, HEIF and AVIF are all ISO base media containers; the brand at byte 8 says which.
  if (ascii(4, "ftyp")) {
    const brand = String.fromCharCode(...head.slice(8, 12));
    if (brand.startsWith("avif") || brand.startsWith("avis")) return "image/avif";
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) {
      return "image/heic";
    }
    if (brand.startsWith("heif")) return "image/heif";
  }

  return null;
}
