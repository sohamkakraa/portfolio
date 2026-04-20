"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Film,
  MapPin,
  Music,
  Sparkles,
  Tv,
  ExternalLink,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LifeEntertainment, PortfolioData } from "@/lib/portfolio-types";
import { loadPortfolioData, mergePortfolioData } from "@/lib/portfolio-storage";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProjectGrid from "@/components/ProjectGrid";
import PhotographySection from "@/components/PhotographySection";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BookCoverTile from "@/components/BookCoverTile";

type PortfolioPageProps = {
  initialData: PortfolioData;
};

function LifeAccordionSummary({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <span className="inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
        <Icon size={16} className="text-[color:var(--accent)]" />
        {label}
      </span>
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--fg-muted)]">
        <ChevronDown
          size={20}
          className="absolute transition-opacity duration-200 ease-out group-open:opacity-0"
          aria-hidden
        />
        <ChevronUp
          size={20}
          className="absolute opacity-0 transition-opacity duration-200 ease-out group-open:opacity-100"
          aria-hidden
        />
      </span>
    </>
  );
}

function entertainmentIcon(kind: LifeEntertainment["kind"]) {
  switch (kind) {
    case "film":
      return Film;
    case "music":
      return Music;
    case "show":
      return Tv;
    default:
      return Tv;
  }
}

export default function PortfolioPage({ initialData }: PortfolioPageProps) {
  const [data, setData] = useState<PortfolioData>(initialData);

  useEffect(() => {
    // 1. Immediately apply any localStorage overrides (fast, no network)
    const stored = loadPortfolioData();
    if (stored) {
      setData(mergePortfolioData(initialData, stored));
    }

    // 2. Fetch latest CMS data from server (picks up Redis-persisted edits)
    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData: PortfolioData | null) => {
        if (serverData) {
          setData(serverData);
        }
      })
      .catch(() => {
        // Network error — keep localStorage / initial data
      });
  }, [initialData]);

  const visibleHighlights = useMemo(
    () => data.highlights.items.filter((item) => item.title.trim().length),
    [data.highlights.items]
  );

  return (
    <div className="min-h-screen bg-[color:var(--bg)] text-[color:var(--fg)]">
      <Nav name={data.site.name} nav={data.site.nav} />

      <main>
        {/* ════════════════ HERO ════════════════ */}
        <section id="top" className="relative min-h-[100dvh] overflow-hidden">
          {/* Background effects */}
          <div className="hero-gradient-mesh pointer-events-none" aria-hidden="true" />
          <div className="hero-grid-lines pointer-events-none" aria-hidden="true" />
          <div className="hero-vignette pointer-events-none" aria-hidden="true" />

          <div className="relative z-10 flex min-h-[100dvh] flex-col">
            <div className="section-container flex min-h-0 flex-1 flex-col pt-28 md:pt-32">
              <div className="flex min-h-0 flex-1 flex-col justify-center py-12 md:py-16">
                <div className="max-w-4xl">
                  {/* Eyebrow */}
                  <p className="animate-hero-text section-label">
                    {data.hero.eyebrow}
                  </p>

                  {/* Title */}
                  <h1 className="mt-6">
                    <span className="animate-hero-text animate-hero-text-delay-1 block text-[clamp(2rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[color:var(--fg)]">
                      {data.hero.titleLine1}
                    </span>
                    <span className="animate-hero-text animate-hero-text-delay-2 block text-[clamp(2rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-gradient">
                      {data.hero.titleLine2}
                    </span>
                  </h1>

                  {/* Subtitle */}
                  <p className="animate-hero-text animate-hero-text-delay-3 mt-8 max-w-2xl text-lg leading-relaxed text-[color:var(--fg-muted)] md:text-xl">
                    {data.hero.subtitle}
                  </p>

                  {/* CTAs */}
                  <div className="animate-hero-text animate-hero-text-delay-4 mt-10 flex flex-wrap items-center gap-4">
                    <Link href={data.hero.ctaPrimary.href} className="btn-primary">
                      <span>{data.hero.ctaPrimary.label}</span>
                      <ArrowDown size={16} />
                    </Link>
                    <Link href={data.hero.ctaSecondary.href} className="btn-secondary">
                      <span>{data.hero.ctaSecondary.label}</span>
                    </Link>
                    {data.hero.showVivekaCta !== false && data.hero.vivekaCta && (
                      <a
                        href={data.hero.vivekaCta.href}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-accent"
                      >
                        <span>{data.hero.vivekaCta.label}</span>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="animate-hero-text animate-hero-text-delay-5 mt-12 flex flex-wrap gap-2 md:gap-3">
                    {data.hero.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)]/50 px-3 py-1.5 text-[10px] md:px-4 md:py-2 md:text-[11px] font-medium uppercase tracking-[0.15em] text-[color:var(--fg-muted)]"
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]"
                        />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Scroll indicator — pinned to lower viewport, not content height */}
              <div
                className="flex shrink-0 justify-center pb-10 pt-4 max-[480px]:pb-[max(2.5rem,env(safe-area-inset-bottom))]"
                aria-hidden="true"
              >
                <div className="scroll-indicator flex flex-col items-center gap-2 text-[color:var(--fg-subtle)]">
                  <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
                  <ArrowDown size={14} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════ HIGHLIGHTS ════════════════ */}
        <section id="highlights" className="scroll-mt-24 py-24">
          <div className="section-container">
            <ScrollReveal>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="section-label">{data.highlights.title}</p>
                  <h2 className="section-title mt-4">{data.highlights.description}</h2>
                </div>
              </div>
            </ScrollReveal>

            <div className="mt-12 grid gap-4 md:gap-6 md:grid-cols-3">
              {visibleHighlights.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 100}>
                  <article className="glass-card p-6 md:p-8 h-full">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--accent)]/10">
                      <Sparkles size={18} className="text-[color:var(--accent)]" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold tracking-tight text-[color:var(--fg)]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-muted)]">
                      {item.description}
                    </p>
                  </article>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <div className="section-container">
          <div className="section-divider" />
        </div>

        {/* ════════════════ ABOUT ════════════════ */}
        <section id="about" className="scroll-mt-24 py-24">
          <div className="section-container">
            <ScrollReveal>
              <div className="overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--bg-surface)]">
                <div className="grid gap-0 lg:grid-cols-[0.8fr_1.2fr]">
                  {/* Image */}
                  <div className="relative min-h-[280px] sm:min-h-[350px] lg:min-h-[400px] overflow-hidden bg-[color:var(--bg-elevated)]">
                    <Image
                      src={data.about.portraitSrc || "/Me.jpg"}
                      alt={`${data.site.name} portrait`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[color:var(--bg-surface)] opacity-30 lg:opacity-60" />
                  </div>

                  {/* Content */}
                  <div className="p-6 sm:p-8 lg:p-14">
                    <p className="section-label">{data.about.title}</p>
                    <h2 className="section-title mt-4">{data.about.subtitle}</h2>
                    <p className="mt-6 text-base leading-[1.8] text-[color:var(--fg-muted)]">
                      {data.about.body}
                    </p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      {data.about.highlights.map((item) => (
                        <div
                          key={item}
                          className="flex items-start gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4"
                        >
                          <Sparkles
                            size={14}
                            className="mt-0.5 shrink-0 text-[color:var(--accent)]"
                          />
                          <span className="text-xs leading-relaxed text-[color:var(--fg-muted)]">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 flex flex-wrap gap-3">
                      <a href={`mailto:${data.site.email}`} className="btn-primary">
                        <Mail size={14} />
                        <span>Get in touch</span>
                      </a>
                      {data.hero.showVivekaCta !== false && data.hero.vivekaCta && (
                        <a
                          href={data.hero.vivekaCta.href}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-secondary"
                        >
                          <span>Read {data.hero.vivekaCta.label}</span>
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-container">
          <div className="section-divider" />
        </div>

        {/* ════════════════ PROJECTS ════════════════ */}
        <section id="projects" className="scroll-mt-24 py-24">
          <div className="section-container">
            <ScrollReveal>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="section-label">{data.projects.title}</p>
                  <h2 className="section-title mt-4">{data.projects.description}</h2>
                </div>
                <Link
                  href="#contact"
                  className="flex items-center gap-2 text-sm font-semibold text-[color:var(--fg)] transition hover:text-[color:var(--accent)]"
                >
                  Let&apos;s collaborate
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </ScrollReveal>

            <div className="mt-12">
              <ProjectGrid items={data.projects.items} />
            </div>
          </div>
        </section>

        <div className="section-container">
          <div className="section-divider" />
        </div>

        {/* ════════════════ PHOTOGRAPHY ════════════════ */}
        <section id="photography" className="scroll-mt-24 py-24">
          <div className="section-container">
            <PhotographySection section={data.photography} maxPreview={3} />

            {/* CTA to full photography diary */}
            <ScrollReveal>
              <div className="mt-12 flex flex-col items-center text-center">
                <p className="text-sm text-[color:var(--fg-muted)]">
                  This is just a preview. The full collection lives on its own site.
                </p>
                <a
                  href="https://photography.sohamkakra.com"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary mt-6"
                >
                  <span>Explore full gallery</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <div className="section-container">
          <div className="section-divider" />
        </div>

        {/* ════════════════ LIFE ════════════════ */}
        <section id="life" className="scroll-mt-24 py-24">
          <div className="section-container">
            <ScrollReveal>
              <p className="section-label">{data.life.eyebrow}</p>
              <h2 className="section-title mt-4">{data.life.title}</h2>
            </ScrollReveal>

            <div className="mt-12 space-y-4">
              {/* Life snapshots */}
              <ScrollReveal delay={100}>
                <details open className="group glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <LifeAccordionSummary icon={Compass} label="Life snapshots" />
                  </summary>
                  <div className="grid gap-3 sm:gap-4 border-t border-[color:var(--border)] p-4 sm:p-6 md:grid-cols-3">
                    {data.life.snapshots.map((moment) => (
                      <article
                        key={moment.title}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4 md:p-5"
                      >
                        <p className="text-sm font-bold text-[color:var(--fg)]">{moment.title}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                          {moment.note}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-muted)]">
                          {moment.detail}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              </ScrollReveal>

              {/* Books */}
              <ScrollReveal delay={200}>
                <details className="group glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <LifeAccordionSummary icon={BookOpen} label="Reading library" />
                  </summary>
                  <div className="border-t border-[color:var(--border)] p-4 sm:p-6">
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:gap-6 lg:grid-cols-5">
                      {data.life.books.map((book) => (
                        <article key={book.title} className="group">
                          <BookCoverTile book={book} />
                          <div className="mt-3 space-y-1">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                              {book.theme}
                            </p>
                            <h3 className="text-sm font-bold leading-snug text-[color:var(--fg)] line-clamp-4">
                              {book.title}
                            </h3>
                            <p className="text-xs text-[color:var(--fg-muted)] line-clamp-2">{book.author}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </details>
              </ScrollReveal>

              {/* Places */}
              <ScrollReveal delay={300}>
                <details className="group glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <LifeAccordionSummary icon={MapPin} label="Places traveled" />
                  </summary>
                  <div className="grid gap-4 border-t border-[color:var(--border)] p-6 sm:grid-cols-2">
                    {data.life.places.map((entry) => (
                      <article
                        key={entry.place}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4 md:p-5"
                      >
                        <p className="text-base font-bold tracking-tight text-[color:var(--fg)]">
                          {entry.place}
                        </p>
                        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[color:var(--accent)]">
                          {entry.context}
                        </p>
                        <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-muted)]">
                          {entry.note}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              </ScrollReveal>

              {/* Entertainment */}
              <ScrollReveal delay={400}>
                <details className="group glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <LifeAccordionSummary icon={Tv} label="Entertainment picks" />
                  </summary>
                  <div className="grid gap-3 sm:gap-4 border-t border-[color:var(--border)] p-4 sm:p-6 md:grid-cols-3">
                    {data.life.entertainment.map((entry) => {
                      const Icon = entertainmentIcon(entry.kind);
                      return (
                      <article
                        key={entry.title}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-4 md:p-5"
                      >
                        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
                          <Icon size={14} className="text-[color:var(--accent)]" />
                          {entry.title}
                        </p>
                        <ul className="mt-4 space-y-2.5 text-sm text-[color:var(--fg-muted)]">
                          {entry.picks.map((pick) => (
                            <li key={pick} className="flex items-start gap-2.5">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--accent)]" />
                              <span>{pick}</span>
                            </li>
                          ))}
                        </ul>
                      </article>
                    );
                    })}
                  </div>
                </details>
              </ScrollReveal>
            </div>
          </div>
        </section>

        <div className="section-container">
          <div className="section-divider" />
        </div>

        {/* ════════════════ CONTACT ════════════════ */}
        <section id="contact" className="scroll-mt-24 py-24">
          <div className="section-container">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-[32px] border border-[color:var(--border)] bg-[color:var(--bg-surface)] p-10 md:p-16">
                {/* Gradient mesh for contact */}
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_50%,rgba(99,102,241,0.15),transparent)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_80%_30%,rgba(168,85,247,0.1),transparent)]" />
                </div>

                <div className="relative z-10">
                  <p className="section-label">{data.contact.title}</p>
                  <h2 className="section-title mt-4 max-w-3xl">
                    {data.contact.description}
                  </h2>

                  <div className="mt-10 flex flex-wrap items-center gap-4">
                    <a href={`mailto:${data.contact.email}`} className="btn-primary">
                      <Mail size={16} />
                      <span>{data.contact.email}</span>
                    </a>
                    <Link href="#top" className="btn-secondary">
                      <span>Back to top</span>
                    </Link>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer
        name={data.site.name}
        note={data.footer.note}
        socials={data.site.socials}
        links={data.footer.links}
      />
    </div>
  );
}
