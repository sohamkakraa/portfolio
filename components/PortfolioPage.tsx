"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Film,
  MapPin,
  Music,
  Tv,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LifeEntertainment, PortfolioData } from "@/lib/portfolio-types";
import { loadPortfolioData, mergePortfolioData } from "@/lib/portfolio-storage";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import HeroEditorial from "@/components/HeroEditorial";
import ProjectsHoverExpand from "@/components/ProjectsHoverExpand";
import PhotographyGlobe from "@/components/PhotographyGlobe";
import ScrollReveal from "@/components/ui/ScrollReveal";
import BookCoverTile from "@/components/BookCoverTile";
import LoadingScreen from "@/components/LoadingScreen";

type PortfolioPageProps = {
  initialData: PortfolioData;
};

function LifeAccordionSummary({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <>
      <span className="mono-label inline-flex items-center gap-2.5" style={{ color: "var(--ink)" }}>
        <Icon size={14} style={{ color: "var(--accent)" }} />
        {label}
      </span>
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center" style={{ color: "var(--ink-2)" }}>
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
  const [loading, setLoading] = useState(true);
  const [loaderMounted, setLoaderMounted] = useState(true);

  useEffect(() => {
    let fetchDone = false;
    let timerDone = false;
    const tryDismiss = () => { if (fetchDone && timerDone) setLoading(false); };

    const stored = loadPortfolioData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setData(mergePortfolioData(initialData, stored));

    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverData: PortfolioData | null) => {
        if (serverData) setData(serverData);
      })
      .catch(() => {})
      .finally(() => { fetchDone = true; tryDismiss(); });

    // Terminal boot — short cap; loader handles its own internal pacing.
    const minTimer = setTimeout(() => { timerDone = true; tryDismiss(); }, 1400);
    return () => clearTimeout(minTimer);
  }, [initialData]);

  // Preload book covers
  useEffect(() => {
    data.life.books.forEach((book) => {
      const src = book.coverSrc?.trim();
      const isbn = book.isbn?.trim();
      const url = src || (isbn ? `/api/book-cover?isbn=${encodeURIComponent(isbn)}` : null);
      if (!url) return;
      const img = document.createElement("img");
      img.src = url;
    });
  }, [data.life.books]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)" }}>
      {loaderMounted && (
        <LoadingScreen
          visible={loading}
          onComplete={() => setLoaderMounted(false)}
        />
      )}
      <Nav name={data.site.name} nav={data.site.nav} />

      <main>
        <HeroEditorial hero={data.hero} site={data.site} />

        <SectionDivider />

        {/* ════════════════ ABOUT ════════════════ */}
        <section
          id="about"
          className="scroll-mt-24"
          style={{ paddingTop: "clamp(5rem, 10vw, 8rem)", paddingBottom: "clamp(5rem, 10vw, 8rem)" }}
        >
          <div className="section-container">
            <ScrollReveal>
              <div
                className="overflow-hidden"
                style={{
                  background: "var(--bg-2)",
                  borderRadius: 24,
                }}
              >
                <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
                  <div
                    className="relative overflow-hidden"
                    style={{ minHeight: 320, background: "var(--bg-3)" }}
                  >
                    <Image
                      src={data.about.portraitSrc || "/Me.jpg"}
                      alt={`${data.site.name} portrait`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "linear-gradient(to top, var(--bg-2), transparent 50%)",
                        pointerEvents: "none",
                      }}
                    />
                    <span
                      className="mono-label absolute"
                      style={{ top: 18, left: 18, color: "var(--ink-3)" }}
                    >
                      {"// portrait"}
                    </span>
                  </div>

                  <div className="p-8 sm:p-10 lg:p-14">
                    <p className="section-label">{"// 01 · about"}</p>
                    <h2 className="section-title mt-3" style={{ textWrap: "balance" }}>
                      {data.about.subtitle}
                    </h2>
                    <p className="body-lg mt-6" style={{ color: "var(--ink-2)" }}>
                      {data.about.body}
                    </p>

                    <div
                      className="mt-10 grid gap-4 sm:grid-cols-2"
                      style={{ borderTop: "1px solid var(--line)", paddingTop: 24 }}
                    >
                      {data.about.highlights.map((item) => (
                        <div
                          key={item}
                          style={{
                            border: "1px solid var(--line)",
                            borderRadius: 14,
                            padding: 16,
                            background: "var(--bg-3)",
                          }}
                        >
                          <p className="body" style={{ color: "var(--ink-2)" }}>
                            <span style={{ color: "var(--accent)", marginRight: 8 }}>›</span>
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                      <a href={`mailto:${data.site.email}`} className="btn-primary">
                        <Mail size={14} />
                        <span>Get in touch</span>
                      </a>
                      {data.hero.showVivekaCta !== false && data.hero.vivekaCta && (
                        <a
                          href={data.hero.vivekaCta.href}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-accent"
                        >
                          <span>Read {data.hero.vivekaCta.label}</span>
                          <ArrowUpRight size={12} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════ PROJECTS ════════════════ */}
        <section
          id="projects"
          className="scroll-mt-24"
          style={{ paddingTop: "clamp(5rem, 10vw, 8rem)", paddingBottom: "clamp(5rem, 10vw, 8rem)" }}
        >
          <div className="section-container">
            <ScrollReveal>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-10">
                <div>
                  <p className="section-label">{"// 02 · selected work"}</p>
                  <h2 className="section-title mt-3">
                    {data.projects.description}
                  </h2>
                </div>
                <span className="mono-label" style={{ color: "var(--ink-3)" }}>
                  hover to expand
                </span>
              </div>
            </ScrollReveal>

            <ProjectsHoverExpand items={data.projects.items} />
          </div>
        </section>

        <SectionDivider />

        {/* ════════════════ PHOTOGRAPHY ════════════════ */}
        <PhotographyGlobe section={data.photography} />

        <SectionDivider />

        {/* ════════════════ LIFE ════════════════ */}
        <section
          id="life"
          className="scroll-mt-24"
          style={{ paddingTop: "clamp(5rem, 10vw, 8rem)", paddingBottom: "clamp(5rem, 10vw, 8rem)" }}
        >
          <div className="section-container">
            <ScrollReveal>
              <p className="section-label">{`// 04 · ${data.life.eyebrow.toLowerCase()}`}</p>
              <h2 className="section-title mt-3" style={{ maxWidth: "900px" }}>
                {data.life.title}
              </h2>
            </ScrollReveal>

            <div className="mt-12 space-y-3">
              <ScrollReveal delay={100}>
                <details
                  open
                  className="group overflow-hidden"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                  }}
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 outline-none [&::-webkit-details-marker]:hidden"
                  >
                    <LifeAccordionSummary icon={Compass} label="Life snapshots" />
                  </summary>
                  <div
                    className="grid gap-3 sm:gap-4 p-5 md:grid-cols-3"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    {data.life.snapshots.map((moment) => (
                      <article
                        key={moment.title}
                        style={{
                          borderRadius: 14,
                          border: "1px solid var(--line)",
                          background: "var(--bg-3)",
                          padding: 18,
                        }}
                      >
                        <p className="display-md font-display" style={{ color: "var(--ink)", fontSize: "1.25rem" }}>
                          {moment.title}
                        </p>
                        <p className="mono-label mt-2" style={{ color: "var(--accent)" }}>
                          {moment.note}
                        </p>
                        <p className="body mt-3" style={{ color: "var(--ink-2)" }}>
                          {moment.detail}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              </ScrollReveal>

              <ScrollReveal delay={200}>
                <details
                  className="group overflow-hidden"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                  }}
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 outline-none [&::-webkit-details-marker]:hidden"
                  >
                    <LifeAccordionSummary icon={BookOpen} label="Reading library" />
                  </summary>
                  <div className="p-5" style={{ borderTop: "1px solid var(--line)" }}>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 lg:gap-6">
                      {data.life.books.map((book) => (
                        <article key={book.title}>
                          <BookCoverTile book={book} />
                          <div className="mt-3 space-y-1">
                            <p className="mono-label" style={{ color: "var(--accent)" }}>{book.theme}</p>
                            <h3 className="body" style={{ color: "var(--ink)", fontWeight: 600 }}>
                              {book.title}
                            </h3>
                            <p className="small" style={{ color: "var(--ink-2)" }}>
                              {book.author}
                            </p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </details>
              </ScrollReveal>

              <ScrollReveal delay={300}>
                <details
                  className="group overflow-hidden"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                  }}
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 outline-none [&::-webkit-details-marker]:hidden"
                  >
                    <LifeAccordionSummary icon={MapPin} label="Places traveled" />
                  </summary>
                  <div
                    className="grid gap-4 p-5 sm:grid-cols-2"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    {data.life.places.map((entry) => (
                      <article
                        key={entry.place}
                        style={{
                          borderRadius: 14,
                          border: "1px solid var(--line)",
                          background: "var(--bg-3)",
                          padding: 18,
                        }}
                      >
                        <p className="display-md font-display" style={{ color: "var(--ink)", fontSize: "1.4rem" }}>
                          {entry.place}
                        </p>
                        <p className="mono-label mt-2" style={{ color: "var(--accent)" }}>
                          {entry.context}
                        </p>
                        <p className="body mt-3" style={{ color: "var(--ink-2)" }}>
                          {entry.note}
                        </p>
                      </article>
                    ))}
                  </div>
                </details>
              </ScrollReveal>

              <ScrollReveal delay={400}>
                <details
                  className="group overflow-hidden"
                  style={{
                    background: "var(--bg-2)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                  }}
                >
                  <summary
                    className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 outline-none [&::-webkit-details-marker]:hidden"
                  >
                    <LifeAccordionSummary icon={Tv} label="Entertainment picks" />
                  </summary>
                  <div
                    className="grid gap-3 p-5 md:grid-cols-3"
                    style={{ borderTop: "1px solid var(--line)" }}
                  >
                    {data.life.entertainment.map((entry) => {
                      const Icon = entertainmentIcon(entry.kind);
                      return (
                        <article
                          key={entry.title}
                          style={{
                            borderRadius: 14,
                            border: "1px solid var(--line)",
                            background: "var(--bg-3)",
                            padding: 18,
                          }}
                        >
                          <p
                            className="mono-label inline-flex items-center gap-2"
                            style={{ color: "var(--ink)" }}
                          >
                            <Icon size={14} style={{ color: "var(--accent)" }} />
                            {entry.title}
                          </p>
                          <ul className="mt-4 space-y-2.5">
                            {entry.picks.map((pick) => (
                              <li
                                key={pick}
                                className="body flex items-start gap-2.5"
                                style={{ color: "var(--ink-2)" }}
                              >
                                <span
                                  style={{
                                    marginTop: 8,
                                    width: 6,
                                    height: 6,
                                    flexShrink: 0,
                                    borderRadius: 99,
                                    background: "var(--accent)",
                                  }}
                                />
                                {pick}
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

        <SectionDivider />

        {/* ════════════════ CONTACT ════════════════ */}
        <section
          id="contact"
          className="scroll-mt-24"
          style={{ paddingTop: "clamp(5rem, 10vw, 8rem)", paddingBottom: "clamp(5rem, 10vw, 8rem)" }}
        >
          <div className="section-container">
            <ScrollReveal>
              <div
                style={{
                  background: "var(--bg-2)",
                  borderRadius: 24,
                  padding: "clamp(2rem, 6vw, 4rem)",
                }}
              >
                <p className="section-label">{`// 05 · ${data.contact.title.toLowerCase()}`}</p>
                <h2
                  className="section-title mt-3"
                  style={{ maxWidth: "900px", textWrap: "balance" }}
                >
                  {data.contact.description}
                </h2>

                <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
                  <a href={`mailto:${data.contact.email}`} className="btn-primary">
                    <Mail size={14} />
                    <span>Email me — {data.contact.email}</span>
                  </a>
                  <Link href="#top" className="btn-secondary">
                    <span>Back to top</span>
                  </Link>
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

function SectionDivider() {
  return (
    <div className="section-container">
      <div className="section-divider" />
    </div>
  );
}
