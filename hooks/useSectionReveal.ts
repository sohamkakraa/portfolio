"use client";

import { useEffect, useRef, useState } from "react";

type VisibleState = {
  featured: boolean;
  miniGrid: boolean;
};

export function useSectionReveal() {
  const [visible, setVisible] = useState<VisibleState>({
    featured: false,
    miniGrid: false,
  });

  const featuredRef = useRef<HTMLElement | null>(null);
  const miniGridRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      setVisible({ featured: true, miniGrid: true });
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;

          if (e.target === featuredRef.current) {
            setVisible((v) => ({ ...v, featured: true }));
          }
          if (e.target === miniGridRef.current) {
            setVisible((v) => ({ ...v, miniGrid: true }));
          }
        }
      },
      { threshold: 0.18 }
    );

    if (featuredRef.current) io.observe(featuredRef.current);
    if (miniGridRef.current) io.observe(miniGridRef.current);

    return () => io.disconnect();
  }, []);

  return { visible, featuredRef, miniGridRef };
}