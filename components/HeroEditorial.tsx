"use client";

import type { HeroContent, SiteSettings } from "@/lib/portfolio-types";
import { renderEm } from "@/lib/render-em";

type Props = {
  hero: HeroContent;
  site: SiteSettings;
};

function GridBackdrop() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        backgroundImage:
          "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        maskImage: "radial-gradient(ellipse 80% 70% at center, black 40%, transparent 90%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 70% at center, black 40%, transparent 90%)",
      }}
    />
  );
}

const DEFAULT_HEADLINE: string[] = [
  "Building data",
  "and AI products",
  "that {{em}}feel human{{/em}}.",
];

const DEFAULT_TOC = [
  { num: "01", label: "About", page: "p.02", href: "#about" },
  { num: "02", label: "Selected work", page: "p.04", href: "#projects" },
  { num: "03", label: "Photography", page: "p.08", href: "#photography" },
  { num: "04", label: "Field notes", page: "p.12", href: "#life" },
];

export default function HeroEditorial({ hero, site }: Props) {
  const issueLabel = hero.issueLabel ?? `Issue №07 · ${site.location.split(",")[0]}`;
  const dateLabel = hero.dateLabel ?? "May 2026 / now reading";
  const headline = hero.headline?.length ? hero.headline : DEFAULT_HEADLINE;
  const masthead =
    hero.masthead ??
    `${site.name}. M.Sc. Data Science & AI at TU/e. Engineer of end-to-end systems — model logic to production UX.`;
  const toc = hero.tableOfContents?.length ? hero.tableOfContents : DEFAULT_TOC;

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        paddingTop: 96,
      }}
    >
      <GridBackdrop />
      <div
        className="container"
        style={{ position: "relative", zIndex: 1, paddingTop: 80, paddingBottom: 120 }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 80,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <span className="label">{issueLabel}</span>
          <span className="label">{dateLabel}</span>
        </div>

        <h1
          className="serif"
          style={{
            fontSize: "clamp(56px, 11vw, 180px)",
            fontWeight: 300,
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
            color: "var(--ink)",
            textWrap: "balance",
          }}
        >
          {headline.map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {renderEm(line)}
            </span>
          ))}
        </h1>

        <div
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
            gap: 64,
            alignItems: "end",
          }}
          className="hero-grid"
        >
          <div>
            <div className="label" style={{ marginBottom: 14 }}>
              The masthead
            </div>
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                maxWidth: 320,
              }}
            >
              {masthead}
            </p>
          </div>
          <div style={{ borderLeft: "1px solid var(--line)", paddingLeft: 32 }}>
            <div className="label" style={{ marginBottom: 14 }}>
              In this issue
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px 24px",
                fontSize: 14,
              }}
              className="hero-toc"
            >
              {toc.map((t) => (
                <a
                  key={`${t.num}-${t.label}`}
                  href={t.href}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderBottom: "1px dotted var(--line-2)",
                    paddingBottom: 8,
                    color: "var(--ink)",
                    textDecoration: "none",
                  }}
                >
                  <span>
                    <span className="mono" style={{ color: "var(--ink-3)" }}>
                      {t.num}
                    </span>
                    &nbsp;&nbsp;{t.label}
                  </span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>
                    {t.page}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
