"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AnalyticsEvent, StoredSession } from "@/lib/analytics/schema";

/**
 * Session replay for a scene that cannot be recorded.
 *
 * A DOM recorder captures nothing of a WebGL canvas — measured: rrweb with canvas capture on
 * emitted zero canvas events and stored the node as an empty element, at ~287KB a visit. So instead
 * of replaying pixels this replays *inputs*: the visitor's scroll track drives a live copy of the
 * real page, and the scene renders itself again at their pace. It is higher fidelity than a
 * recording and about two hundred times smaller.
 *
 * The stage is same-origin, which is why the site allows framing by itself and no one else.
 */

type Props = { session: StoredSession };

const kindLabel: Record<AnalyticsEvent["k"], string> = {
  view: "opened",
  scroll: "scrolled",
  chapter: "reached",
  click: "clicked",
  photo: "opened photo",
  friction: "friction",
  vital: "timing",
  leave: "left",
};

function describe(e: AnalyticsEvent): string {
  switch (e.k) {
    case "view":
      return `opened ${e.path}`;
    case "chapter":
      return `reached ${e.id}`;
    case "click":
      return `clicked "${e.label}"${e.to ? ` → ${e.to}` : ""}`;
    case "photo":
      return `opened ${e.src.split("/").pop()}`;
    case "friction":
      return `${e.kind} click on "${e.label}"`;
    case "vital":
      return `${e.name} ${e.name === "CLS" ? e.value.toFixed(3) : `${Math.round(e.value)}ms`}`;
    case "leave":
      return `left ${e.path} after ${Math.round(e.ms / 1000)}s`;
    case "scroll":
      return `scrolled to ${Math.round(e.p * 100)}%`;
  }
}

const clock = (ms: number) =>
  `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

export default function Replay({ session }: Props) {
  const stage = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [at, setAt] = useState(0);
  const [ready, setReady] = useState(false);

  const track = useMemo(
    () => session.events.filter((e): e is Extract<AnalyticsEvent, { k: "scroll" }> => e.k === "scroll"),
    [session.events]
  );
  const notable = useMemo(() => session.events.filter((e) => e.k !== "scroll" && e.k !== "vital"), [session.events]);
  const duration = useMemo(
    () => Math.max(1, ...session.events.map((e) => e.t)),
    [session.events]
  );
  // The first path they were on; the stage opens there.
  const firstPath = useMemo(
    () => session.events.find((e): e is Extract<AnalyticsEvent, { k: "view" }> => e.k === "view")?.path ?? "/",
    [session.events]
  );

  /** Scroll the staged page to wherever the visitor was at this moment. */
  const seek = useCallback(
    (ms: number) => {
      const win = stage.current?.contentWindow;
      if (!win) return;
      let p = 0;
      for (const s of track) {
        if (s.t > ms) break;
        p = s.p;
      }
      try {
        const doc = win.document.documentElement;
        win.scrollTo({ top: p * (doc.scrollHeight - win.innerHeight), behavior: "auto" });
      } catch {
        // A cross-origin stage would land here. Same-origin by construction, so this is belt only.
      }
    },
    [track]
  );

  // The playhead lives in a ref, not in state. Reading it from state inside the animation loop meant
  // every frame recomputed from the value captured when play started, so the clock advanced by one
  // frame and then stood still.
  const playhead = useRef(0);

  useEffect(() => {
    if (!playing) return;
    const startedAt = performance.now();
    const base = playhead.current >= duration ? 0 : playhead.current;
    let raf = 0;

    const tick = (now: number) => {
      const next = base + (now - startedAt);
      if (next >= duration) {
        playhead.current = duration;
        setAt(duration);
        setPlaying(false);
        return;
      }
      playhead.current = next;
      setAt(next);
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration]);

  useEffect(() => {
    if (ready) seek(at);
  }, [at, ready, seek]);

  /** Jump the playhead, from the scrubber or the event log. */
  const jumpTo = useCallback((ms: number) => {
    setPlaying(false);
    playhead.current = ms;
    setAt(ms);
  }, []);

  const currentIndex = notable.findLastIndex((e) => e.t <= at);

  return (
    <>
      <div className="ins-replay-wrap">
        <div>
          <div className="ins-stage">
            <iframe
              ref={stage}
              src={firstPath}
              title="Replay stage"
              onLoad={() => setReady(true)}
              /* No sandbox attribute. Driving the scene needs both allow-scripts and
                 allow-same-origin, and granting those two together is equivalent to no sandbox at
                 all — the browser says so out loud in a console warning. The real boundary is that
                 this frame is the site's own origin and the page is behind admin auth. */
            />
            <div className="ins-stage-veil" aria-hidden />
          </div>

          <div className="ins-controls">
            <button
              type="button"
              className="ins-btn"
              onClick={() => setPlaying((p) => !p)}
              disabled={!ready}
            >
              {playing ? "pause" : at >= duration ? "again" : "play"}
            </button>
            <input
              className="ins-scrub"
              type="range"
              min={0}
              max={duration}
              value={Math.round(at)}
              onChange={(e) => jumpTo(Number(e.target.value))}
              aria-label="Scrub the session"
            />
            <span className="ins-clock">
              {clock(at)} / {clock(duration)}
            </span>
          </div>
          {!ready ? <p className="ins-note">Loading the stage…</p> : null}
        </div>

        <div>
          <div className="ins-eyebrow" style={{ marginBottom: "0.75rem" }}>
            what they did
          </div>
          <div className="ins-log">
            {notable.map((e, i) => (
              <button
                key={`${e.t}-${e.k}-${i}`}
                type="button"
                className="ins-log-row"
                data-now={i === currentIndex}
                data-kind={e.k}
                onClick={() => jumpTo(e.t)}
                title={kindLabel[e.k]}
                style={{ width: "100%", textAlign: "left", background: "none", cursor: "pointer" }}
              >
                <span className="ins-log-t">{clock(e.t)}</span>
                <span>{describe(e)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
