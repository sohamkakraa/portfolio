import Image from "next/image";
import Link from "next/link";
import FilmOverlay from "@/lib/lab/FilmOverlay";
import { HUB_JOURNEYS } from "@/lib/lab/lab-content";
import { LabBack } from "@/lib/lab/ui";

export default function AscentHub() {
  const major = HUB_JOURNEYS.slice(0, 3);
  const minor = HUB_JOURNEYS.slice(3);

  return (
    <div className="lab lab-hub">
      <div className="lab-hub-glow" aria-hidden />
      <FilmOverlay vignette={0.5} grain={0.05} />
      <LabBack />

      <div className="lab-wrap">
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: "var(--l-2)",
            flexWrap: "wrap",
          }}
        >
          <div className="lab-eyebrow">SPINE C · EFFORT IS THE AXIS</div>
          <div className="lab-italic" style={{ fontSize: "0.9375rem" }}>
            Photographs, and the paths that led to them.
          </div>
        </header>

        <div style={{ margin: "var(--l-7) 0 var(--l-6)", maxWidth: "42rem" }}>
          <h1 className="lab-display lab-h2">Seven ways of looking.</h1>
          <p className="lab-body" style={{ marginTop: "var(--l-3)", maxWidth: "44ch" }}>
            Each series is walked through, not just viewed. The work lives here too — a build is a
            journey with a summit like any other. Scroll into a path below.
          </p>
        </div>

        <div className="lab-hub-grid">
          {major.map((j) => (
            <Link
              key={j.id}
              href={j.live ? "/lab/ascent/climb" : "/lab/ascent"}
              className={`lab-card ${j.live ? "" : "lab-card--soon"}`}
            >
              <Image src={j.cover} alt={j.title} fill sizes="(max-width: 900px) 50vw, 360px" />
              <span className="lab-card-scrim" />
              <span className="lab-card-body">
                {/* Brighter than an eyebrow's usual --l-ink-3, because this one sits on a
                    photograph rather than a page. The card body pins the cream tokens. */}
                <span className="lab-eyebrow" style={{ display: "block", color: "var(--l-ink-2)" }}>
                  {j.label}
                </span>
                <span
                  className="lab-display"
                  style={{ display: "block", fontSize: "1.625rem", margin: "6px 0 6px" }}
                >
                  {j.title}
                </span>
                <span className="lab-small" style={{ display: "block", fontSize: "0.8125rem" }}>
                  {j.blurb}
                </span>
                <span className="lab-eyebrow lab-card-enter" style={{ display: "block", marginTop: "var(--l-2)" }}>
                  {j.live ? `enter · ${j.count} frames →` : `${j.count} frames · not built yet`}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="lab-divider">
          <span className="lab-eyebrow">more journeys — in progress</span>
          <span />
        </div>

        <div className="lab-hub-grid--minor">
          {minor.map((j) => (
            <div key={j.id} className="lab-card lab-card--square lab-card--soon">
              <Image src={j.cover} alt={j.title} fill sizes="(max-width: 900px) 50vw, 260px" />
              <span className="lab-card-scrim" />
              <span className="lab-card-body" style={{ inset: "auto var(--l-2) var(--l-2) var(--l-2)" }}>
                <span
                  className="lab-display"
                  style={{ display: "block", fontSize: "1.0625rem", marginBottom: 4 }}
                >
                  {j.title}
                </span>
                <span className="lab-small" style={{ display: "block", fontSize: "0.75rem" }}>
                  {j.blurb}
                </span>
              </span>
            </div>
          ))}
        </div>

        <p
          className="lab-italic"
          style={{ textAlign: "center", marginTop: "var(--l-7)", fontSize: "0.875rem" }}
        >
          — only The Climb is built; the rest are covers over real folders —
        </p>

        <div className="lab-exits">
          <Link href="/lab/day" className="lab-exit">
            ← one day
          </Link>
          <Link href="/lab" className="lab-exit">
            all spines
          </Link>
        </div>
      </div>
    </div>
  );
}
