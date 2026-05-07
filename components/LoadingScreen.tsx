"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

type Line =
  | { kind: "prompt"; cmd: string; text: string }
  | { kind: "output"; text: string }
  | { kind: "progress" }
  | { kind: "success"; text: string };

const SCRIPT: Line[] = [
  { kind: "prompt", cmd: "$", text: "whoami" },
  { kind: "output", text: "soham kakra · m.sc data science & ai · tu/e" },
  { kind: "prompt", cmd: "$", text: "pwd" },
  { kind: "output", text: "~/portfolio" },
  { kind: "prompt", cmd: "$", text: "ls projects/" },
  { kind: "output", text: "uma  tabscape  robotrader  viveka  diagnostic  calm-ops" },
  { kind: "prompt", cmd: "$", text: "cat about.md | head -3" },
  { kind: "output", text: "data + ai engineer. systems thinker. visual journal on the side." },
  { kind: "prompt", cmd: "$", text: "booting interface" },
  { kind: "progress" },
  { kind: "success", text: "$ launch ✓" },
];

const TYPE_MS = 18;
const PAUSE_MS = 250;
const PROGRESS_MS = 600;
const HOLD_AFTER_MS = 350;

export default function LoadingScreen({ visible, onComplete }: Props) {
  const [hiding, setHiding] = useState(false);
  const [shown, setShown] = useState<Line[]>([]);
  const [typingIdx, setTypingIdx] = useState(0);
  const [typingText, setTypingText] = useState("");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [reduced, setReduced] = useState(false);
  const skipRef = useRef(false);

  // Reduced motion check
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
  }, []);

  // Skip on click / key
  useEffect(() => {
    const skip = () => {
      if (skipRef.current) return;
      skipRef.current = true;
      setShown(SCRIPT);
      setTypingText("");
      setTypingIdx(SCRIPT.length);
      setProgress(100);
      setDone(true);
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  // Reduced motion: show full state, hold briefly, finish
  useEffect(() => {
    if (!reduced) return;
    setShown(SCRIPT);
    setProgress(100);
    setDone(true);
  }, [reduced]);

  // Type sequence
  useEffect(() => {
    if (reduced || skipRef.current || done) return;
    if (typingIdx >= SCRIPT.length) {
      setDone(true);
      return;
    }
    const line = SCRIPT[typingIdx];

    if (line.kind === "progress") {
      const start = performance.now();
      let raf = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / PROGRESS_MS);
        setProgress(Math.round(t * 100));
        if (t < 1 && !skipRef.current) raf = requestAnimationFrame(tick);
        else {
          setShown((s) => [...s, line]);
          setTypingIdx((i) => i + 1);
        }
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }

    const text = line.kind === "success" ? line.text : (line.kind === "prompt" ? line.text : line.text);
    let i = 0;
    const id = setInterval(() => {
      if (skipRef.current) { clearInterval(id); return; }
      i++;
      setTypingText(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        const pause = setTimeout(() => {
          setShown((s) => [...s, line]);
          setTypingText("");
          setTypingIdx((idx) => idx + 1);
        }, PAUSE_MS);
        // store cleanup; OK to leak — short-lived
        void pause;
      }
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [typingIdx, reduced, done]);

  // When done + parent says hide, dismiss
  useEffect(() => {
    if (!done) return;
    if (visible) return; // wait for parent to flip visible to false
    const t = setTimeout(() => {
      setHiding(true);
      const t2 = setTimeout(() => onComplete?.(), 700);
      return () => clearTimeout(t2);
    }, HOLD_AFTER_MS);
    return () => clearTimeout(t);
  }, [done, visible, onComplete]);

  // Auto-finish after script fully types out, even if parent still says visible.
  // Parent uses {visible && done} via two latches; we just stop animating.

  return (
    <div
      role="status"
      aria-label="Loading"
      className="loader-terminal"
      style={{
        opacity: hiding ? 0 : 1,
        transform: hiding ? "translateY(-20px)" : "translateY(0)",
        transition: "opacity 0.6s cubic-bezier(0.4,0,1,1), transform 0.6s cubic-bezier(0.4,0,1,1)",
      }}
    >
      <div
        className="font-mono"
        style={{
          width: "min(640px, 90vw)",
          minHeight: "min(420px, 70vh)",
          background: "var(--bg-2)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top chrome */}
        <div
          style={{
            height: 36,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderBottom: "1px solid var(--line)",
            background: "var(--bg-3)",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--line-2)" }} />
          </div>
          <span
            style={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.16em",
            }}
          >
            ~/sohamkakra — boot
          </span>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "20px 22px",
            fontSize: 14,
            lineHeight: 1.55,
            flex: 1,
            color: "var(--ink-2)",
          }}
        >
          {shown.map((line, idx) => (
            <LineRow key={idx} line={line} progress={line.kind === "progress" ? 100 : undefined} />
          ))}

          {/* Active typing line */}
          {!done && typingIdx < SCRIPT.length && SCRIPT[typingIdx].kind !== "progress" && (
            <ActiveLine line={SCRIPT[typingIdx]} text={typingText} />
          )}

          {/* Active progress */}
          {!done && typingIdx < SCRIPT.length && SCRIPT[typingIdx].kind === "progress" && (
            <LineRow line={SCRIPT[typingIdx]} progress={progress} />
          )}
        </div>
      </div>
    </div>
  );
}

function LineRow({ line, progress }: { line: Line; progress?: number }) {
  if (line.kind === "prompt") {
    return (
      <div>
        <span style={{ color: "var(--accent)" }}>$ </span>
        <span style={{ color: "var(--ink)" }}>{line.text}</span>
      </div>
    );
  }
  if (line.kind === "output") {
    return <div style={{ color: "var(--ink-2)" }}>{line.text}</div>;
  }
  if (line.kind === "success") {
    return <div style={{ color: "var(--accent-2)" }}>{line.text}</div>;
  }
  // progress
  const pct = progress ?? 0;
  const width = 24;
  const filled = Math.round((pct / 100) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  return (
    <div style={{ color: "var(--ink-2)" }}>
      <span style={{ color: "var(--accent)" }}>[</span>
      <span>{bar}</span>
      <span style={{ color: "var(--accent)" }}>]</span>
      <span style={{ marginLeft: 12, color: "var(--ink-3)" }}>{pct}%</span>
    </div>
  );
}

function ActiveLine({ line, text }: { line: Line; text: string }) {
  if (line.kind === "prompt") {
    return (
      <div>
        <span style={{ color: "var(--accent)" }}>$ </span>
        <span style={{ color: "var(--ink)" }}>{text}</span>
        <span className="cursor-blink">▌</span>
      </div>
    );
  }
  if (line.kind === "output") {
    return (
      <div style={{ color: "var(--ink-2)" }}>
        {text}
        <span className="cursor-blink">▌</span>
      </div>
    );
  }
  if (line.kind === "success") {
    return (
      <div style={{ color: "var(--accent-2)" }}>
        {text}
        <span className="cursor-blink">▌</span>
      </div>
    );
  }
  return null;
}
