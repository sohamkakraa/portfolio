"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import FilmOverlay from "@/lib/lab/FilmOverlay";
import { measureTier, useDeviceTier, type TierReport } from "@/lib/lab/device-tier";
import { HOURS } from "@/lib/lab/lab-content";
import { useJourneyScene } from "@/lib/lab/scene";
import { Blanks, LabBack, LabImage, Reveal, TierBadge, useActiveByProgress, useScrollDriver } from "@/lib/lab/ui";
import { buildDayScene, liteSkyGradient } from "./day-scene";

function clockToMinutes(clock: string) {
  const [h, m] = clock.split(":").map(Number);
  return h * 60 + m;
}

/** The readout ticks continuously between the hour stops, so time is always moving. */
function minutesAt(progress: number) {
  const stops = HOURS.map((h) => ({ t: h.t, m: clockToMinutes(h.clock) }));
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (progress >= stops[i].t && progress <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const local = Math.min(1, Math.max(0, (progress - a.t) / span));
  const total = a.m + (b.m - a.m) * local;
  const h = Math.floor(total / 60) % 24;
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function DaySpine() {
  const detected = useDeviceTier();
  const [override, setOverride] = useState<TierReport | null>(null);
  const report = override ?? detected;
  const tier = report.tier;

  const clockRef = useRef<HTMLDivElement>(null);
  const liteBgRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const active = useActiveByProgress(HOURS.map((hh) => hh.t));

  const degrade = useCallback(() => {
    setOverride({ tier: "lite", reasons: ["framerate dropped below 28fps"], measured: true });
  }, []);

  const { canvasRef } = useJourneyScene({
    enabled: report.measured && tier === "full",
    build: buildDayScene,
    onDegrade: degrade,
  });

  useScrollDriver((progress) => {
    if (clockRef.current) clockRef.current.textContent = minutesAt(progress);
    if (markerRef.current) markerRef.current.style.top = `${(1 - progress) * 100}%`;
    if (tier === "lite" && liteBgRef.current) {
      liteBgRef.current.style.background = liteSkyGradient(progress);
    }
  });

  const toggle = () =>
    setOverride(
      tier === "full"
        ? { tier: "lite", reasons: ["forced by you"], measured: true }
        : { ...measureTier(), tier: "full", reasons: ["forced by you"] }
    );

  return (
    <div className="lab">
      {tier === "full" ? (
        <canvas ref={canvasRef} className="lab-canvas" />
      ) : (
        <div ref={liteBgRef} className="lab-lite-bg" style={{ background: liteSkyGradient(0) }} />
      )}
      <div className="lab-text-scrim" aria-hidden />
      <FilmOverlay vignette={0.42} />
      <LabBack />

      <div className="lab-hud lab-hud--bottom-left" style={{ bottom: "calc(var(--l-3) + 46px)" }}>
        <div className="lab-eyebrow">{HOURS[active].eyebrow.split("·")[0].trim()}</div>
        <div
          ref={clockRef}
          className="lab-mono"
          style={{ fontSize: "2rem", fontWeight: 300, letterSpacing: "0.02em" }}
        >
          03:40
        </div>
      </div>

      <div className="lab-rail">
        <div ref={markerRef} className="lab-rail-marker" style={{ top: "100%" }} />
        {HOURS.map((h) => (
          <div key={h.id} className="lab-rail-tick" style={{ top: `${(1 - h.t) * 100}%` }} />
        ))}
      </div>

      <div className="lab-content">
        <section className="lab-stage lab-stage--left">
          <div>
            <div className="lab-eyebrow lab-eyebrow--accent">SPINE B · TIME IS THE AXIS</div>
            <h1 className="lab-display lab-h1" style={{ marginTop: "var(--l-3)" }}>
              One day, from
              <br />
              dark to dark.
            </h1>
            <p className="lab-body" style={{ marginTop: "var(--l-4)" }}>
              You stand in one place and the day moves around you. Every section of the site —
              including the work — sits at an hour, and the sky behind the entire page is one
              continuous interpolation from 03:40 to 23:52.
            </p>
            <p className="lab-italic" style={{ marginTop: "var(--l-5)", fontSize: "0.9375rem" }}>
              scroll to let the light move ↓
            </p>
          </div>
        </section>

        {HOURS.map((hour, i) => (
          <section
            key={hour.id}
            className={`lab-stage ${i % 2 === 0 ? "lab-stage--left" : "lab-stage--right"}`}
          >
            <Reveal>
              <div className={`lab-panel ${hour.t > 0.4 && hour.t < 0.8 ? "lab-panel--light" : ""}`}>
                <div className="lab-eyebrow lab-eyebrow--accent">
                  <span className="lab-mono">{hour.clock}</span>
                  {"  ·  "}
                  <Blanks text={hour.eyebrow} />
                </div>

                <h3
                  className="lab-display lab-h3"
                  style={{ marginTop: "var(--l-2)", marginBottom: "var(--l-2)" }}
                >
                  {hour.title}
                </h3>
                <p className="lab-small">{hour.caption}</p>

                {hour.kind === "work" && hour.work ? (
                  <div style={{ marginTop: "var(--l-3)" }}>
                    <div style={{ borderTop: "1px solid var(--l-line)", paddingTop: "var(--l-3)" }}>
                      <div className="lab-eyebrow">{hour.work.title}</div>
                      <p className="lab-small" style={{ marginTop: "var(--l-1)" }}>
                        {hour.work.note}
                      </p>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "var(--l-2)",
                          marginTop: "var(--l-3)",
                        }}
                      >
                        {hour.work.metrics.map((m) => (
                          <div key={m.label}>
                            <div className="lab-mono" style={{ fontSize: "1.25rem" }}>
                              {m.value}
                            </div>
                            <div className="lab-eyebrow">{m.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}

                {hour.frames.length > 0 ? (
                  <div
                    style={{
                      marginTop: "var(--l-3)",
                      display: "grid",
                      gap: "var(--l-1)",
                      gridTemplateColumns: hour.frames.length > 1 ? "2fr 1fr" : "1fr",
                    }}
                  >
                    <LabImage src={hour.frames[0].src} alt={hour.frames[0].caption} priority={i < 2} />
                    {hour.frames.length > 1 ? (
                      <div style={{ display: "grid", gap: "var(--l-1)" }}>
                        {hour.frames.slice(1, 3).map((f) => (
                          <LabImage key={f.src} src={f.src} alt={f.caption} />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {hour.frames.length > 0 ? (
                  <div className="lab-eyebrow" style={{ marginTop: "var(--l-2)" }}>
                    <Blanks text={hour.frames[0].place} />
                  </div>
                ) : null}
              </div>
            </Reveal>
          </section>
        ))}

        <section className="lab-stage lab-stage--center">
          <p className="lab-italic" style={{ fontSize: "1.25rem", maxWidth: "28ch" }}>
            The day closes on the same sky it opened on.
          </p>
          <div className="lab-exits">
            <Link href="/lab/route" className="lab-exit">
              ← the route
            </Link>
            <Link href="/lab" className="lab-exit">
              all spines
            </Link>
            <Link href="/lab/ascent" className="lab-exit">
              the ascent →
            </Link>
          </div>
        </section>
      </div>

      <TierBadge report={report} onToggle={toggle} />
    </div>
  );
}
