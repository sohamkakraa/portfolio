"use client";

import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import Card from "@/components/Card";
import { useSectionReveal } from "@/hooks/useSectionReveal";
import { featuredCards, lifeCards } from "@/data/home";

export default function HomePage() {
  const { visible, featuredRef, miniGridRef } = useSectionReveal();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <main className="mx-auto max-w-5xl px-6">
        {/* HERO */}
        <section
          data-cosmic="hero"
          data-tintl="rgba(107,122,111,0.08)"
          data-tintd="rgba(99,102,241,0.12)"
          className="min-h-screen pb-10 pt-14 sm:pt-20"
        >
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-widest text-[color:var(--muted)]">
              Personal portfolio · living notebook
            </p>

            <h1 className="mt-6 text-4xl font-medium leading-tight tracking-tight text-[color:var(--foreground)] sm:text-5xl">
              I build things, observe quietly, and try to understand how
              systems—and people—work.
            </h1>

            <p className="mt-5 text-base leading-relaxed text-[color:var(--muted)]">
              This space is part case studies, part photo journal, part thoughts
              I’m still shaping. It’s not a “finished” story—just an honest one.
            </p>

            <p className="mt-4 text-sm text-[color:var(--muted)]">
              Currently curious about{" "}
              <span className="text-[color:var(--foreground)]">
                uncertainty, technology, trekking, and the night sky
              </span>
              .
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/work"
                className="rounded-full border border-[color:var(--accent)] px-5 py-2 text-sm font-medium text-[color:var(--accent)] transition hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)]"
              >
                Explore my work
              </Link>
              <Link
                href="/about#notes"
                className="rounded-full border border-[color:var(--accent)] px-5 py-2 text-sm font-medium text-[color:var(--accent)] transition hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)]"
              >
                Read my notes
              </Link>
            </div>
          </div>

          {/* subtle “creative” divider */}
          <div className="pointer-events-none relative mt-14">
            <div
              className="absolute left-0 top-0 h-px w-full opacity-30"
              style={{ backgroundColor: "var(--muted)" }}
            />
          </div>
        </section>

        {/* FEATURED STRIP */}
        <section
          data-cosmic="featured"
          data-tintl="rgba(99,102,241,0.06)"
          data-tintd="rgba(56,189,248,0.10)"
          ref={(n) => {
            featuredRef.current = n;
          }}
          className={`min-h-screen mt-10 grid gap-12 pb-6 sm:mt-14 transition-all duration-700 ease-out will-change-transform ${
            visible.featured ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <div className="grid gap-6">
            <SectionTitle eyebrow="Featured" title="A few things worth exploring" />

            <div className="grid gap-4">
              {featuredCards.map((card) => (
                <Card key={card.title} {...card} />
              ))}
            </div>
          </div>

          {/* MINI GRID: PERSONAL DIMENSIONS */}
          <div
            data-cosmic="life"
            data-tintl="rgba(56,189,248,0.05)"
            data-tintd="rgba(251,191,36,0.08)"
            ref={(n) => {
              miniGridRef.current = n;
            }}
            className={`grid gap-6 sm:grid-cols-2 transition-all duration-700 ease-out will-change-transform ${
              visible.miniGrid ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            }`}
          >
            {lifeCards.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
