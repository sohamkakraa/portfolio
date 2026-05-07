"use client";

import Image from "next/image";
import type { AboutSection as AboutData, SiteSettings } from "@/lib/portfolio-types";
import { renderEm } from "@/lib/render-em";

type Props = {
  about: AboutData;
  site: SiteSettings;
};

const DEFAULT_HEADLINE: string[] = [
  "I build systems",
  "where data, models,",
  "and {{em}}people{{/em}} meet.",
];

const DEFAULT_PILLARS = [
  { title: "End-to-end", body: "From data ingestion and model design to product UI and deployment." },
  { title: "Readable", body: "Turning complex model behavior into interfaces people can trust." },
  { title: "Real-time", body: "Building systems that react quickly and stay reliable under live conditions." },
];

const DEFAULT_LOG = [
  { year: "2025–", org: "TU/e", role: "M.Sc. Data Science & AI" },
  { year: "2023–24", org: "Etihad Credit Insurance", role: "Data Analyst & IT Support" },
  { year: "2020–23", org: "Heriot-Watt Dubai", role: "B.Sc. Computer Science" },
];

export default function AboutSection({ about, site }: Props) {
  const headline = about.headline?.length ? about.headline : DEFAULT_HEADLINE;
  const pillars = about.pillars?.length ? about.pillars : DEFAULT_PILLARS;
  const log = about.log?.length ? about.log : DEFAULT_LOG;
  const meta =
    about.meta?.length
      ? about.meta
      : [
          { label: "Based in", value: site.location },
          { label: "Studying", value: "M.Sc. DS&AI · TU/e" },
          { label: "Available", value: "Summer 2026" },
          { label: "Reach", value: site.email },
        ];
  const portraitLabel = about.portraitLabel ?? "// portrait";
  const portraitMeta = about.portraitMeta ?? "2026 / 35mm";

  return (
    <section
      id="about"
      style={{
        padding: "120px 0",
        borderTop: "1px solid var(--line)",
        background: "var(--bg-2)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(280px, 1fr) minmax(0, 1.6fr)",
            gap: 64,
          }}
          className="about-grid"
        >
          {/* Portrait + meta */}
          <div>
            <div
              style={{
                aspectRatio: "4/5",
                background:
                  "repeating-linear-gradient(45deg, var(--bg-3) 0 12px, var(--bg) 12px 24px)",
                border: "1px solid var(--line-2)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {about.portraitSrc && (
                <Image
                  src={about.portraitSrc}
                  alt={`${site.name} portrait`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
              )}
              <div
                className="mono"
                style={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  fontSize: 9,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.2em",
                  zIndex: 1,
                }}
              >
                {portraitLabel}
              </div>
              <div
                className="mono"
                style={{
                  position: "absolute",
                  bottom: 12,
                  right: 12,
                  fontSize: 9,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: "0.2em",
                  zIndex: 1,
                }}
              >
                {portraitMeta}
              </div>
            </div>
            <table
              className="mono"
              style={{
                marginTop: 24,
                width: "100%",
                fontSize: 12,
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                {meta.map((row) => (
                  <tr key={row.label}>
                    <td
                      style={{
                        color: "var(--ink-3)",
                        padding: "10px 0",
                        borderBottom: "1px dotted var(--line-2)",
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 0",
                        borderBottom: "1px dotted var(--line-2)",
                        color: "var(--ink)",
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Manifesto */}
          <div>
            <div className="label">{"// 01 · about"}</div>
            <h2
              className="serif"
              style={{
                marginTop: 12,
                fontSize: "clamp(40px, 5.5vw, 64px)",
                fontWeight: 300,
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                textWrap: "balance",
                color: "var(--ink)",
              }}
            >
              {headline.map((line, i) => (
                <span key={i} style={{ display: "block" }}>
                  {renderEm(line)}
                </span>
              ))}
            </h2>
            <p
              style={{
                marginTop: 28,
                fontSize: 17,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                maxWidth: 580,
              }}
            >
              {about.body}
            </p>

            <div
              style={{
                marginTop: 48,
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
                borderTop: "1px solid var(--line-2)",
                paddingTop: 32,
              }}
              className="about-pillars"
            >
              {pillars.map((p, i) => (
                <div key={p.title}>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3
                    className="serif"
                    style={{
                      marginTop: 8,
                      fontSize: 22,
                      fontWeight: 400,
                      letterSpacing: "-0.02em",
                      color: "var(--ink)",
                    }}
                  >
                    {p.title}
                  </h3>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "var(--ink-2)",
                    }}
                  >
                    {p.body}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 48 }}>
              <div className="label" style={{ marginBottom: 12 }}>
                {"// log"}
              </div>
              {log.map((l) => (
                <div
                  key={`${l.year}-${l.org}`}
                  className="mono"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "100px 1.2fr 2fr",
                    fontSize: 13,
                    padding: "12px 0",
                    borderBottom: "1px dotted var(--line-2)",
                    alignItems: "baseline",
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>{l.year}</span>
                  <span style={{ color: "var(--ink)" }}>{l.org}</span>
                  <span style={{ color: "var(--ink-2)" }}>{l.role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
