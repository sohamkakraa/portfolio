"use client";

import { useEffect, useRef } from "react";

/**
 * Fills the trail line as you scroll, and lights each stop's marker once you reach it. Writes a CSS
 * variable and a class instead of re-rendering, so scrolling stays cheap.
 */
export default function TrailProgress({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const trail = ref.current;
    if (!trail) return;
    const stops = Array.from(trail.querySelectorAll<HTMLElement>(".bc-stop"));
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = trail.getBoundingClientRect();
      const line = window.innerHeight * 0.55;
      const progress = Math.min(1, Math.max(0, (line - rect.top) / Math.max(1, rect.height)));
      trail.style.setProperty("--progress", progress.toFixed(4));
      for (const stop of stops) {
        stop.classList.toggle("is-reached", stop.getBoundingClientRect().top < line);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <ol ref={ref} className="bc-trail">
      {children}
    </ol>
  );
}
