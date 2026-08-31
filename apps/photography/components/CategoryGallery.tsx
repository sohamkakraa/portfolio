"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Grid, Maximize2 } from "lucide-react";
import type { GalleryCategory, GalleryImage } from "@/lib/gallery-data";
import ScrollReveal from "@/components/ScrollReveal";
import Lightbox from "@/components/Lightbox";

type Props = {
  category: GalleryCategory;
  allCategories: GalleryCategory[];
};

export default function CategoryGallery({ category, allCategories }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = category.images;

  // Other categories for sidebar navigation
  const otherCategories = allCategories.filter((c) => c.slug !== category.slug);

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden sm:min-h-[60vh]">
        {/* Background gradient styled by category accent */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${category.accent}12, ${category.accent}05, var(--bg))`,
          }}
        />
        <div className="category-hero-overlay" />

        {/* Back nav */}
        <Link
          href="/"
          className="absolute left-4 top-6 z-20 flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 backdrop-blur-sm transition hover:bg-black/50 hover:text-white sm:left-8"
        >
          <ArrowLeft size={14} /> All collections
        </Link>

        <div className="relative z-10 w-full px-4 pb-12 sm:px-8 md:pb-16 lg:px-16">
          <div className="max-w-2xl">
            <div
              className="animate-slide-up inline-flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: `${category.accent}25`, color: category.accent }}
            >
              <Grid size={16} />
            </div>
            <h1
              className="mt-4 animate-slide-up text-[clamp(2rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-[-0.04em]"
              style={{ animationDelay: "0.1s" }}
            >
              {category.title}
            </h1>
            <p
              className="mt-4 animate-slide-up text-base leading-relaxed text-[var(--fg-muted)] sm:text-lg"
              style={{ animationDelay: "0.2s" }}
            >
              {category.description}
            </p>
            {images.length > 0 && (
              <p
                className="mt-4 animate-slide-up text-xs uppercase tracking-[0.2em] text-[var(--fg-subtle)]"
                style={{ animationDelay: "0.3s" }}
              >
                {images.length} photograph{images.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Gallery body ── */}
      <section className="px-4 py-16 sm:px-8 lg:px-16">
        {images.length > 0 ? (
          <div className="photo-grid">
            {images.map((image, index) => (
              <ScrollReveal key={image.src} delay={Math.min(index * 50, 400)}>
                <button
                  type="button"
                  className="photo-item w-full text-left"
                  onClick={() => setLightboxIndex(index)}
                >
                  <img
                    src={image.src}
                    alt={image.alt || ""}
                    loading="lazy"
                    className="block w-full rounded-xl"
                  />
                  <div className="photo-hover-overlay flex items-end rounded-xl">
                    <div className="flex w-full items-center justify-between p-4">
                      <span className="text-xs text-white/70">{image.alt || ""}</span>
                      <Maximize2 size={14} className="text-white/50" />
                    </div>
                  </div>
                </button>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: `${category.accent}15`, color: category.accent }}
            >
              <Grid size={24} />
            </div>
            <h3 className="mt-6 text-lg font-bold tracking-tight">Collection coming soon</h3>
            <p className="mt-2 max-w-sm text-sm text-[var(--fg-muted)]">
              Images for this collection haven&apos;t been uploaded yet. Run the
              compression script and upload to R2 to populate this gallery.
            </p>
          </div>
        )}
      </section>

      {/* ── Other collections nav ── */}
      <section className="border-t border-[var(--border)] px-4 py-16 sm:px-8 lg:px-16">
        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--fg-subtle)]">
          Other collections
        </h3>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {otherCategories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className="group flex items-center justify-between rounded-xl border border-[var(--border)] p-4 transition hover:border-[var(--border-hover)] hover:bg-[var(--bg-surface)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${cat.accent}20`, color: cat.accent }}
                >
                  <Grid size={12} />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">{cat.title}</p>
                  <p className="text-[10px] text-[var(--fg-muted)]">
                    {cat.images.length} photo{cat.images.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <ArrowUpRight
                size={14}
                className="text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--accent)]"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-4 py-10 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="text-xs text-[var(--fg-muted)] transition hover:text-[var(--fg)]">
            &larr; Back to all collections
          </Link>
          <a
            href="https://sohamkakra.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[var(--fg-muted)] transition hover:text-[var(--accent)]"
          >
            sohamkakra.com &rarr;
          </a>
        </div>
      </footer>

      {/* ── Lightbox ── */}
      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(i) => setLightboxIndex(i)}
        />
      )}
    </div>
  );
}
