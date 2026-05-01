/**
 * Gallery data layer
 *
 * Images are served from local /public/photography-webp/ in dev,
 * or from Cloudflare R2 when NEXT_PUBLIC_CDN_URL is set.
 *
 * Image lists are populated at build time from:
 *   1. data/photography-manifest.json (root monorepo, committed to git)
 *   2. Live filesystem scan of public/photography-webp/ (fallback)
 */

import fs from "fs";
import path from "path";

export const CDN =
  process.env.NEXT_PUBLIC_CDN_URL?.replace(/\/$/, "") ?? "";

export type GalleryImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
};

export type VideoSequence = {
  id: string;
  title: string;
  description?: string;
  frames: number;
  fps: number;
  duration: number;
  resolution: string;
  pattern: string;
  poster?: string;
  basePath: string;
};

export type GalleryCategory = {
  slug: string;
  title: string;
  description: string;
  accent: string;
  coverImage: string;
  images: GalleryImage[];
};

// Folder name on disk may differ from slug
const SLUG_TO_FOLDER: Record<string, string> = {
  "light-trails": "Startrails",
};

interface PhotoManifest {
  generated: string;
  categories: Record<string, string[]>;
}

function loadManifest(): PhotoManifest | null {
  // Try root manifest (monorepo layout: apps/photography/../../data/)
  const candidates = [
    path.join(process.cwd(), "../../data/photography-manifest.json"),
    path.join(process.cwd(), "data/photography-manifest.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, "utf-8")) as PhotoManifest;
      }
    } catch {
      // continue
    }
  }
  return null;
}

function buildImages(slug: string): GalleryImage[] {
  const folder = SLUG_TO_FOLDER[slug] ?? slug;
  const manifest = loadManifest();

  // 1. Manifest
  const manifestFiles = manifest?.categories?.[slug];
  if (manifestFiles?.length) {
    return manifestFiles.map((file) => ({
      src: CDN
        ? `${CDN}/photography/${slug}/${encodeURIComponent(file)}`
        : `/photography-webp/${folder}/${file}`,
      alt: file.replace(/\.[^/.]+$/, ""),
    }));
  }

  // 2. Live filesystem scan
  const webpRoot = CDN
    ? null
    : (() => {
        const candidates = [
          path.join(process.cwd(), "../../public/photography-webp", folder),
          path.join(process.cwd(), "public/photography-webp", folder),
        ];
        return candidates.find((p) => fs.existsSync(p)) ?? null;
      })();

  if (webpRoot) {
    return fs
      .readdirSync(webpRoot)
      .filter((f) => f.endsWith(".webp"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => ({
        src: `/photography-webp/${folder}/${file}`,
        alt: file.replace(/\.webp$/, ""),
      }));
  }

  return [];
}

const CATEGORY_DEFS: Omit<GalleryCategory, "images">[] = [
  {
    slug: "landscape",
    title: "Landscape",
    description: "Wide views, golden hours, and expansive terrain.",
    accent: "#f59e0b",
    coverImage: "",
  },
  {
    slug: "wildlife",
    title: "Wildlife",
    description: "Birds, animals, and quiet encounters in the field.",
    accent: "#10b981",
    coverImage: "",
  },
  {
    slug: "cityscapes",
    title: "Cityscapes",
    description: "Urban geometry, street light, architecture after dark.",
    accent: "#6366f1",
    coverImage: "",
  },
  {
    slug: "astrophotography",
    title: "Astrophotography",
    description: "Night skies, star trails, and the Milky Way.",
    accent: "#8b5cf6",
    coverImage: "",
  },
  {
    slug: "events",
    title: "Events",
    description: "Moments from gatherings, celebrations, and happenings.",
    accent: "#ec4899",
    coverImage: "",
  },
  {
    slug: "automobile",
    title: "Automobile",
    description: "Machines, motion, and mechanical beauty.",
    accent: "#ef4444",
    coverImage: "",
  },
  {
    slug: "light-trails",
    title: "Star Trails",
    description: "Long-exposure star trails and night sky sequences.",
    accent: "#a78bfa",
    coverImage: "",
  },
];

export const categories: GalleryCategory[] = CATEGORY_DEFS.map((def) => {
  const images = buildImages(def.slug);
  const cover = images[0]?.src ?? "";
  return { ...def, coverImage: cover, images };
}).filter((cat) => cat.images.length > 0);

export const videoSequences: VideoSequence[] = [];

export function frameUrl(video: VideoSequence, frameIndex: number): string {
  const padded = String(frameIndex).padStart(4, "0");
  const filename = video.pattern.replace("{NNNN}", padded);
  return `${CDN}/${video.basePath}/${filename}`;
}

export function imageUrl(category: string, filename: string): string {
  return CDN
    ? `${CDN}/photography/${category}/${filename}`
    : `/photography-webp/${category}/${filename}`;
}
