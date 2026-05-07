"use client";

import type { HeroContent, SiteSettings } from "@/lib/portfolio-types";

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

export default function HeroEditorial(_props: Props) {
  void _props;
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
          <span className="label">Issue №07 · Eindhoven</span>
          <span className="label">May 2026 / now reading</span>
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
          Building data
          <br />
          and AI products
          <br />
          that{" "}
          <em
            style={{ fontStyle: "italic", fontWeight: 400, color: "var(--accent)" }}
          >
            feel human
          </em>
          .
        </h1>

        <div
          style={{
            marginTop: 80,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.4fr)",
            gap: 64,
            alignItems: "end",
          }}
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
              Soham Kakra. M.Sc. Data Science &amp; AI at TU/e. Engineer of end-to-end systems —
              model logic to production UX.
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
            >
              {[
                ["01", "About", "p.02", "#about"],
                ["02", "Selected work", "p.04", "#projects"],
                ["03", "Photography", "p.08", "#photography"],
                ["04", "Field notes", "p.12", "#life"],
              ].map(([n, t, p, href]) => (
                <a
                  key={n}
                  href={href}
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
                      {n}
                    </span>
                    &nbsp;&nbsp;{t}
                  </span>
                  <span className="mono" style={{ color: "var(--ink-3)" }}>
                    {p}
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
