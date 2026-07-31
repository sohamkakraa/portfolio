"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TierReport } from "./device-tier";
import { scrollProgress } from "./scene";

/**
 * One rAF loop that hands scroll progress to a callback. HUD readouts write straight to
 * DOM refs from here rather than through state, so scrolling never triggers a re-render.
 */
export function useScrollDriver(onFrame: (progress: number) => void) {
  const cbRef = useRef(onFrame);
  useEffect(() => {
    cbRef.current = onFrame;
  });

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cbRef.current(scrollProgress());
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
}

export function LabImage({
  src,
  alt,
  className = "lab-frame lab-frame--fill",
  priority = false,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1400}
      height={1050}
      className={className}
      style={style}
      sizes="(max-width: 900px) 90vw, 420px"
      priority={priority}
    />
  );
}

/** Wraps [bracketed blanks] in a visible placeholder marker so unwritten copy is obvious. */
export function Blanks({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={i} className="lab-ph">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function useReveal<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: "0px 0px -12% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`lab-reveal ${className}`}
      data-visible={visible}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

/**
 * Tracks which stop is on screen. Continuous state comes from scroll progress in the
 * render loop; discrete state comes from here.
 */
export function useActiveStop(count: number) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = refs.current.indexOf(entry.target as HTMLElement);
            if (idx > -1) setActive(idx);
          }
        });
      },
      { threshold: 0.5 }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [count]);

  const setRef = (i: number) => (el: HTMLElement | null) => {
    refs.current[i] = el;
  };

  return { active, setRef };
}

/**
 * Active stop derived from scroll position rather than from IntersectionObserver, so it
 * is still correct after a deep link, an anchor jump, or a restored scroll position —
 * cases where the observer never sees the intermediate sections at all.
 */
export function useActiveByProgress(stopTs: number[]) {
  const [active, setActive] = useState(0);
  const lastRef = useRef(0);

  useScrollDriver((progress) => {
    let idx = 0;
    for (let i = 0; i < stopTs.length; i += 1) {
      // Switch at the midpoint between stops so a label changes as you arrive, not after.
      const next = stopTs[i + 1];
      const boundary = next === undefined ? Infinity : (stopTs[i] + next) / 2;
      if (progress < boundary) {
        idx = i;
        break;
      }
      idx = i + 1;
    }
    const clamped = Math.min(stopTs.length - 1, idx);
    if (clamped !== lastRef.current) {
      lastRef.current = clamped;
      setActive(clamped);
    }
  });

  return active;
}

export function TierBadge({
  report,
  onToggle,
}: {
  report: TierReport;
  onToggle: () => void;
}) {
  if (!report.measured) return null;
  return (
    <div className="lab-tier">
      <span>{report.tier === "full" ? "full · webgl" : "lite · no webgl"}</span>
      <span style={{ opacity: 0.5 }}>{report.reasons[0]}</span>
      <button type="button" onClick={onToggle}>
        {report.tier === "full" ? "force lite" : "force full"}
      </button>
    </div>
  );
}

export function LabBack({ label = "← all spines" }: { label?: string }) {
  return (
    <Link href="/lab" className="lab-back">
      {label}
    </Link>
  );
}
