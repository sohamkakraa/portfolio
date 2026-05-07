"use client";

import { useEffect, useState } from "react";
import type { PortfolioData } from "@/lib/portfolio-types";
import { loadPortfolioData, mergePortfolioData } from "@/lib/portfolio-storage";
import Nav from "@/components/Nav";
import HeroEditorial from "@/components/HeroEditorial";
import AboutSection from "@/components/AboutSection";
import ProjectsHoverExpand from "@/components/ProjectsHoverExpand";
import PhotographyGlobe from "@/components/PhotographyGlobe";
import LifeSection from "@/components/LifeSection";
import ContactFooter from "@/components/ContactFooter";
import LoadingScreen from "@/components/LoadingScreen";

type PortfolioPageProps = {
  initialData: PortfolioData;
};

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

      <main id="top">
        <HeroEditorial hero={data.hero} site={data.site} />
        <AboutSection about={data.about} site={data.site} />

        {/* PROJECTS */}
        <section
          id="projects"
          style={{
            padding: "120px 0",
            borderTop: "1px solid var(--line)",
            background: "var(--bg-2)",
          }}
        >
          <div className="container">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginBottom: 56,
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              <div>
                <div className="label">{"// 02 · selected work"}</div>
                <h2
                  className="serif"
                  style={{
                    marginTop: 12,
                    fontSize: "clamp(40px, 5.5vw, 72px)",
                    fontWeight: 300,
                    lineHeight: 1,
                    letterSpacing: "-0.03em",
                    color: "var(--ink)",
                  }}
                >
                  Six artifacts,{" "}
                  <em style={{ color: "var(--accent)", fontStyle: "italic" }}>
                    each its own world
                  </em>
                  .
                </h2>
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.15em" }}
              >
                hover to expand
              </div>
            </div>
            <ProjectsHoverExpand items={data.projects.items} />
          </div>
        </section>

        <PhotographyGlobe section={data.photography} />

        <LifeSection life={data.life} />

        <ContactFooter
          contact={data.contact}
          footer={data.footer}
          socials={data.site.socials}
        />
      </main>
    </div>
  );
}
