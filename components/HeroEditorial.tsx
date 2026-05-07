"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { HeroContent, SiteSettings } from "@/lib/portfolio-types";

type Props = {
  hero: HeroContent;
  site: SiteSettings;
};

const STAGGER_MS = 40;
const WORD_DUR_MS = 600;

function Words({ text, baseDelay = 0 }: { text: string; baseDelay?: number }) {
  const words = text.split(/\s+/);
  return (
    <>
      {words.map((w, i) => (
        <span
          key={`${w}-${i}`}
          className="hero-word"
          style={{ animationDelay: `${baseDelay + i * STAGGER_MS}ms`, animationDuration: `${WORD_DUR_MS}ms` }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default function HeroEditorial({ hero, site }: Props) {
  const eyebrowText = hero.eyebrow || "essay";
  // Three-line headline derived from existing hero data; italicize the marker word.
  // We keep titleLine1/titleLine2 for back-compat and synthesize a third line if missing.
  const lines = (() => {
    const raw = `${hero.titleLine1} ${hero.titleLine2}`.trim();
    // Try to find an italic anchor — fallback to splitting at em-dash or at word "human"
    if (raw.includes("—")) {
      const [a, b] = raw.split("—");
      return [a.trim(), `— ${b.trim()}`];
    }
    return [hero.titleLine1, hero.titleLine2];
  })();

  return (
    <section
      id="top"
      className="relative overflow-hidden"
      style={{ paddingTop: "clamp(6rem, 12vw, 9rem)", paddingBottom: "clamp(4rem, 8vw, 7rem)" }}
    >
      <div className="hero-column-grid" aria-hidden />

      <div className="section-container relative z-10">
        {/* Top eyebrow rule */}
        <div className="flex flex-col gap-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="mono-label" style={{ color: "var(--ink-3)" }}>
              vol. 01 · 2026 — {site.location.split(",")[0].toLowerCase()}, nl
            </span>
            <span className="mono-label hidden md:inline" style={{ color: "var(--ink-3)" }}>
              selected work & visual notes
            </span>
          </div>
          <div className="hero-eyebrow-rule" />
        </div>

        <div className="grid grid-cols-12 gap-x-6 mt-12 md:mt-16">
          {/* Headline block */}
          <div className="col-span-12 lg:col-span-10">
            <p
              className="font-display"
              style={{
                fontSize: "1.5rem",
                fontStyle: "italic",
                color: "var(--accent)",
                marginBottom: "1.25rem",
              }}
            >
              <span className="hero-word" style={{ animationDelay: "0ms", animationDuration: `${WORD_DUR_MS}ms` }}>
                {eyebrowText}
              </span>
            </p>

            <h1 className="display-xl font-display" style={{ color: "var(--ink)" }}>
              <span className="block">
                <Words text={lines[0] || "Designing systems that"} baseDelay={120} />
              </span>
              <span className="block">
                <Words text={lines[1] || "feel human."} baseDelay={120 + (lines[0]?.split(/\s+/).length ?? 3) * STAGGER_MS} />
              </span>
            </h1>
          </div>

          {/* Right rail (desktop) */}
          <aside className="hidden lg:flex col-span-2 flex-col items-end justify-end pb-2">
            <div
              className="font-mono text-right"
              style={{
                fontSize: "0.7rem",
                letterSpacing: "0.18em",
                color: "var(--ink-3)",
                writingMode: "horizontal-tb",
                textTransform: "uppercase",
              }}
            >
              <div>№ 01</div>
              <div className="my-2 h-12 w-px ml-auto" style={{ background: "var(--line-2)" }} />
              <div>spring 2026 issue</div>
            </div>
          </aside>
        </div>

        {/* Lead paragraph */}
        <p
          className="body-lg mt-12"
          style={{
            color: "var(--ink-2)",
            maxWidth: 540,
            opacity: 0,
            animation: `word-rise 0.8s 0.6s var(--ease-page) forwards`,
          }}
        >
          {hero.subtitle}
        </p>

        {/* Meta strip */}
        <dl
          className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-y-6 sm:gap-y-0 sm:gap-x-0 max-w-3xl"
          style={{ opacity: 0, animation: `word-rise 0.8s 0.85s var(--ease-page) forwards` }}
        >
          {[
            ["Now —", site.role.split("·")[0]?.trim() || "M.Sc. Data Science & AI, TU/e"],
            ["Stack —", "AI/ML · full-stack · data UX"],
            ["Located —", site.location],
          ].map(([k, v], i) => (
            <div
              key={k}
              className="flex flex-col"
              style={{
                paddingLeft: i === 0 ? 0 : 18,
                marginLeft: i === 0 ? 0 : 18,
                borderLeft: i === 0 ? "none" : "1px solid var(--line-2)",
              }}
            >
              <dt className="mono-label" style={{ color: "var(--ink-3)" }}>{k}</dt>
              <dd className="mt-1 small" style={{ color: "var(--ink)" }}>{v}</dd>
            </div>
          ))}
        </dl>

        {/* CTAs */}
        <div
          className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4"
          style={{ opacity: 0, animation: `word-rise 0.8s 1.05s var(--ease-page) forwards` }}
        >
          <Link href={hero.ctaPrimary.href} className="btn-primary">
            <span>{hero.ctaPrimary.label}</span>
            <span aria-hidden>→</span>
          </Link>
          <Link href={hero.ctaSecondary.href} className="btn-secondary">
            <span>{hero.ctaSecondary.label}</span>
          </Link>
          {hero.showVivekaCta !== false && hero.vivekaCta && (
            <a
              href={hero.vivekaCta.href}
              target="_blank"
              rel="noreferrer"
              className="btn-accent"
            >
              <span>{hero.vivekaCta.label}</span>
              <ArrowUpRight size={12} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
