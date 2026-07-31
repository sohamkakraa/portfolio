"use client";

import { useEffect, useRef } from "react";

type Props = {
  /** 0–1. How hard the corners fall off. */
  vignette?: number;
  grain?: number;
  /** Grain jitter is deliberately choppier than the render loop — that is how real film reads. */
  jitterMs?: number;
};

const GRAIN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";

export default function FilmOverlay({ vignette = 0.5, grain = 0.07, jitterMs = 70 }: Props) {
  const grainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: number;
    const tick = () => {
      const el = grainRef.current;
      if (el) {
        const x = (Math.random() * 12 - 6).toFixed(1);
        const y = (Math.random() * 12 - 6).toFixed(1);
        el.style.transform = `translate(${x}px,${y}px)`;
      }
      timer = window.setTimeout(tick, jitterMs);
    };
    tick();
    return () => window.clearTimeout(timer);
  }, [jitterMs]);

  return (
    <div aria-hidden className="lab-film">
      <div
        className="lab-film-vignette"
        style={{
          background: `radial-gradient(ellipse 78% 76% at 50% 44%, transparent 52%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <div
        ref={grainRef}
        className="lab-film-grain"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`,
          opacity: grain,
        }}
      />
    </div>
  );
}
