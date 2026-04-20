/**
 * Gallery data layer
 *
 * Images are served from Cloudflare R2 via a custom domain.
 * Each category has a manifest.json listing its images.
 * Videos are stored as frame sequences with their own manifest.
 *
 * Environment variable:
 *   NEXT_PUBLIC_CDN_URL=https://photography.sohamkakra.com
 *   (or your R2 public URL)
 */

export const CDN =
  process.env.NEXT_PUBLIC_CDN_URL || "https://photography.sohamkakra.com";

export type GalleryImage = {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  exif?: Record<string, string>;
};

export type VideoSequence = {
  id: string;
  title: string;
  description?: string;
  frames: number;
  fps: number;
  duration: number;
  resolution: string;
  pattern: string; // e.g. "frame-{NNNN}.webp"
  poster?: string; // first frame or custom poster
  basePath: string; // e.g. "videos/startrail1"
};

export type GalleryCategory = {
  slug: string;
  title: string;
  description: string;
  accent: string;
  coverImage: string;
  images: GalleryImage[];
};

/**
 * Update this array to match your R2 bucket structure.
 * Each category's images should be at: <CDN>/photography/<slug>/*.webp
 * Video frames should be at: <CDN>/videos/<id>/frame-NNNN.webp
 */
export const categories: GalleryCategory[] = [
  {
    slug: "landscape",
    title: "Landscape",
    description: "Wide views, golden hours, and expansive terrain.",
    accent: "#f59e0b",
    coverImage: `${CDN}/photography/landscape/cover.webp`,
    images: [],
  },
  {
    slug: "wildlife",
    title: "Wildlife",
    description: "Birds, animals, and quiet encounters in the field.",
    accent: "#10b981",
    coverImage: `${CDN}/photography/wildlife/cover.webp`,
    images: [],
  },
  {
    slug: "cityscapes",
    title: "Cityscapes",
    description: "Urban geometry, street light, architecture after dark.",
    accent: "#6366f1",
    coverImage: `${CDN}/photography/cityscapes/cover.webp`,
    images: [],
  },
  {
    slug: "astrophotography",
    title: "Astrophotography",
    description: "Night skies, star trails, and the Milky Way.",
    accent: "#8b5cf6",
    coverImage: `${CDN}/photography/astrophotography/cover.webp`,
    images: [],
  },
  {
    slug: "events",
    title: "Events",
    description: "Moments from gatherings, celebrations, and happenings.",
    accent: "#ec4899",
    coverImage: `${CDN}/photography/events/cover.webp`,
    images: [],
  },
  {
    slug: "automobile",
    title: "Automobile",
    description: "Machines, motion, and mechanical beauty.",
    accent: "#ef4444",
    coverImage: `${CDN}/photography/automobile/cover.webp`,
    images: [],
  },
];

/**
 * Video sequences — star trails, timelapses, etc.
 * Add entries here after running extract-frames.sh and uploading to R2.
 */
export const videoSequences: VideoSequence[] = [
  // Example — uncomment and fill after uploading:
  // {
  //   id: "startrail-1",
  //   title: "Orion Rising",
  //   description: "Star trails over the Dutch countryside, 3-hour exposure.",
  //   frames: 360,
  //   fps: 12,
  //   duration: 30,
  //   resolution: "1920x1080",
  //   pattern: "frame-{NNNN}.webp",
  //   basePath: "videos/startrail-1",
  // },
];

/** Construct full URL for a frame in a video sequence */
export function frameUrl(video: VideoSequence, frameIndex: number): string {
  const padded = String(frameIndex).padStart(4, "0");
  const filename = video.pattern.replace("{NNNN}", padded);
  return `${CDN}/${video.basePath}/${filename}`;
}

/** Construct full URL for an image */
export function imageUrl(category: string, filename: string): string {
  return `${CDN}/photography/${category}/${filename}`;
}
