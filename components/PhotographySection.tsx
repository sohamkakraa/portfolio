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

const getReadableTextColor = (accent: string) => {
  const raw = accent.trim().replace("#", "");
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(raw)) {
    return "var(--foreground)";
  }
  const hex = raw.length === 3 ? raw.split("").map((char) => `${char}${char}`).join("") : raw;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f1727" : "#f8fbff";
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

  useEffect(() => {
    metaRef.current = metaBySrc;
  }, [metaBySrc]);

  useEffect(() => {
    loadingRef.current = loadingMeta;
  }, [loadingMeta]);

  const activeSlugResolved = categories.some((category) => category.slug === activeSlug)
    ? activeSlug
    : categories[0]?.slug ?? "";
  const activeCategory = categories.find((category) => category.slug === activeSlugResolved) || categories[0];

  const collectionImages = useMemo(
    () =>
      activeCategory
        ? activeCategory.images
            .filter((image) => !image.hidden)
            .map((image) => withCategory(image, activeCategory))
        : [],
    [activeCategory]
  );

  const allImages = useMemo(
    () =>
      categories.flatMap((category) =>
        category.images.filter((image) => !image.hidden).map((image) => withCategory(image, category))
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
      if (photo) {
        void ensureMeta(photo);
      }
    },
    [ensureMeta, modalImages]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!modalImages.length) return;
      if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(null);
      }
      if (event.key === "ArrowRight") {
        if (normalizedActiveIndex === null) return;
        openImageFromModal((normalizedActiveIndex + 1) % modalImages.length);
      }
      if (event.key === "ArrowLeft") {
        if (normalizedActiveIndex === null) return;
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
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [isOpen]);

  const openCollectionGallery = (startIndex: number | null = null) => {
    setGalleryMode("collection");
    setActiveIndex(startIndex);
    setIsOpen(true);
    if (startIndex !== null) {
      const photo = collectionImages[startIndex];
      if (photo) {
        void ensureMeta(photo);
      }
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
      if (galleryMode === "collection" && isOpen) {
        setGalleryMode("collection");
      }
    },
    [galleryMode, isOpen]
  );

  const shiftCollection = useCallback(
    (direction: -1 | 1) => {
      if (!categories.length) return;
      const currentIndex = categories.findIndex((category) => category.slug === activeSlugResolved);
      const safeIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex = (safeIndex + direction + categories.length) % categories.length;
      selectCategory(categories[nextIndex].slug);
    },
    [activeSlugResolved, categories, selectCategory]
  );

  if (!activeCategory) {
    return (
      <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-6 text-sm text-[color:var(--muted)]">
        Add photography categories in the admin panel to populate this section.
      </div>
    );
  }

  const currentImage = normalizedActiveIndex === null ? null : modalImages[normalizedActiveIndex];

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
            {section.title}
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
            {section.description}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => openCollectionGallery()}
            className="btn-secondary inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
          >
            <Images size={14} />
            {activeCategory.title}
          </button>
          <button
            type="button"
            onClick={openAllGallery}
            className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
          >
            <Grid3X3 size={14} />
            Full gallery
          </button>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <div className="no-scrollbar flex flex-1 items-center gap-2 overflow-x-auto rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-2">
          {categories.map((category) => {
            const active = activeSlugResolved === category.slug;
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => selectCategory(category.slug)}
                className={`rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.26em] transition ${
                  active
                    ? ""
                    : "border-transparent text-[color:var(--muted)] hover:border-[color:var(--border)] hover:text-[color:var(--foreground)]"
                }`}
                style={
                  active
                    ? {
                        background: category.accent,
                        color: getReadableTextColor(category.accent),
                        borderColor: "transparent",
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
            className="btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Previous collection"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => shiftCollection(1)}
            className="btn-secondary inline-flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="Next collection"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {collectionImages.length ? (
        <div key={activeSlugResolved} className="collection-fade mt-10 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {collectionImages.slice(0, 6).map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => openCollectionGallery(index)}
              onMouseEnter={() => ensureMeta(image)}
              className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left shadow-[0_18px_40px_rgba(15,20,35,0.12)]"
            >
              <LoaderImage
                src={image.src}
                alt={image.title}
                className="block h-auto w-full transition duration-500 group-hover:scale-105"
                skeletonClassName="image-loader-photo"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
              <div className="absolute bottom-4 left-4 right-4 translate-y-2 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-sm font-semibold">{image.title}</p>
                <p className="mt-2 text-xs text-white/80">{image.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70">
                  {(() => {
                    const meta = resolveMeta(image, metaBySrc);
                    const specs = buildSpecLine(meta);
                    if (specs.length) {
                      return specs.map((spec) => <span key={`${image.id}-${spec}`}>{spec}</span>);
                    }
                    return (
                      <span>
                        {loadingMeta[image.src] ? "Loading metadata" : "Add metadata in admin"}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-8 text-sm text-[color:var(--muted)]">
          No images yet. Add files to{" "}
          <span className="font-mono">/public/photography/{activeCategory.slug}</span> or use the admin panel to add
          image entries.
        </div>
      )}

      {isOpen ? (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-black/55 p-4 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => {
              setIsOpen(false);
              setActiveIndex(null);
            }}
          />
          <div className="relative z-10 mx-auto my-4 flex max-h-[calc(100dvh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-[36px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="shrink-0 border-b border-[color:var(--border)] pb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                    {galleryMode === "all" ? "All collections" : activeCategory.title}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
                    {galleryMode === "all"
                      ? "Browse every collection in one view."
                      : activeCategory.description}
                  </h3>
                  <p className="mt-2 text-sm text-[color:var(--muted)]">{modalImages.length} images</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryMode("collection");
                      setActiveIndex(null);
                    }}
                    className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  >
                    <Images size={14} />
                    Collection
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryMode("all");
                      setActiveIndex(null);
                    }}
                    className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  >
                    <Grid3X3 size={14} />
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setActiveIndex(null);
                    }}
                    className="btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-full"
                    aria-label="Close gallery"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {categories.map((category) => {
                  const active = activeSlugResolved === category.slug && galleryMode === "collection";
                  return (
                    <button
                      key={`modal-${category.slug}`}
                      type="button"
                      onClick={() => {
                        setGalleryMode("collection");
                        selectCategory(category.slug);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] ${
                        active
                          ? ""
                          : "border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                      }`}
                      style={
                        active
                          ? {
                              background: category.accent,
                              color: getReadableTextColor(category.accent),
                              borderColor: "transparent",
                            }
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
                    onClick={() => {
                      setGalleryMode("collection");
                      shiftCollection(-1);
                    }}
                    className="btn-secondary inline-flex h-8 w-8 items-center justify-center rounded-full"
                    aria-label="Previous collection"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGalleryMode("collection");
                      shiftCollection(1);
                    }}
                    className="btn-secondary inline-flex h-8 w-8 items-center justify-center rounded-full"
                    aria-label="Next collection"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 min-h-0 overflow-y-auto pr-1">
              {activeIndex === null ? (
                <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                  {modalImages.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => openImageFromModal(index)}
                      onMouseEnter={() => ensureMeta(image)}
                      className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left shadow-[0_18px_40px_rgba(15,20,35,0.12)]"
                    >
                      <LoaderImage
                        src={image.src}
                        alt={image.title}
                        className="block h-auto w-full transition duration-500 group-hover:scale-105"
                        skeletonClassName="image-loader-photo"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />
                      <div className="absolute bottom-4 left-4 right-4 translate-y-2 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="text-sm font-semibold">{image.title}</p>
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/75">
                          {image.categoryTitle}
                        </p>
                        <p className="mt-2 text-xs text-white/80">{image.description}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70">
                          {(() => {
                            const meta = resolveMeta(image, metaBySrc);
                            const specs = buildSpecLine(meta);
                            if (specs.length) {
                              return specs.map((spec) => <span key={`${image.id}-${spec}`}>{spec}</span>);
                            }
                            return (
                              <span>
                                {loadingMeta[image.src] ? "Loading metadata" : "Add metadata in admin"}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
                  <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-black">
                    {currentImage ? (
                      <LoaderImage
                        src={currentImage.src}
                        alt={currentImage.title}
                        className="max-h-[70dvh] w-full object-contain"
                        skeletonClassName="image-loader-viewer"
                        loading="eager"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setActiveIndex(null)}
                      className="btn-secondary absolute left-4 top-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em]"
                    >
                      <Grid3X3 size={13} />
                      Back to grid
                    </button>
                  </div>

                  <div className="flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                        {currentImage?.categoryTitle}
                      </p>
                      <h4 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
                        {currentImage?.title}
                      </h4>
                      <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
                        {currentImage?.description}
                      </p>
                    </div>

                    <div className="mt-6 space-y-3 rounded-[24px] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-5 text-sm text-[color:var(--foreground)]">
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
                            <span className="text-[11px] uppercase tracking-[0.26em] text-[color:var(--muted)]">
                              {label}
                            </span>
                            <span className="text-sm text-[color:var(--foreground)]">{value || "—"}</span>
                          </div>
                        ));
                      })()}
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          if (normalizedActiveIndex === null) return;
                          openImageFromModal((normalizedActiveIndex - 1 + modalImages.length) % modalImages.length);
                        }}
                        className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
                      >
                        <ArrowLeft size={13} />
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (normalizedActiveIndex === null) return;
                          openImageFromModal((normalizedActiveIndex + 1) % modalImages.length);
                        }}
                        className="btn-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em]"
                      >
                        Next
                        <ArrowRight size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="mt-6 flex gap-3 overflow-x-auto pb-2">
                      {modalImages.map((image, index) => (
                        <button
                          key={`thumb-${image.id}`}
                          type="button"
                          onClick={() => openImageFromModal(index)}
                          className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border ${
                            index === normalizedActiveIndex
                              ? "border-[color:var(--accent)]"
                              : "border-[color:var(--border)]"
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
      ) : null}
    </div>
  );
}
