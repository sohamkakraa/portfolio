"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Compass, Film, MapPin, Music, Sparkles, Tv } from "lucide-react";
import type { PortfolioData } from "@/lib/portfolio-types";
import { loadPortfolioData, mergePortfolioData } from "@/lib/portfolio-storage";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProjectGrid from "@/components/ProjectGrid";
import PhotographySection from "@/components/PhotographySection";

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
    palette: "from-sky-500/35 via-cyan-400/25 to-blue-700/35",
  },
  {
    title: "Clean Architecture",
    author: "Robert C. Martin",
    theme: "Engineering",
    palette: "from-emerald-500/35 via-teal-400/25 to-cyan-700/35",
  },
  {
    title: "Deep Learning",
    author: "Goodfellow, Bengio, Courville",
    theme: "AI",
    palette: "from-violet-500/30 via-indigo-400/25 to-blue-700/35",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    theme: "Decision-making",
    palette: "from-amber-500/35 via-orange-400/25 to-red-700/35",
  },
  {
    title: "Atomic Habits",
    author: "James Clear",
    theme: "Execution",
    palette: "from-lime-500/35 via-emerald-400/25 to-green-700/35",
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
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(mergePortfolioData(initialData, stored));
    }
  }, [initialData]);

  const visibleHighlights = useMemo(
    () => data.highlights.items.filter((item) => item.title.trim().length),
    [data.highlights.items]
  );

  return (
    <div className="min-h-screen bg-[color:var(--background)] text-[color:var(--foreground)]">
      <Nav name={data.site.name} nav={data.site.nav} />

      <main>
        <section id="top" className="hero-surface relative overflow-hidden">
          <div className="hero-aurora absolute inset-0" />
          <div className="hero-grid absolute inset-0" />
          <div className="hero-orb hero-orb-a" />
          <div className="hero-orb hero-orb-b" />
          <div className="hero-noise absolute inset-0" />

          <div className="relative mx-auto flex min-h-[calc(100svh-4.5rem)] max-w-6xl items-center px-6 py-24">
            <div className="grid w-full gap-12 lg:grid-cols-[1.1fr_0.7fr] lg:items-center">
              <div>
                <p className="text-[11px] uppercase tracking-[0.4em] text-[color:var(--muted)]">
                  {data.hero.eyebrow}
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-6xl md:text-7xl">
                  <span className="block">{data.hero.titleLine1}</span>
                  <span className="block bg-[linear-gradient(110deg,#0a63ff,#5ad1ff)] bg-clip-text text-transparent">
                    {data.hero.titleLine2}
                  </span>
                </h1>
                <p className="text-balance mt-6 max-w-2xl text-base leading-relaxed text-[color:var(--muted)] sm:text-lg">
                  {data.hero.subtitle}
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={data.hero.ctaPrimary.href}
                    className="btn-primary rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  >
                    {data.hero.ctaPrimary.label}
                  </Link>
                  <Link
                    href={data.hero.ctaSecondary.href}
                    className="btn-secondary rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
                  >
                    {data.hero.ctaSecondary.label}
                  </Link>
                </div>

                <div className="mt-10 flex flex-wrap gap-3">
                  {data.hero.badges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[color:color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color:color-mix(in_srgb,var(--surface)_68%,transparent)] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]"
                    >
                      <span
                        aria-hidden="true"
                        className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--muted)_65%,transparent)]"
                      />
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel rounded-[32px] p-6">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                    Current focus
                  </p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
                    {data.site.role}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
                    Building AI-powered products that connect research rigor, strong engineering, and clear UX.
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                    <span>{data.site.location}</span>
                    <span>Open to select collaborations</span>
                  </div>
                </div>

                <div className="section-card hover-rise rounded-[28px] p-6">
                  <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">
                    Contact
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-[color:var(--foreground)]">{data.site.email}</p>
                  <a
                    href={`mailto:${data.site.email}`}
                    className="mt-6 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[color:var(--foreground)]"
                  >
                    Send a note
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="highlights" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">
                  {data.highlights.title}
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                  {data.highlights.description}
                </h2>
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {visibleHighlights.map((item) => (
                <article key={item.title} className="section-card hover-rise rounded-3xl p-6">
                  <h3 className="text-xl font-semibold text-[color:var(--foreground)]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="section-card rounded-[36px] p-8 sm:p-10 md:p-14">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
                <div className="relative overflow-hidden rounded-[28px] border border-[color:var(--border)] bg-[color:var(--surface-elevated)]">
                  <Image
                    src="/Me.jpg"
                    alt={`${data.site.name} portrait`}
                    width={1200}
                    height={1600}
                    className="h-full max-h-[480px] w-full object-cover"
                    priority
                  />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">{data.about.title}</p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                    {data.about.subtitle}
                  </h2>
                  <p className="mt-5 text-base leading-relaxed text-[color:var(--muted)]">{data.about.body}</p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-2">
                    {data.about.highlights.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-3"
                      >
                        <Sparkles size={14} className="text-[color:var(--accent)]" />
                        <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="projects" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">{data.projects.title}</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                  {data.projects.description}
                </h2>
              </div>
              <Link
                href="#contact"
                className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground)]"
              >
                Contact ↗
              </Link>
            </div>

            <div className="mt-10">
              <ProjectGrid items={data.projects.items} />
            </div>
          </div>
        </section>

        <section id="photography" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <PhotographySection section={data.photography} />
          </div>
        </section>

        <section id="life" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <div className="flex flex-col gap-4">
              <p className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Beyond work</p>
              <h2 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                Life, books, places, and entertainment I return to.
              </h2>
            </div>

            <div className="mt-8 space-y-4">
              <details open className="section-card rounded-3xl p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
                    <Compass size={15} />
                    Life snapshots
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Expand</span>
                </summary>
                <div className="mt-5 grid gap-4 border-t border-[color:var(--border)] pt-5 md:grid-cols-3">
                  {lifeMoments.map((moment) => (
                    <article
                      key={moment.title}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4"
                    >
                      <p className="text-sm font-semibold text-[color:var(--foreground)]">{moment.title}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">{moment.note}</p>
                      <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{moment.detail}</p>
                    </article>
                  ))}
                </div>
              </details>

              <details className="section-card rounded-3xl p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
                    <BookOpen size={15} />
                    Reading library
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Expand</span>
                </summary>
                <div className="mt-5 border-t border-[color:var(--border)] pt-5">
                  <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                    {bookshelf.map((book) => (
                      <article key={book.title} className="group">
                        <div
                          className={`relative aspect-[2/3] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-gradient-to-br ${book.palette} p-4 shadow-[0_14px_35px_rgba(15,20,35,0.14)]`}
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.35),transparent_45%)]" />
                          <div className="relative flex h-full flex-col justify-between">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-white/80">{book.theme}</p>
                            <div>
                              <h3 className="text-sm font-semibold leading-tight text-white">{book.title}</h3>
                              <p className="mt-2 text-xs text-white/80">{book.author}</p>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </details>

              <details className="section-card rounded-3xl p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
                    <MapPin size={15} />
                    Places traveled
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Expand</span>
                </summary>
                <div className="mt-5 grid gap-4 border-t border-[color:var(--border)] pt-5 sm:grid-cols-2">
                  {travelLog.map((entry) => (
                    <article
                      key={entry.place}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4"
                    >
                      <p className="text-base font-semibold tracking-tight text-[color:var(--foreground)]">{entry.place}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">{entry.context}</p>
                      <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">{entry.note}</p>
                    </article>
                  ))}
                </div>
              </details>

              <details className="section-card rounded-3xl p-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
                    <Tv size={15} />
                    Entertainment picks
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">Expand</span>
                </summary>
                <div className="mt-5 grid gap-4 border-t border-[color:var(--border)] pt-5 md:grid-cols-3">
                  {entertainmentPicks.map((entry) => (
                    <article
                      key={entry.title}
                      className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface-elevated)] p-4"
                    >
                      <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.22em] text-[color:var(--foreground)]">
                        <entry.icon size={14} />
                        {entry.title}
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-[color:var(--muted)]">
                        {entry.picks.map((pick) => (
                          <li key={pick} className="inline-flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" />
                            <span>{pick}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </details>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24">
          <div className="mx-auto max-w-6xl px-6 pb-24 pt-10">
            <div className="section-card rounded-[36px] p-10 md:p-14">
              <p className="text-[11px] uppercase tracking-[0.32em] text-[color:var(--muted)]">{data.contact.title}</p>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
                {data.contact.description}
              </h2>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${data.contact.email}`}
                  className="btn-secondary rounded-full px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em]"
                >
                  {data.contact.email}
                </a>
                <Link
                  href="#top"
                  className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[color:var(--foreground)]"
                >
                  Back to top
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer note={data.footer.note} socials={data.site.socials} links={data.footer.links} />
    </div>
  );
}
