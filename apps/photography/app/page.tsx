import Link from "next/link";
import { ArrowRight, ArrowUpRight, Camera, Film } from "lucide-react";
import { categories, videoSequences } from "@/lib/gallery-data";
import ScrollReveal from "@/components/ScrollReveal";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="full-bleed flex items-end">
        {/* Background — replace with your best hero shot from R2 */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#0f0f1f] to-[var(--bg)]" />
        <div className="category-hero-overlay" />

        <div className="relative z-10 w-full px-6 pb-16 sm:px-10 md:pb-24 lg:px-16">
          <div className="max-w-3xl">
            <p className="animate-slide-up text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--accent)]">
              Visual diary
            </p>
            <h1 className="mt-4 animate-slide-up text-[clamp(2.5rem,8vw,6rem)] font-bold leading-[1.02] tracking-[-0.04em]"
              style={{ animationDelay: "0.1s" }}>
              Through the
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Lens
              </span>
            </h1>
            <p className="mt-6 animate-slide-up max-w-lg text-base leading-relaxed text-[var(--fg-muted)] sm:text-lg"
              style={{ animationDelay: "0.2s" }}>
              A collection of landscapes, wildlife, star trails, cityscapes,
              and moments that caught my eye.
            </p>
            <div className="mt-8 animate-slide-up flex flex-wrap gap-3" style={{ animationDelay: "0.3s" }}>
              <a
                href="#collections"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-black transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-white/10"
              >
                Explore collections <ArrowRight size={14} />
              </a>
              {videoSequences.length > 0 && (
                <a
                  href="#videos"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--fg)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  <Film size={14} /> Star trails
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Collections ── */}
      <section id="collections" className="scroll-mt-16 px-4 py-20 sm:px-8 lg:px-16">
        <ScrollReveal>
          <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--accent)]">
            Collections
          </p>
          <h2 className="mt-3 text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-[-0.03em]">
            Browse by chapter
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, i) => (
            <ScrollReveal key={cat.slug} delay={i * 80}>
              <Link
                href={`/${cat.slug}`}
                className="group relative block aspect-[4/3] overflow-hidden rounded-2xl border border-[var(--border)] transition hover:border-[var(--border-hover)]"
              >
                {/* Cover image — falls back to gradient if no cover uploaded yet */}
                <div
                  className="absolute inset-0 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)] transition-transform duration-500 group-hover:scale-105"
                  style={{ background: `linear-gradient(135deg, ${cat.accent}15, ${cat.accent}05)` }}
                />
                <div className="category-hero-overlay" />

                <div className="relative z-10 flex h-full flex-col justify-end p-5 sm:p-6">
                  <div
                    className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full"
                    style={{ background: `${cat.accent}25`, color: cat.accent }}
                  >
                    <Camera size={14} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">{cat.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--fg-muted)]">
                    {cat.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--accent)]">
                    Explore <ArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Star Trails / Videos ── */}
      {videoSequences.length > 0 && (
        <section id="videos" className="scroll-mt-16 px-4 py-20 sm:px-8 lg:px-16">
          <ScrollReveal>
            <p className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[var(--accent)]">
              Motion
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-[-0.03em]">
              Star trails & timelapses
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--fg-muted)]">
              Long-exposure sequences rendered frame-by-frame. Each video is
              built from hundreds of individual exposures, stitched into smooth motion.
            </p>
          </ScrollReveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {videoSequences.map((vid, i) => (
              <ScrollReveal key={vid.id} delay={i * 100}>
                <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
                  {/* StarTrailPlayer will be loaded client-side */}
                  <div className="aspect-video bg-[var(--bg-surface)]" />
                  <div className="p-5">
                    <h3 className="text-base font-bold tracking-tight">{vid.title}</h3>
                    {vid.description && (
                      <p className="mt-2 text-sm text-[var(--fg-muted)]">{vid.description}</p>
                    )}
                    <div className="mt-3 flex gap-4 text-[10px] uppercase tracking-[0.2em] text-[var(--fg-subtle)]">
                      <span>{vid.frames} frames</span>
                      <span>{vid.duration}s</span>
                      <span>{vid.resolution}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] px-4 py-12 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <p className="text-sm font-bold tracking-tight">Soham Kakra</p>
            <p className="mt-1 text-xs text-[var(--fg-muted)]">Visual diary &middot; 2024 &ndash; present</p>
          </div>
          <a
            href="https://sohamkakra.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--fg-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Portfolio <ArrowUpRight size={12} />
          </a>
        </div>
      </footer>
    </div>
  );
}
