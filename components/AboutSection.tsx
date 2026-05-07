"use client";

import Image from "next/image";
import type { AboutSection as AboutData, SiteSettings } from "@/lib/portfolio-types";

type Props = {
  about: AboutData;
  site: SiteSettings;
};

export default function AboutSection({ about, site }: Props) {
  const meta: [string, string][] = [
    ["Based in", site.location],
    ["Studying", "M.Sc. DS&AI · TU/e"],
    ["Available", "Summer 2026"],
    ["Reach", site.email],
  ];

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
                {"// portrait"}
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
                2026 / 35mm
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
                {meta.map(([k, v]) => (
                  <tr key={k}>
                    <td
                      style={{
                        color: "var(--ink-3)",
                        padding: "10px 0",
                        borderBottom: "1px dotted var(--line-2)",
                      }}
                    >
                      {k}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "10px 0",
                        borderBottom: "1px dotted var(--line-2)",
                        color: "var(--ink)",
                      }}
                    >
                      {v}
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
              I build systems
              <br />
              where data, models,
              <br />
              and{" "}
              <em style={{ color: "var(--accent)", fontStyle: "italic" }}>people</em> meet.
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
              {[
                ["End-to-end", "From data ingestion and model design to product UI and deployment."],
                ["Readable", "Turning complex model behavior into interfaces people can trust."],
                ["Real-time", "Building systems that react quickly and stay reliable under live conditions."],
              ].map(([t, d], i) => (
                <div key={t}>
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em" }}
                  >
                    0{i + 1}
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
                    {t}
                  </h3>
                  <p
                    style={{
                      marginTop: 10,
                      fontSize: 13,
                      lineHeight: 1.55,
                      color: "var(--ink-2)",
                    }}
                  >
                    {d}
                  </p>
                </div>
              ))}
            </div>

            {/* CV strip */}
            <div style={{ marginTop: 48 }}>
              <div className="label" style={{ marginBottom: 12 }}>
                {"// log"}
              </div>
              {[
                ["2025–", "TU/e", "M.Sc. Data Science & AI"],
                ["2023–24", "Etihad Credit Insurance", "Data Analyst & IT Support"],
                ["2020–23", "Heriot-Watt Dubai", "B.Sc. Computer Science"],
              ].map(([y, p, r]) => (
                <div
                  key={y}
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
                  <span style={{ color: "var(--accent)" }}>{y}</span>
                  <span style={{ color: "var(--ink)" }}>{p}</span>
                  <span style={{ color: "var(--ink-2)" }}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
