"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  BookOpen,
  Compass,
  Film,
  MapPin,
  Music,
  Sparkles,
  Tv,
  ExternalLink,
  Mail,
} from "lucide-react";
import type { PortfolioData } from "@/lib/portfolio-types";
import { loadPortfolioData, mergePortfolioData } from "@/lib/portfolio-storage";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProjectGrid from "@/components/ProjectGrid";
import PhotographySection from "@/components/PhotographySection";
import ScrollReveal from "@/components/ui/ScrollReveal";

type PortfolioPageProps = {
  initialData: PortfolioData;
};

type LifeMoment = {
  title: string;
  note: string;
  detail: string;
};

type BookEntry = {
  title: string;
  author: string;
  theme: string;
  palette: string;
};

type TravelEntry = {
  place: string;
  context: string;
  note: string;
};

type EntertainmentEntry = {
  title: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  picks: string[];
};

const lifeMoments: LifeMoment[] = [
  {
    title: "Research and product loops",
    note: "TU/e lab time + build sprints",
    detail:
      "Most weeks are split between ML research, product prototyping, and turning technical ideas into interfaces people can actually use.",
  },
  {
    title: "Photography in motion",
    note: "Field sessions after classes",
    detail:
      "I treat photography as a design practice: framing, patience, and timing. It keeps my visual thinking sharp for product work.",
  },
  {
    title: "Systems-first mindset",
    note: "From data to decisions",
    detail:
      "I enjoy building end-to-end systems where data collection, model logic, and UX all support one clear outcome.",
  },
];

const bookshelf: BookEntry[] = [
  {
    title: "Designing Data-Intensive Applications",
    author: "Martin Kleppmann",
    theme: "Systems",
    palette: "from-indigo-600/50 via-blue-500/30 to-cyan-600/50",
  },
  {
    title: "Clean Architecture",
    author: "Robert C. Martin",
    theme: "Engineering",
    palette: "from-emerald-600/50 via-teal-500/30 to-cyan-600/50",
  },
  {
    title: "Deep Learning",
    author: "Goodfellow, Bengio, Courville",
    theme: "AI",
    palette: "from-violet-600/50 via-purple-500/30 to-indigo-600/50",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    theme: "Decision-making",
    palette: "from-amber-600/50 via-orange-500/30 to-red-600/50",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    theme: "Execution",
    palette: "from-lime-600/50 via-emerald-500/30 to-green-600/50",
  },
];

const travelLog: TravelEntry[] = [
  {
    place: "Eindhoven, Netherlands",
    context: "Current base",
    note: "Graduate work at TU/e and a strong student-builder ecosystem.",
  },
  {
    place: "Dubai, U.A.E.",
    context: "Education and work",
    note: "Shaped my practical approach to analytics, operations, and product delivery.",
  },
  {
    place: "Hyderabad, India",
    context: "Early engineering chapter",
    note: "Software internship experience and foundation in full-stack execution.",
  },
  {
    place: "Abu Dhabi, U.A.E.",
    context: "Regional projects",
    note: "Exposure to cross-functional teams and enterprise-scale workflows.",
  },
];

const entertainmentPicks: EntertainmentEntry[] = [
  {
    title: "Films",
    icon: Film,
    picks: ["Sci-fi worldbuilding", "Biographical dramas", "Cinematic documentaries"],
  },
  {
    title: "Music",
    icon: Music,
    picks: ["Lo-fi while coding", "Instrumental focus playlists", "Indie and alternative"],
  },
  {
    title: "Shows",
    icon: Tv,
    picks: ["Tech and startup series", "Mystery thrillers", "Character-driven stories"],
  },
];

export default function PortfolioPage({ initialData }: PortfolioPageProps) {
  const [data, setData] = useState<PortfolioData>(initialData);

  useEffect(() => {
    const stored = loadPortfolioData();
    if (!stored) return;
    const id = window.setTimeout(() => {
      setData(mergePortfolioData(initialData, stored));
    }, 0);
    return () => window.clearTimeout(id);
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
                    <span className="animate-hero-text animate-hero-text-delay-1 block text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-[color:var(--fg)]">
                      {data.hero.titleLine1}
                    </span>
                    <span className="animate-hero-text animate-hero-text-delay-2 block text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.04em] text-gradient">
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
                    <a
                      href="https://viveka.sohamkakra.com"
                      target="_blank"
                      rel="noreferrer"
                      className="btn-accent"
                    >
                      <span>Viveka</span>
                      <ExternalLink size={14} />
                    </a>
                  </div>

                  {/* Badges */}
                  <div className="animate-hero-text animate-hero-text-delay-5 mt-12 flex flex-wrap gap-3">
                    {data.hero.badges.map((badge) => (
                      <span
                        key={badge}
                        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--bg-surface)]/50 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.15em] text-[color:var(--fg-muted)]"
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

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {visibleHighlights.map((item, i) => (
                <ScrollReveal key={item.title} delay={i * 100}>
                  <article className="glass-card p-8 h-full">
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
                  <div className="relative min-h-[400px] overflow-hidden bg-[color:var(--bg-elevated)]">
                    <Image
                      src="/Me.jpg"
                      alt={`${data.site.name} portrait`}
                      fill
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[color:var(--bg-surface)] opacity-30 lg:opacity-60" />
                  </div>

                  {/* Content */}
                  <div className="p-8 sm:p-10 lg:p-14">
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
                      <a
                        href="https://viveka.sohamkakra.com"
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                      >
                        <span>Read Viveka</span>
                        <ExternalLink size={14} />
                      </a>
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
            <PhotographySection section={data.photography} />
          </div>
        </section>

        <div className="section-container">
          <div className="section-divider" />
        </div>

        {/* ════════════════ LIFE ════════════════ */}
        <section id="life" className="scroll-mt-24 py-24">
          <div className="section-container">
            <ScrollReveal>
              <p className="section-label">Beyond work</p>
              <h2 className="section-title mt-4">
                Life, books, places, and entertainment I return to.
              </h2>
            </ScrollReveal>

            <div className="mt-12 space-y-4">
              {/* Life snapshots */}
              <ScrollReveal delay={100}>
                <details open className="glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
                      <Compass size={16} className="text-[color:var(--accent)]" />
                      Life snapshots
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                      Toggle
                    </span>
                  </summary>
                  <div className="grid gap-4 border-t border-[color:var(--border)] p-6 md:grid-cols-3">
                    {lifeMoments.map((moment) => (
                      <article
                        key={moment.title}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-5"
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
                <details className="glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
                      <BookOpen size={16} className="text-[color:var(--accent)]" />
                      Reading library
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                      Toggle
                    </span>
                  </summary>
                  <div className="border-t border-[color:var(--border)] p-6">
                    <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                      {bookshelf.map((book) => (
                        <article key={book.title} className="group">
                          <div
                            className={`relative aspect-[2/3] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-gradient-to-br ${book.palette} p-4 shadow-lg transition-transform hover:-translate-y-1`}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.2),transparent_45%)]" />
                            <div className="relative flex h-full flex-col justify-between">
                              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">
                                {book.theme}
                              </p>
                              <div>
                                <h3 className="text-sm font-bold leading-tight text-white">
                                  {book.title}
                                </h3>
                                <p className="mt-2 text-xs text-white/70">{book.author}</p>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </details>
              </ScrollReveal>

              {/* Places */}
              <ScrollReveal delay={300}>
                <details className="glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
                      <MapPin size={16} className="text-[color:var(--accent)]" />
                      Places traveled
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                      Toggle
                    </span>
                  </summary>
                  <div className="grid gap-4 border-t border-[color:var(--border)] p-6 sm:grid-cols-2">
                    {travelLog.map((entry) => (
                      <article
                        key={entry.place}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-5"
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
                <details className="glass-card !rounded-[24px] overflow-hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-6 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2.5 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
                      <Tv size={16} className="text-[color:var(--accent)]" />
                      Entertainment picks
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                      Toggle
                    </span>
                  </summary>
                  <div className="grid gap-4 border-t border-[color:var(--border)] p-6 md:grid-cols-3">
                    {entertainmentPicks.map((entry) => (
                      <article
                        key={entry.title}
                        className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] p-5"
                      >
                        <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-[color:var(--fg)]">
                          <entry.icon size={14} className="text-[color:var(--accent)]" />
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
                    ))}
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
