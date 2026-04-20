"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Images,
  X,
} from "lucide-react";
import type { PhotoItem, PhotoMeta, PhotographyCategory, PhotographySection as PhotographySectionType } from "@/lib/portfolio-types";
import { readExifMeta } from "@/lib/photo-metadata";
import LoaderImage from "@/components/LoaderImage";
import ScrollReveal from "@/components/ui/ScrollReveal";

type PhotographySectionProps = {
  section: PhotographySectionType;
};

type GalleryMode = "collection" | "all";

type GalleryPhoto = PhotoItem & {
  categorySlug: string;
  categoryTitle: string;
};

const hasManualMeta = (meta?: PhotoMeta) =>
  !!meta && Object.values(meta).some((value) => value && value.toString().trim().length);

const resolveMeta = (photo: PhotoItem, metaBySrc: Record<string, PhotoMeta | null>) => {
  if (hasManualMeta(photo.meta)) return photo.meta;
  return metaBySrc[photo.src] ?? null;
};

const buildSpecLine = (meta?: PhotoMeta | null) => {
  if (!meta) return [];
  const specs = [
    meta.aperture,
    meta.shutter,
    meta.iso ? `ISO ${meta.iso}` : undefined,
    meta.focalLength ? `${meta.focalLength}mm` : undefined,
  ];
  return specs.filter(Boolean) as string[];
};

const withCategory = (photo: PhotoItem, category: PhotographyCategory): GalleryPhoto => ({
  ...photo,
  categorySlug: category.slug,
  categoryTitle: category.title,
});

/** Picks light or dark foreground for tab labels on category accent fills. */
const textOnAccent = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return "#fafafa";
  const n = parseInt(normalized, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.55 ? "#0a0a0a" : "#fafafa";
};

export default function PhotographySection({ section }: PhotographySectionProps) {
  const categories = useMemo(
    () => section.categories.filter((category) => !category.hidden),
    [section.categories]
  );
  const [activeSlug, setActiveSlug] = useState<string>(categories[0]?.slug ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [galleryMode, setGalleryMode] = useState<GalleryMode>("collection");
  const [metaBySrc, setMetaBySrc] = useState<Record<string, PhotoMeta | null>>({});
  const [loadingMeta, setLoadingMeta] = useState<Record<string, boolean>>({});
  const metaRef = useRef(metaBySrc);
  const loadingRef = useRef(loadingMeta);

  useEffect(() => { metaRef.current = metaBySrc; }, [metaBySrc]);
  useEffect(() => { loadingRef.current = loadingMeta; }, [loadingMeta]);

  const activeSlugResolved = categories.some((c) => c.slug === activeSlug)
    ? activeSlug
    : categories[0]?.slug ?? "";
  const activeCategory = categories.find((c) => c.slug === activeSlugResolved) || categories[0];

  const collectionImages = useMemo(
    () =>
      activeCategory
        ? activeCategory.images.filter((i) => !i.hidden).map((i) => withCategory(i, activeCategory))
        : [],
    [activeCategory]
  );

  const allImages = useMemo(
    () =>
      categories.flatMap((c) =>
        c.images.filter((i) => !i.hidden).map((i) => withCategory(i, c))
      ),
    [categories]
  );

  const modalImages = galleryMode === "all" ? allImages : collectionImages;
  const normalizedActiveIndex =
    activeIndex === null || modalImages.length === 0
      ? null
      : ((activeIndex % modalImages.length) + modalImages.length) % modalImages.length;

  const ensureMeta = useCallback(async (photo: PhotoItem) => {
    if (hasManualMeta(photo.meta)) return;
    if (metaRef.current[photo.src] || loadingRef.current[photo.src]) return;
    setLoadingMeta((prev) => ({ ...prev, [photo.src]: true }));
    const meta = await readExifMeta(photo.src);
    setMetaBySrc((prev) => ({ ...prev, [photo.src]: meta }));
    setLoadingMeta((prev) => ({ ...prev, [photo.src]: false }));
  }, []);

  const openImageFromModal = useCallback(
    (index: number) => {
      setActiveIndex(index);
      const photo = modalImages[index];
      if (photo) void ensureMeta(photo);
    },
    [ensureMeta, modalImages]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!modalImages.length) return;
      if (e.key === "Escape") { setIsOpen(false); setActiveIndex(null); }
      if (e.key === "ArrowRight" && normalizedActiveIndex !== null) {
        openImageFromModal((normalizedActiveIndex + 1) % modalImages.length);
      }
      if (e.key === "ArrowLeft" && normalizedActiveIndex !== null) {
        openImageFromModal((normalizedActiveIndex - 1 + modalImages.length) % modalImages.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, modalImages, normalizedActiveIndex, openImageFromModal]);

  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [isOpen]);

  const openCollectionGallery = (startIndex: number | null = null) => {
    setGalleryMode("collection");
    setActiveIndex(startIndex);
    setIsOpen(true);
    if (startIndex !== null) {
      const photo = collectionImages[startIndex];
      if (photo) void ensureMeta(photo);
    }
  };

  const openAllGallery = () => {
    setGalleryMode("all");
    setActiveIndex(null);
    setIsOpen(true);
  };

  const selectCategory = useCallback(
    (slug: string) => {
      setActiveSlug(slug);
      setActiveIndex(null);
      if (galleryMode === "collection" && isOpen) setGalleryMode("collection");
    },
    [galleryMode, isOpen]
  );

  const shiftCollection = useCallback(
    (direction: -1 | 1) => {
      if (!categories.length) return;
      const idx = categories.findIndex((c) => c.slug === activeSlugResolved);
      const safe = idx >= 0 ? idx : 0;
      const next = (safe + direction + categories.length) % categories.length;
      selectCategory(categories[next].slug);
    },
    [activeSlugResolved, categories, selectCategory]
  );

  if (!activeCategory) {
    return (
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-6 text-sm text-[color:var(--fg-muted)]">
        Add photography categories in the admin panel to populate this section.
      </div>
    );
  }

  const currentImage = normalizedActiveIndex === null ? null : modalImages[normalizedActiveIndex];

  return (
    <div>
      {/* Header */}
      <ScrollReveal>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">{section.title}</p>
            <h2 className="section-title mt-4">{section.description}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => openCollectionGallery()}
              className="btn-secondary !py-2.5 !px-5 !text-[11px]"
            >
              <Images size={14} />
              {activeCategory.title}
            </button>
            <button
              type="button"
              onClick={openAllGallery}
              className="btn-primary !py-2.5 !px-5 !text-[11px]"
            >
              <Grid3X3 size={14} />
              <span>Full gallery</span>
            </button>
          </div>
        </div>
      </ScrollReveal>

      {/* Category tabs */}
      <div className="mt-8 flex items-center gap-3">
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-2">
          {categories.map((category) => {
            const active = activeSlugResolved === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => selectCategory(category.slug)}
                className={`shrink-0 rounded-full border px-3 py-2.5 text-[10px] sm:px-4 sm:text-[11px] font-semibold uppercase tracking-[0.2em] transition-all ${
                  active
                    ? "border-transparent shadow-lg"
                    : "border-transparent text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
                }`}
                style={
                  active
                    ? {
                        background: category.accent,
                        boxShadow: `0 4px 20px ${category.accent}40`,
                        color: textOnAccent(category.accent),
                      }
                    : undefined
                }
              >
                {category.title}
              </button>
            );
          })}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => shiftCollection(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            aria-label="Previous collection"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shiftCollection(1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            aria-label="Next collection"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid preview */}
      {collectionImages.length ? (
        <div
          key={activeSlugResolved}
          className="collection-fade mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5"
        >
          {collectionImages.slice(0, 6).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openCollectionGallery(index)}
              onMouseEnter={() => ensureMeta(image)}
              className="photo-card group relative aspect-[3/4] w-full overflow-hidden text-left"
            >
              <LoaderImage
                src={image.src}
                alt={image.title}
                className="absolute inset-0 h-full w-full object-cover"
                skeletonClassName="image-loader-photo"
                loading="lazy"
              />
              <div className="photo-overlay" />
              <div className="photo-info">
                <p className="text-sm font-bold text-white">{image.title}</p>
                <p className="mt-1 text-xs text-white/70">{image.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.15em] text-white/60">
                  {(() => {
                    const meta = resolveMeta(image, metaBySrc);
                    const specs = buildSpecLine(meta);
                    if (specs.length) return specs.map((s) => <span key={`${image.id}-${s}`}>{s}</span>);
                    return (
                      <span>{loadingMeta[image.src] ? "Loading metadata" : "View details"}</span>
                    );
                  })()}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-8 text-sm text-[color:var(--fg-muted)]">
          No images yet. Add files to{" "}
          <span className="font-mono text-[color:var(--accent)]">/public/photography/{activeCategory.slug}</span>{" "}
          or use the admin panel.
        </div>
      )}

      {/* ── Lightbox Modal ── */}
      {isOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/80 p-2 sm:p-4 backdrop-blur-md" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))', paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          <div
            className="absolute inset-0"
            onClick={() => { setIsOpen(false); setActiveIndex(null); }}
          />
          <div className="relative z-10 mx-auto my-0 sm:my-4 flex max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-2xl sm:rounded-[28px] border border-[color:var(--border)] bg-[color:var(--bg-surface)] shadow-2xl">
            {/* Modal header */}
            <div className="shrink-0 border-b border-[color:var(--border)] p-4 sm:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="section-label">
                    {galleryMode === "all" ? "All collections" : activeCategory.title}
                  </p>
                  <h3 className="mt-2 text-xl font-bold tracking-tight text-[color:var(--fg)]">
                    {galleryMode === "all"
                      ? "Browse every collection in one view."
                      : activeCategory.description}
                  </h3>
                  <p className="mt-1 text-sm text-[color:var(--fg-muted)]">{modalImages.length} images</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setGalleryMode("collection"); setActiveIndex(null); }}
                    className="btn-secondary !py-2 !px-3.5 !text-[10px]"
                  >
                    <Images size={13} /> Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGalleryMode("all"); setActiveIndex(null); }}
                    className="btn-secondary !py-2 !px-3.5 !text-[10px]"
                  >
                    <Grid3X3 size={13} /> All
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsOpen(false); setActiveIndex(null); }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
                    aria-label="Close"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Category pills inside modal */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {categories.map((category) => {
                  const active = activeSlugResolved === category.slug && galleryMode === "collection";
                  return (
                    <button
                      key={`modal-${category.slug}`}
                      type="button"
                      onClick={() => { setGalleryMode("collection"); selectCategory(category.slug); }}
                      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                        active
                          ? "border-transparent"
                          : "border-[color:var(--border)] text-[color:var(--fg-muted)] hover:text-[color:var(--fg)]"
                      }`}
                      style={
                        active
                          ? { background: category.accent, color: textOnAccent(category.accent) }
                          : undefined
                      }
                    >
                      {category.title}
                    </button>
                  );
                })}
                <div className="ml-auto flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setGalleryMode("collection"); shiftCollection(-1); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)]"
                    aria-label="Previous"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setGalleryMode("collection"); shiftCollection(1); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)]"
                    aria-label="Next"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div className="mt-0 min-h-0 overflow-y-auto p-6">
              {activeIndex === null ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {modalImages.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => openImageFromModal(index)}
                      onMouseEnter={() => ensureMeta(image)}
                      className="photo-card group relative aspect-[3/4] w-full overflow-hidden text-left"
                    >
                      <LoaderImage
                        src={image.src}
                        alt={image.title}
                        className="absolute inset-0 h-full w-full object-cover"
                        skeletonClassName="image-loader-photo"
                        loading="lazy"
                      />
                      <div className="photo-overlay" />
                      <div className="photo-info">
                        <p className="text-sm font-bold text-white">{image.title}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/60">
                          {image.categoryTitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                  {/* Image viewer */}
                  <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[20px] border border-[color:var(--border)] bg-black">
                    {currentImage && (
                      <LoaderImage
                        src={currentImage.src}
                        alt={currentImage.title}
                        className="max-h-[70dvh] w-full object-contain"
                        skeletonClassName="image-loader-viewer"
                        loading="eager"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveIndex(null)}
                      className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur transition hover:text-white"
                    >
                      <Grid3X3 size={12} /> Grid
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--accent)]">
                        {currentImage?.categoryTitle}
                      </p>
                      <h4 className="mt-3 text-2xl font-bold tracking-tight text-[color:var(--fg)]">
                        {currentImage?.title}
                      </h4>
                      <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-muted)]">
                        {currentImage?.description}
                      </p>
                    </div>

                    {/* EXIF data */}
                    <div className="mt-6 space-y-2.5 rounded-[20px] border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-5">
                      {(() => {
                        const meta = currentImage ? resolveMeta(currentImage, metaBySrc) : null;
                        const entries: Array<[string, string | undefined]> = [
                          ["Camera", meta?.camera],
                          ["Lens", meta?.lens],
                          ["Aperture", meta?.aperture],
                          ["Shutter", meta?.shutter],
                          ["ISO", meta?.iso ? `ISO ${meta.iso}` : undefined],
                          ["Focal length", meta?.focalLength ? `${meta.focalLength}mm` : undefined],
                          ["Date", meta?.date],
                          ["Location", meta?.location],
                        ];
                        return entries.map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between gap-4">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                              {label}
                            </span>
                            <span className="text-sm text-[color:var(--fg)]">{value || "—"}</span>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Nav */}
                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (normalizedActiveIndex === null) return;
                          openImageFromModal((normalizedActiveIndex - 1 + modalImages.length) % modalImages.length);
                        }}
                        className="btn-secondary !py-2 !px-4 !text-[10px]"
                      >
                        <ArrowLeft size={13} /> Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (normalizedActiveIndex === null) return;
                          openImageFromModal((normalizedActiveIndex + 1) % modalImages.length);
                        }}
                        className="btn-primary !py-2 !px-4 !text-[10px]"
                      >
                        <span>Next</span> <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Thumbstrip */}
                  <div className="lg:col-span-2">
                    <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                      {modalImages.map((image, index) => (
                        <button
                          key={`thumb-${image.id}`}
                          type="button"
                          onClick={() => openImageFromModal(index)}
                          className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition ${
                            index === normalizedActiveIndex
                              ? "border-[color:var(--accent)] shadow-lg"
                              : "border-[color:var(--border)] opacity-60 hover:opacity-100"
                          }`}
                        >
                          <LoaderImage
                            src={image.src}
                            alt={image.title}
                            className="h-full w-full object-cover"
                            skeletonClassName="image-loader-thumb"
                            loading="lazy"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
