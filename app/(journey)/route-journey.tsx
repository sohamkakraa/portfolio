"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import FilmOverlay from "@/lib/journey/FilmOverlay";
import { measureTier, useDeviceTier, type TierReport } from "@/lib/journey/device-tier";
import { ROUTE_CHAPTERS, ROUTE_ORIGIN } from "@/lib/journey/content";
import { useJourneyScene } from "@/lib/journey/scene";
import { Blanks, JourneyExits, LabImage, Reveal, TierBadge, useActiveByProgress, useScrollDriver } from "@/lib/journey/ui";
import { buildRouteScene, liteRouteBackground } from "./route-scene";

const DECIDED_LABEL: Record<string, string> = {
  family: "decided for me",
  mixed: "half mine",
  me: "mine",
};

/**
 * Inverse of the scroll-progress calculation, so a mark lands on screen at its own `t`.
 * Sitting slightly above centre keeps tall panels clear of the fixed HUD band without
 * changing the scroll position at which a chapter arrives.
 */
const markTop = (t: number) => `calc(${t} * (100% - 100vh) + 46vh)`;

export default function RouteSpine() {
  const detected = useDeviceTier();
  const [override, setOverride] = useState<TierReport | null>(null);
  const report = override ?? detected;
  const tier = report.tier;

  const liteBgRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const kmRef = useRef<HTMLDivElement>(null);
  const active = useActiveByProgress(ROUTE_CHAPTERS.map((c) => c.t));

  const degrade = useCallback(() => {
    setOverride({ tier: "lite", reasons: ["framerate dropped below 28fps"], measured: true });
  }, []);

  const { canvasRef } = useJourneyScene({
    enabled: report.measured && tier === "full",
    build: buildRouteScene,
    onDegrade: degrade,
  });

  useScrollDriver((progress) => {
    if (markerRef.current) markerRef.current.style.left = `${progress * 100}%`;
    if (kmRef.current) {
      // The readout hands itself over at the same point the camera does.
      kmRef.current.textContent =
        progress > 0.9
          ? "you have the camera"
          : `${Math.round(progress * 11400).toLocaleString()} km, roughly`;
    }
    if (tier === "lite" && liteBgRef.current) {
      liteBgRef.current.style.background = liteRouteBackground(progress);
    }
  });

  const toggle = () =>
    setOverride(
      tier === "full"
        ? { tier: "lite", reasons: ["forced by you"], measured: true }
        : { ...measureTier(), tier: "full", reasons: ["forced by you"] }
    );

  const chapter = ROUTE_CHAPTERS[active];

  return (
    // The chapter positions are published as data so the collector can tell how far down the road
    // a visitor got without this component knowing that measurement exists.
    <div
      className="lab lab--pale-in-light"
      data-chapters={ROUTE_CHAPTERS.map((c) => `${c.t}:${c.id}`).join(",")}
    >
      {tier === "full" ? (
        <canvas ref={canvasRef} className="lab-canvas" />
      ) : (
        <div ref={liteBgRef} className="lab-lite-bg" style={{ background: liteRouteBackground(0) }} />
      )}
      <div className="lab-text-scrim" aria-hidden />
      <div className="lab-instrument-bed" aria-hidden />
      <FilmOverlay vignette={0.45} />
      <JourneyExits />

      <div className="lab-hud lab-hud--bottom-left lab-hud--floor">
        <div className="lab-eyebrow">{chapter.kind === "detour" ? "detour" : "now entering"}</div>
        <div className="lab-italic" style={{ fontSize: "1.5rem", color: "var(--l-ink)" }}>
          {chapter.region}
        </div>
        <div className="lab-eyebrow" style={{ marginTop: 2 }}>
          {DECIDED_LABEL[chapter.decidedBy]}
        </div>
      </div>

      {/* Kept low and right so it never collides with the alternating panels. */}
      <div className="lab-hud lab-hud--secondary">
        <div className="lab-eyebrow">
          <Blanks text={chapter.years} />
        </div>
        <div ref={kmRef} className="lab-mono" style={{ fontSize: "0.9375rem" }}>
          0 km, roughly
        </div>
      </div>

      <div className="lab-route-rail">
        <div ref={markerRef} className="lab-route-marker" style={{ left: "0%" }} />
        {ROUTE_CHAPTERS.map((c) => (
          <div key={c.id} className="lab-route-stop" style={{ left: `${c.t * 100}%` }}>
            <span className={`lab-route-dot ${c.kind === "detour" ? "lab-route-dot--detour" : ""}`} />
            <span className="lab-eyebrow">{c.short}</span>
          </div>
        ))}
      </div>

      <div className="lab-content">
        <div className="lab-track">
          <section className="lab-mark lab-mark--left lab-mark--hero" style={{ top: markTop(0) }}>
            <div className="lab-eyebrow lab-eyebrow--accent">Soham Kakra</div>
            <h1
              className="lab-display lab-h2"
              style={{ marginTop: "var(--l-3)", maxWidth: "19ch" }}
            >
              Did you get to choose where you grew up?
            </h1>
            <p className="lab-body" style={{ marginTop: "var(--l-4)" }}>
              I didn&apos;t, and for a long time it did not occur to me to mind. Six places sit on
              this road: three I lived in and chose none of, three I went to and came back from.
              Nearly every photograph here was made on the second kind — I bought the camera for
              the first trip I took without my parents, and every trip since has had fewer people
              in it.
            </p>
            <p className="lab-body" style={{ marginTop: "var(--l-3)" }}>
              Walk it if you have a few minutes; it is the long way round and the honest one. If
              you came to find out whether I can do a job, that door is here too and I will not be
              offended.
            </p>
            <div className="lab-exits lab-exits--start">
              <span className="lab-exit lab-exit--quiet">scroll to keep walking ↓</span>
              <Link href="/work" className="lab-exit">
                straight to what I do →
              </Link>
              <Link href="/blog/day-1" className="lab-exit">
                read There Has to Be a DAY 1 →
              </Link>
            </div>
            {/* The road is walked in the order the map puts it, which is not the order the
                calendar does — Kenya comes late here but came first with a camera. */}
            <p className="lab-italic" style={{ marginTop: "var(--l-4)", fontSize: "0.9375rem" }}>
              {ROUTE_ORIGIN.line} Walked west to east, not first to last; the years are on every
              stop.
            </p>
          </section>

          {ROUTE_CHAPTERS.map((c, i) => (
            <section
              key={c.id}
              id={c.id}
              className={`lab-mark ${i % 2 === 0 ? "lab-mark--left" : "lab-mark--right"}`}
              style={{ top: markTop(c.t) }}
            >
              <Reveal>
                {/* The snow chapter renders against a near-white scene, where a dark panel's
                    dimmer tokens — eyebrow, frame count — stop being readable. Same fix the
                    Climb summit uses: repoint the ink rather than patch each rule. */}
                <div className={`lab-panel${c.mood === "snow" ? " lab-panel--light" : ""}`}>
                  <div className="lab-eyebrow lab-eyebrow--accent">
                    <Blanks text={c.eyebrow} />
                  </div>
                  <h3
                    className="lab-display lab-h3"
                    style={{ marginTop: "var(--l-2)", marginBottom: "var(--l-2)" }}
                  >
                    {c.title}
                  </h3>
                  <p className="lab-small">
                    <Blanks text={c.caption} />
                  </p>

                  {/* The progression that turned out to matter more than the geography: what
                      each place was the first of. */}
                  {c.firstOf ? (
                    <p
                      className="lab-italic"
                      style={{ marginTop: "var(--l-2)", fontSize: "0.9375rem" }}
                    >
                      {c.firstOf}
                    </p>
                  ) : null}

                  {c.work.length > 0 ? (
                    <div
                      style={{
                        marginTop: "var(--l-3)",
                        paddingTop: "var(--l-3)",
                        borderTop: "1px solid var(--l-line)",
                      }}
                    >
                      <div className="lab-eyebrow">
                        happened here
                      </div>
                      {/* One line each. Four descriptions stacked pushed this panel past the
                          viewport and cost it its own heading, so the route keeps the fact
                          that it happened and hands the substance to the work page. */}
                      {c.work.map((w) => (
                        <p key={w.id} className="lab-small" style={{ marginTop: "var(--l-1)" }}>
                          <Link href={`/work#${w.id}`} className="lab-role-link">
                            <Blanks text={w.line} />
                          </Link>
                        </p>
                      ))}
                      <Link
                        href="/work"
                        className="lab-exit"
                        style={{ marginTop: "var(--l-2)", display: "inline-block" }}
                      >
                        the whole of it →
                      </Link>
                    </div>
                  ) : null}

                  {c.frames.length > 0 ? (
                    <>
                      {/* Two frames only. The panel is a way in, not the gallery — the full
                          series is walked through in its own journey. Keeping it to a pair
                          also stops a tall panel from reaching the fixed HUD. */}
                      <div
                        style={{
                          marginTop: "var(--l-3)",
                          display: "grid",
                          gap: "var(--l-1)",
                          gridTemplateColumns: "1fr 1fr",
                        }}
                      >
                        {c.frames.slice(0, 2).map((f, fi) => (
                          <LabImage
                            key={f.src}
                            src={f.src}
                            alt={f.caption}
                            priority={i === 0 && fi === 0}
                          />
                        ))}
                      </div>
                      <div className="lab-eyebrow" style={{ marginTop: "var(--l-2)" }}>
                        {c.frames.length} frames · <Blanks text={c.frames[0].place} />
                      </div>
                      {c.gap ? (
                        <p className="lab-small" style={{ marginTop: "var(--l-2)" }}>
                          <Blanks text={c.gap} />
                        </p>
                      ) : null}
                      {c.journey ? (
                        <Link
                          href={c.journey.href}
                          className="lab-exit"
                          style={{ marginTop: "var(--l-3)", display: "inline-block" }}
                        >
                          {c.journey.label} →
                        </Link>
                      ) : null}
                    </>
                  ) : (
                    <div className="lab-absence" style={{ marginTop: "var(--l-3)" }}>
                      <span className="lab-eyebrow">no photographs from here</span>
                    </div>
                  )}
                </div>
              </Reveal>
            </section>
          ))}

          <section className="lab-mark lab-mark--center" style={{ top: markTop(1) }}>
            <p className="lab-italic" style={{ fontSize: "1.25rem" }}>
              The road continues past the last frame.
            </p>
            <div className="lab-exits">
              <Link href="/journeys" className="lab-exit">
                walk one properly →
              </Link>
              <Link href="/work" className="lab-exit">
                what I do →
              </Link>
              <Link href="/blog/day-1" className="lab-exit">
                my first blog →
              </Link>
            </div>
          </section>
        </div>
      </div>

      <TierBadge report={report} onToggle={toggle} />
    </div>
  );
}
