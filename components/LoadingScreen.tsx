"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

type Line = { p: string; c: string; t: string; muted?: boolean; accent?: boolean };

const LINES: Line[] = [
  { p: "soham@portfolio", c: "$", t: "whoami" },
  { p: "", c: "", t: "→ data scientist · full-stack engineer · photographer", muted: true },
  { p: "soham@portfolio", c: "$", t: "ls projects/" },
  { p: "", c: "", t: "uma  tabscape  robotrader  viveka  diagnostic-reasoning", muted: true },
  { p: "soham@portfolio", c: "$", t: "load --portfolio --year=2026" },
  { p: "", c: "", t: "ready.", muted: true, accent: true },
];

export default function LoadingScreen({ visible, onComplete }: Props) {
  const [shown, setShown] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [idx, setIdx] = useState(0);
  const [hiding, setHiding] = useState(false);
  const skipRef = useRef(false);

  useEffect(() => {
    const skip = () => {
      if (skipRef.current) return;
      skipRef.current = true;
      setShown(LINES);
      setTyping("");
      setIdx(LINES.length);
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  useEffect(() => {
    if (idx >= LINES.length) return;
    const line = LINES[idx];
    const speed = line.muted ? 14 : 38;
    let i = 0;
    const id = setInterval(() => {
      if (skipRef.current) { clearInterval(id); return; }
      i++;
      setTyping(line.t.slice(0, i));
      if (i >= line.t.length) {
        clearInterval(id);
        setTimeout(() => {
          if (skipRef.current) return;
          setShown((s) => [...s, line]);
          setTyping("");
          setIdx((x) => x + 1);
        }, line.muted ? 220 : 320);
      }
    }, speed);
    return () => clearInterval(id);
  }, [idx]);

  // dismiss when (typing finished) AND (parent says hide)
  useEffect(() => {
    if (idx < LINES.length) return;
    if (visible) return;
    const t = setTimeout(() => {
      setHiding(true);
      const t2 = setTimeout(() => onComplete?.(), 600);
      return () => clearTimeout(t2);
    }, 250);
    return () => clearTimeout(t);
  }, [idx, visible, onComplete]);

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        opacity: hiding ? 0 : 1,
        transition: "opacity 0.6s",
      }}
    >
      <div className="mono" style={{ width: "min(620px, 100%)", fontSize: 14, lineHeight: 1.9 }}>
        <div
          style={{
            color: "var(--ink-3)",
            marginBottom: 18,
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          {"// booting portfolio.v3"}
        </div>
        {shown.map((l, i) => (
          <div
            key={i}
            style={{
              color: l.accent ? "var(--accent)" : l.muted ? "var(--ink-2)" : "var(--ink)",
            }}
          >
            {l.p && <span style={{ color: "var(--ink-3)" }}>{l.p} </span>}
            {l.c && <span style={{ color: "var(--accent)" }}>{l.c} </span>}
            <span>{l.t}</span>
          </div>
        ))}
        {idx < LINES.length && (
          <div style={{ color: LINES[idx].muted ? "var(--ink-2)" : "var(--ink)" }}>
            {LINES[idx].p && <span style={{ color: "var(--ink-3)" }}>{LINES[idx].p} </span>}
            {LINES[idx].c && <span style={{ color: "var(--accent)" }}>{LINES[idx].c} </span>}
            <span>{typing}</span>
            <span className="cursor-blink">▌</span>
          </div>
        )}
      </div>
    </div>
  );
}
