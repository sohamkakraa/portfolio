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
