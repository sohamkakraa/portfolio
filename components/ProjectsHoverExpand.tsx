"use client";

import { useState } from "react";
import type { ProjectItem } from "@/lib/portfolio-types";

type Props = {
  items: ProjectItem[];
};

// Discipline / palette / artifact kind by project id, matching the prototype.
const META: Record<
  string,
  { discipline: string; palette: [string, string, string]; artifact: string }
> = {
  uma:        { discipline: "Healthcare · AI",   palette: ["#3a4760", "#1c2740", "#5e7295"], artifact: "timeline" },
  tabscape:   { discipline: "Fintech · Forecasting", palette: ["#2a4a3a", "#0e2018", "#5a8a6e"], artifact: "forecast" },
  robotrader: { discipline: "AI/ML · Real-time", palette: ["#3a2a1a", "#150a04", "#a8753a"], artifact: "ticker" },
  viveka:     { discipline: "Writing · Editorial", palette: ["#3a3a4a", "#15151c", "#7a7aa0"], artifact: "page" },
  diagnostic: { discipline: "AI · Healthcare",   palette: ["#2a3a3a", "#0e1a1a", "#5a8a8a"], artifact: "tree" },
  calmops:    { discipline: "Dashboards · SRE",  palette: ["#2a2a3a", "#0e0e18", "#5a5a8a"], artifact: "status" },
};

export default function ProjectsHoverExpand({ items }: Props) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
        gap: 16,
        gridAutoRows: "440px",
        gridAutoFlow: "dense",
        alignItems: "stretch",
      }}
    >
      {items.map((p) => (
        <ArtifactCard key={p.id} p={p} isHover={hover === p.id} onHover={setHover} />
      ))}
    </div>
  );
}

function ArtifactCard({
  p,
  isHover,
  onHover,
}: {
  p: ProjectItem;
  isHover: boolean;
  onHover: (id: string | null) => void;
}) {
  const meta = META[p.id] ?? {
    discipline: p.tags?.[0] ?? "Project",
    palette: ["#2a2a3a", "#0e0e18", "#7a7aa0"] as [string, string, string],
    artifact: "status",
  };
  const hasSite = !!p.link;
  const hasRepo = !!p.repo;
  // If only one is set, the whole card becomes a link to it.
  // If both are set, render as <article> and surface two buttons in the reveal.
  const soleHref = hasSite && !hasRepo ? p.link : !hasSite && hasRepo ? p.repo : null;
  const Wrapper: React.ElementType = soleHref ? "a" : "article";
  const wrapperProps: Record<string, unknown> = soleHref
    ? { href: soleHref, target: soleHref.startsWith("http") ? "_blank" : undefined, rel: "noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      onMouseEnter={() => onHover(p.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(p.id)}
      onBlur={() => onHover(null)}
      style={{
        position: "relative",
        overflow: "hidden",
        border: "1px solid var(--line-2)",
        background: "var(--bg-2)",
        gridRow: isHover ? "span 2" : "span 1",
        transition: "grid-row 0.5s cubic-bezier(.7,0,.2,1), border-color 0.3s",
        textDecoration: "none",
        color: "inherit",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      aria-label={p.title}
    >
      {/* Artifact glyph header */}
      <div
        style={{
          position: "relative",
          height: isHover ? 180 : 220,
          flexShrink: 0,
          background: `linear-gradient(160deg, ${meta.palette[1]} 0%, ${meta.palette[0]} 100%)`,
          transition: "height 0.5s cubic-bezier(.7,0,.2,1)",
          overflow: "hidden",
        }}
      >
        <ArtifactGlyph kind={meta.artifact} palette={meta.palette} expanded={isHover} />
        <div
          className="mono"
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            fontSize: 10,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {meta.discipline}
        </div>
        <div
          className="mono"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 10,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.18em",
          }}
        >
          {p.year}
        </div>
      </div>

      {/* Title + pitch */}
      <div style={{ padding: "20px 24px 0", flexShrink: 0 }}>
        <h3
          className="serif"
          style={{
            fontSize: 28,
            fontWeight: 400,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            color: "var(--ink)",
          }}
        >
          {p.title}
        </h3>
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: "var(--ink-2)",
            lineHeight: 1.55,
            maxWidth: 480,
          }}
        >
          {p.summary}
        </p>
      </div>

      {/* Reveal */}
      <div
        style={{
          flex: isHover ? 1 : 0,
          opacity: isHover ? 1 : 0,
          overflow: "auto",
          transition: "opacity 0.35s 0.1s, flex 0.5s cubic-bezier(.7,0,.2,1)",
          padding: isHover ? "20px 24px 60px" : "0 24px",
          pointerEvents: isHover ? "auto" : "none",
        }}
      >
        {p.storyline?.length ? (
          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 16,
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            {p.storyline.map((s, i) => (
              <div key={i}>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "var(--accent)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </div>
                <p
                  style={{
                    marginTop: 6,
                    fontSize: 12,
                    color: "var(--ink-2)",
                    lineHeight: 1.5,
                  }}
                >
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {p.metrics?.length ? (
          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px dotted var(--line-2)",
              flexWrap: "wrap",
            }}
          >
            {p.metrics.map((m) => (
              <div key={m.label}>
                <div
                  className="serif"
                  style={{
                    fontSize: 22,
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--accent)",
                  }}
                >
                  {m.value}
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 9,
                    color: "var(--ink-3)",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {hasSite && hasRepo && (
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--line)",
              flexWrap: "wrap",
            }}
          >
            <a
              href={p.link}
              target={p.link!.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="mono"
              style={{
                padding: "8px 14px",
                background: "var(--ink)",
                color: "var(--bg)",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                textDecoration: "none",
                borderRadius: 4,
              }}
            >
              Open site →
            </a>
            <a
              href={p.repo}
              target={p.repo!.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="mono"
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "var(--ink)",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
                textDecoration: "none",
                borderRadius: 4,
                border: "1px solid var(--line-2)",
              }}
            >
              View repo ↗
            </a>
          </div>
        )}
      </div>

      {/* Footer chip — fades on hover */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--line)",
          background: "var(--bg-2)",
          opacity: isHover ? 0 : 1,
          transition: "opacity 0.3s",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-3)",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ color: "var(--accent)", marginRight: 8 }}>●</span>
          {p.status ?? "Live"}
        </div>
        <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)" }}>
          hover →
        </div>
      </div>
    </Wrapper>
  );
}

function ArtifactGlyph({
  kind,
  palette,
  expanded,
}: {
  kind: string;
  palette: [string, string, string];
  expanded: boolean;
}) {
  const c = palette[2];
  const common = { width: "100%", height: "100%", style: { display: "block" } } as const;
  if (kind === "timeline") {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...common}>
        <line x1="10" y1="50" x2="190" y2="50" stroke={c} strokeWidth="0.5" opacity="0.5" />
        {[20, 50, 80, 110, 140, 170].map((x, i) => (
          <g key={x}>
            <line x1={x} y1="40" x2={x} y2="60" stroke={c} strokeWidth="0.5" opacity="0.4" />
            <circle
              cx={x}
              cy="50"
              r={i === 2 ? 4 : 2.5}
              fill={i === 2 ? c : "rgba(255,255,255,0.7)"}
              opacity={i === 2 ? 1 : 0.7}
            />
          </g>
        ))}
        {expanded &&
          [20, 50, 80, 110, 140, 170].map((x, i) => (
            <rect key={i} x={x - 8} y={i % 2 ? 62 : 26} width="16" height="8" fill={c} opacity="0.3" />
          ))}
      </svg>
    );
  }
  if (kind === "forecast") {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...common}>
        <path d="M 0 70 Q 40 60 60 50 T 100 45 L 100 100 L 0 100 Z" fill={c} opacity="0.2" />
        <path d="M 0 70 Q 40 60 60 50 T 100 45" stroke={c} strokeWidth="1.5" fill="none" />
        <path
          d="M 100 45 Q 130 30 160 38 T 200 30"
          stroke={c}
          strokeWidth="1.5"
          strokeDasharray="3 3"
          fill="none"
        />
        <path
          d="M 100 30 Q 130 20 160 25 T 200 18 L 200 50 Q 160 55 130 45 T 100 60 Z"
          fill={c}
          opacity="0.15"
        />
        <line x1="100" y1="0" x2="100" y2="100" stroke="white" strokeWidth="0.4" opacity="0.3" />
      </svg>
    );
  }
  if (kind === "ticker") {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...common}>
        {Array.from({ length: 28 }).map((_, i) => {
          const x = 6 + i * 7;
          const h = 20 + ((i * 17) % 50);
          const up = (i + 3) % 3 !== 0;
          return (
            <rect
              key={i}
              x={x}
              y={50 - h / 2}
              width="4"
              height={h}
              fill={up ? c : "rgba(255,255,255,0.3)"}
              opacity={up ? 0.85 : 0.5}
            />
          );
        })}
      </svg>
    );
  }
  if (kind === "page") {
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...common}>
        <rect x="20" y="10" width="70" height="80" fill={c} opacity="0.25" />
        <text
          x="55"
          y="30"
          textAnchor="middle"
          fontFamily="var(--font-fraunces), serif"
          fontSize="28"
          fill="white"
          opacity="0.9"
        >
          A
        </text>
        {[40, 50, 60, 70].map((y) => (
          <rect key={y} x={28} y={y} width="50" height="2" fill="white" opacity="0.4" />
        ))}
        {[15, 25, 35, 45, 55, 65, 75].map((y) => (
          <rect key={y} x={105} y={y} width="80" height="1.5" fill="white" opacity="0.3" />
        ))}
      </svg>
    );
  }
  if (kind === "tree") {
    const nodes: [number, number][] = [
      [100, 15],
      [50, 45],
      [150, 45],
      [25, 75],
      [75, 75],
      [125, 75],
      [175, 75],
    ];
    return (
      <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...common}>
        {nodes.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === 0 ? 5 : 3}
            fill={i === 0 ? c : "rgba(255,255,255,0.6)"}
            opacity={i === 0 ? 1 : 0.7}
          />
        ))}
        <line x1="100" y1="15" x2="50" y2="45" stroke={c} strokeWidth="0.6" opacity="0.5" />
        <line x1="100" y1="15" x2="150" y2="45" stroke={c} strokeWidth="0.6" opacity="0.5" />
        <line x1="50" y1="45" x2="25" y2="75" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="50" y1="45" x2="75" y2="75" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="150" y1="45" x2="125" y2="75" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="150" y1="45" x2="175" y2="75" stroke={c} strokeWidth="0.8" opacity="0.8" />
      </svg>
    );
  }
  // status
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" {...common}>
      {Array.from({ length: 24 }).map((_, i) => {
        const x = 6 + i * 8;
        const status = (i + 1) % 7 === 0 ? "warn" : "ok";
        return (
          <rect
            key={i}
            x={x}
            y="40"
            width="6"
            height="20"
            rx="1"
            fill={status === "ok" ? c : "rgba(255,180,80,0.8)"}
            opacity={status === "ok" ? 0.7 : 1}
          />
        );
      })}
      <line x1="0" y1="78" x2="200" y2="78" stroke="white" strokeWidth="0.4" opacity="0.2" />
    </svg>
  );
}
