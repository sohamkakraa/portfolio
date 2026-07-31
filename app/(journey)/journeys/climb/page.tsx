"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import FilmOverlay from "@/lib/journey/FilmOverlay";
import { measureTier, useDeviceTier, type TierReport } from "@/lib/journey/device-tier";
import { CLIMB_STOPS } from "@/lib/journey/content";
import { useJourneyScene } from "@/lib/journey/scene";
import { Blanks, LabImage, Reveal, TierBadge, useActiveByProgress, useScrollDriver } from "@/lib/journey/ui";
import { buildClimbScene, liteClimbBackground } from "./climb-scene";

/** Same inverse-of-scroll-progress placement the route uses, so words meet their own terrain. */
const markTop = (t: number) => `calc(${t} * (100% - 100vh) + 46vh)`;

export default function ClimbJourney() {
  const detected = useDeviceTier();
  const [override, setOverride] = useState<TierReport | null>(null);
  const report = override ?? detected;
  const tier = report.tier;

  const markerRef = useRef<HTMLDivElement>(null);
  const liteBgRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const active = useActiveByProgress(CLIMB_STOPS.map((s) => s.t));

  const degrade = useCallback(() => {
    setOverride({ tier: "lite", reasons: ["framerate dropped below 28fps"], measured: true });
  }, []);

  const { canvasRef } = useJourneyScene({
    enabled: report.measured && tier === "full",
    build: buildClimbScene,
    onDegrade: degrade,
  });

  useScrollDriver((progress) => {
    if (markerRef.current) markerRef.current.style.top = `${(1 - progress) * 100}%`;
    if (tier === "lite" && liteBgRef.current) {
      liteBgRef.current.style.background = liteClimbBackground(progress);
    }
    // Above the snow line the scene turns to sunlit white, and cream HUD ink vanishes into
    // it. Toggling a class here rather than in state keeps this off the render path.
    rootRef.current?.classList.toggle("lab--on-snow", progress > 0.9);
  });

  const toggle = () =>
    setOverride(
      tier === "full"
        ? { tier: "lite", reasons: ["forced by you"], measured: true }
        : { ...measureTier(), tier: "full", reasons: ["forced by you"] }
    );

  const stop = CLIMB_STOPS[active];
  const totalFrames = CLIMB_STOPS.reduce((n, s) => n + s.frames.length, 0);

  return (
    <div className="lab" ref={rootRef}>
      {tier === "full" ? (
        <canvas ref={canvasRef} className="lab-canvas" />
      ) : (
        <div ref={liteBgRef} className="lab-lite-bg" style={{ background: liteClimbBackground(0) }} />
      )}
      <div className="lab-text-scrim" aria-hidden />
      <FilmOverlay vignette={0.42} />

      <Link href="/journeys" className="lab-back">
        ← all journeys
      </Link>

      <div className="lab-rail">
        <div ref={markerRef} className="lab-rail-marker" style={{ top: "100%" }} />
        {CLIMB_STOPS.map((s) => (
          <div key={s.id} className="lab-rail-tick" style={{ top: `${(1 - s.t) * 100}%` }} />
        ))}
      </div>
      <div className="lab-hud" style={{ right: "calc(var(--l-3) + 18px)", top: "calc(50% - 26vh)" }}>
        <div className="lab-eyebrow">the ridge</div>
      </div>
      <div className="lab-hud" style={{ right: "calc(var(--l-3) + 18px)", top: "calc(50% + 26vh)" }}>
        <div className="lab-eyebrow">valley</div>
      </div>

      {/* The instrument is the band, not a fabricated metre count. The number is a range
          and says so, because a composite climb cannot honestly claim an exact altitude. */}
      <div
        className="lab-hud"
        style={{
          right: "calc(var(--l-3) + 18px)",
          top: "50%",
          transform: "translateY(-50%)",
          textAlign: "right",
        }}
      >
        <div className="lab-eyebrow">{stop.band}</div>
        <div className="lab-mono" style={{ fontSize: "0.9375rem", letterSpacing: "0.06em" }}>
          {stop.approxAlt}
        </div>
      </div>

      <div className="lab-content">
        {/* Nine marks need more room than the route's six. */}
        <div className="lab-track" style={{ "--l-track-h": "1400vh" } as React.CSSProperties}>
          <section className="lab-mark lab-mark--left lab-mark--hero" style={{ top: markTop(0) }}>
            <div className="lab-eyebrow lab-eyebrow--accent">JOURNEY 01 · LANDSCAPE</div>
            <h1 className="lab-display lab-h2" style={{ marginTop: "var(--l-3)", maxWidth: "16ch" }}>
              The Climb
            </h1>
            <p className="lab-body" style={{ marginTop: "var(--l-4)" }}>
              This is not one trek. It is two Mays a year apart — Hampta Pass in 2022 with my
              brother and his friends, Sar Pass in 2023 on my own — plus the valleys around
              Manali and Tosh that both trips started from. Sorted into the bands they share,
              from the river at the bottom to the ridge where there is nothing left to walk up.
              {" "}{totalFrames} frames, in the order the ground puts them in rather than the
              order I took them.
            </p>
            <p className="lab-italic" style={{ marginTop: "var(--l-4)", fontSize: "0.9375rem" }}>
              Every altitude here is approximate and labelled as such. The photographs are exact.
            </p>
            <p className="lab-italic" style={{ marginTop: "var(--l-4)", fontSize: "0.9375rem" }}>
              scroll to begin the climb ↓
            </p>
          </section>

          {CLIMB_STOPS.map((s, i) => (
            <section
              key={s.id}
              className={`lab-mark ${i % 2 === 0 ? "lab-mark--left" : "lab-mark--right"}`}
              style={{ top: markTop(s.t) }}
            >
              <Reveal>
                {/* Light panels only where the scene is actually bright. The snowfield sits
                    in the blue hour now, so a white panel there fights its own sky. */}
                <div className={`lab-panel ${s.t > 0.9 ? "lab-panel--light" : ""}`}>
                  <div className="lab-eyebrow lab-eyebrow--accent">{s.eyebrow}</div>
                  <h3
                    className="lab-display lab-h3"
                    style={{ marginTop: "var(--l-2)", marginBottom: "var(--l-2)" }}
                  >
                    {s.title}
                  </h3>
                  <p className="lab-small">
                    <Blanks text={s.caption} />
                  </p>

                  {/* A lead frame, then the rest as a strip. The count is the honest signal
                      of how much of the archive this band actually holds. */}
                  <div style={{ marginTop: "var(--l-3)" }}>
                    <LabImage
                      src={s.frames[0].src}
                      alt={s.frames[0].caption}
                      priority={i === 0}
                    />
                  </div>
                  {s.frames.length > 1 ? (
                    <div
                      style={{
                        marginTop: "var(--l-1)",
                        display: "grid",
                        gap: "var(--l-1)",
                        gridTemplateColumns: `repeat(${Math.min(3, s.frames.length - 1)}, 1fr)`,
                      }}
                    >
                      {s.frames.slice(1, 4).map((f) => (
                        <LabImage
                          key={f.src}
                          src={f.src}
                          alt={f.caption}
                          className="lab-frame lab-frame--square"
                        />
                      ))}
                    </div>
                  ) : null}

                  <div className="lab-eyebrow" style={{ marginTop: "var(--l-2)" }}>
                    {s.frames.length} frames · <Blanks text={s.frames[0].place} />
                  </div>
                </div>
              </Reveal>
            </section>
          ))}

          {/* The summit is sunlit snow, so the outro needs the light panel the upper stops
              use. Bare cream text lands on white here and cannot be read. */}
          <section className="lab-mark lab-mark--center" style={{ top: markTop(1) }}>
            <div className="lab-panel lab-panel--light">
              <p className="lab-italic" style={{ fontSize: "1.25rem" }}>
                Every summit is a small, temporary agreement with the weather.
              </p>
              <div className="lab-exits">
                <Link href="/journeys" className="lab-exit">
                  ← all journeys
                </Link>
                <Link href="/" className="lab-exit">
                  back to the route →
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>

      <TierBadge report={report} onToggle={toggle} />
    </div>
  );
}
