"use client";

import Link from "next/link";
import type { ProjectItem } from "@/lib/portfolio-types";

type Props = {
  items: ProjectItem[];
};

export default function ProjectsHoverExpand({ items }: Props) {
  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(min(360px, 100%), 1fr))",
        gridAutoRows: "1fr",
      }}
    >
      {items.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

function ProjectCard({ project: p }: { project: ProjectItem }) {
  const Wrapper: React.ElementType = p.link ? Link : "article";
  const wrapperProps: Record<string, unknown> = p.link
    ? { href: p.link, target: p.link.startsWith("http") ? "_blank" : undefined, rel: "noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="project-card-collapsed group relative overflow-hidden"
      style={{ minHeight: 0 }}
      aria-label={p.title}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <ArtifactGlyph id={p.id} size={56} className="project-card-glyph" />
        <div className="text-right" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
          <div className="mono-label" style={{ color: "var(--ink-3)" }}>{p.year}</div>
          {p.status && (
            <div className="mono-label mt-1" style={{ color: "var(--ink-3)" }}>
              <span style={{ color: "var(--accent)", marginRight: 6 }}>●</span>
              {p.status}
            </div>
          )}
        </div>
      </div>

      {/* Title + summary */}
      <h3 className="display-md font-display mt-6" style={{ color: "var(--ink)" }}>
        {p.title}
      </h3>
      <p
        className="body mt-3 line-clamp-2"
        style={{ color: "var(--ink-2)" }}
      >
        {p.summary}
      </p>

      {/* Tags */}
      {p.tags?.length ? (
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
          {p.tags.map((t, i) => (
            <span key={t} className="mono-label" style={{ color: "var(--ink-3)" }}>
              {t}
              {i < p.tags.length - 1 && <span style={{ margin: "0 6px" }}>·</span>}
            </span>
          ))}
        </div>
      ) : null}

      {/* Expanded reveal */}
      <div className="project-reveal">
        {p.storyline?.length ? (
          <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
            {p.storyline.map((step, i) => (
              <div key={i} className="py-3" style={{ borderTop: i ? "1px solid var(--line)" : "none" }}>
                <div className="mono-label" style={{ color: "var(--accent)" }}>
                  {String(i + 1).padStart(2, "0")} · {step.label}
                </div>
                <p className="body mt-1.5" style={{ color: "var(--ink-2)" }}>{step.body}</p>
              </div>
            ))}
          </div>
        ) : null}

        {p.metrics?.length ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
            {p.metrics.map((m) => (
              <div key={m.label}>
                <dt className="mono-label" style={{ color: "var(--ink-3)" }}>{m.label}</dt>
                <dd className="display-md font-display mt-1" style={{ color: "var(--ink)" }}>{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {p.stack?.length ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
            {p.stack.map((s, i) => (
              <span key={s} className="mono-label" style={{ color: "var(--ink-2)" }}>
                {s}
                {i < (p.stack?.length ?? 0) - 1 && <span style={{ margin: "0 6px", color: "var(--ink-3)" }}>·</span>}
              </span>
            ))}
          </div>
        ) : null}

        {p.link && (
          <div className="mt-5 flex justify-end">
            <span className="mono-label" style={{ color: "var(--accent)" }}>
              Open page →
            </span>
          </div>
        )}
      </div>

    </Wrapper>
  );
}

// Custom artifact glyphs per project — matches the handoff list.
function ArtifactGlyph({
  id,
  size = 56,
  className,
}: {
  id: string;
  size?: number;
  className?: string;
}) {
  const stroke = "currentColor";
  const sw = 1.2;
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 64 64",
    fill: "none",
    className,
    "aria-hidden": true,
  } as const;

  if (id === "uma") {
    // stacked timeline rows merging into one
    return (
      <svg {...common}>
        <path d="M 8 18 H 28" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M 8 28 H 32" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M 8 38 H 30" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M 8 48 H 26" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
        <path d="M 28 18 Q 44 18 44 32 Q 44 46 26 48" stroke={stroke} strokeWidth={sw} fill="none" />
        <path d="M 32 28 Q 44 28 44 32" stroke={stroke} strokeWidth={sw} fill="none" />
        <path d="M 30 38 Q 44 38 44 32" stroke={stroke} strokeWidth={sw} fill="none" />
        <circle cx="48" cy="32" r="2.4" fill={stroke} />
        <path d="M 50 32 H 58" stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
      </svg>
    );
  }
  if (id === "tabscape") {
    // forecast band fanning from a center axis
    return (
      <svg {...common}>
        <line x1="32" y1="6" x2="32" y2="58" stroke={stroke} strokeWidth="0.6" opacity="0.4" />
        <path d="M 32 32 Q 42 28 52 22" stroke={stroke} strokeWidth={sw} fill="none" />
        <path d="M 32 32 Q 42 32 52 30" stroke={stroke} strokeWidth="0.8" strokeDasharray="2 3" fill="none" opacity="0.5" />
        <path d="M 32 32 Q 42 36 52 42" stroke={stroke} strokeWidth={sw} fill="none" />
        <path d="M 32 32 L 18 18" stroke={stroke} strokeWidth={sw} fill="none" />
        <path d="M 32 32 L 14 32" stroke={stroke} strokeWidth="0.8" opacity="0.5" />
        <path d="M 32 32 L 18 46" stroke={stroke} strokeWidth={sw} fill="none" />
      </svg>
    );
  }
  if (id === "robotrader") {
    // bar/ticker grid with one bar pulsing
    return (
      <svg {...common}>
        {Array.from({ length: 12 }).map((_, i) => {
          const x = 8 + i * 4;
          const h = 8 + ((i * 7) % 30);
          const accent = i === 5;
          return (
            <rect
              key={i}
              x={x}
              y={32 - h / 2}
              width="2.5"
              height={h}
              fill={accent ? "var(--accent)" : stroke}
              opacity={accent ? 1 : 0.7}
            />
          );
        })}
        <line x1="6" y1="50" x2="58" y2="50" stroke={stroke} strokeWidth="0.6" opacity="0.4" />
      </svg>
    );
  }
  if (id === "viveka") {
    // open-book / page glyph
    return (
      <svg {...common}>
        <path
          d="M 10 16 Q 22 12 32 16 Q 42 12 54 16 V 50 Q 42 46 32 50 Q 22 46 10 50 Z"
          stroke={stroke}
          strokeWidth={sw}
          fill="none"
        />
        <line x1="32" y1="16" x2="32" y2="50" stroke={stroke} strokeWidth="0.8" opacity="0.5" />
        <line x1="14" y1="22" x2="28" y2="20" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        <line x1="14" y1="28" x2="28" y2="26" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        <line x1="14" y1="34" x2="28" y2="32" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        <line x1="36" y1="20" x2="50" y2="22" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
        <line x1="36" y1="26" x2="50" y2="28" stroke={stroke} strokeWidth="0.6" opacity="0.5" />
      </svg>
    );
  }
  if (id === "diagnostic") {
    // small decision tree
    return (
      <svg {...common}>
        <circle cx="32" cy="14" r="3" fill={stroke} />
        <line x1="32" y1="17" x2="18" y2="30" stroke={stroke} strokeWidth={sw} />
        <line x1="32" y1="17" x2="46" y2="30" stroke={stroke} strokeWidth={sw} />
        <circle cx="18" cy="32" r="2.4" fill={stroke} opacity="0.7" />
        <circle cx="46" cy="32" r="2.4" fill={stroke} opacity="0.7" />
        <line x1="18" y1="35" x2="10" y2="48" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
        <line x1="18" y1="35" x2="26" y2="48" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
        <line x1="46" y1="35" x2="38" y2="48" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
        <line x1="46" y1="35" x2="54" y2="48" stroke={stroke} strokeWidth="0.8" opacity="0.6" />
        {[10, 26, 38, 54].map((x, i) => (
          <circle key={x} cx={x} cy="50" r={i === 3 ? 2.4 : 1.8} fill={i === 3 ? "var(--accent)" : stroke} opacity={i === 3 ? 1 : 0.6} />
        ))}
      </svg>
    );
  }
  // calmops — 3x3 dots with one accent
  return (
    <svg {...common}>
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => {
          const x = 18 + col * 14;
          const y = 18 + row * 14;
          const isAccent = row === 1 && col === 1;
          return (
            <circle
              key={`${row}-${col}`}
              cx={x}
              cy={y}
              r={isAccent ? 3.5 : 2.4}
              fill={isAccent ? "var(--accent)" : stroke}
              opacity={isAccent ? 1 : 0.6}
            />
          );
        })
      )}
      <line x1="14" y1="50" x2="50" y2="50" stroke={stroke} strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}
