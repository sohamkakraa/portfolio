import type { PhotoMeta } from "@/lib/portfolio-types";

const metaCache = new Map<string, PhotoMeta | null>();
let metadataIndexPromise: Promise<Record<string, PhotoMeta> | null> | null = null;

const loadMetadataIndex = async () => {
  if (!metadataIndexPromise) {
    metadataIndexPromise = fetch("/photography/metadata.json")
      .then((response) => (response.ok ? response.json() : null))
      .catch(() => null);
  }
  return metadataIndexPromise;
};

const extractLookupKeys = (src: string) => {
  const normalized = src.startsWith("/") ? src : `/${src}`;
  const parts = normalized.split("/").filter(Boolean);
  const filename = parts[parts.length - 1];
  const relativePath = parts.slice(-2).join("/");
  return [normalized, relativePath, filename];
};

export const readExifMeta = async (src: string): Promise<PhotoMeta | null> => {
  if (metaCache.has(src)) {
    return metaCache.get(src) ?? null;
  }

  try {
    const index = await loadMetadataIndex();
    if (index) {
      const keys = extractLookupKeys(src);
      for (const key of keys) {
        if (index[key]) {
          metaCache.set(src, index[key]);
          return index[key];
        }
      }
    }
  } catch {
    // ignored
  }

  metaCache.set(src, null);
  return null;
};
