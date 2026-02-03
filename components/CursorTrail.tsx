"use client";

import { useEffect, useRef } from "react";

export default function CursorTrail() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cursor = cursorRef.current;
    if (!cursor) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const setCursorActive = (active: boolean) => {
      document.body.classList.toggle("cursor-hidden", active);
    };

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let targetX = x;
    let targetY = y;
    let raf = 0;
    let lastSpawn = 0;

    const update = () => {
      x += (targetX - x) * 0.18;
      y += (targetY - y) * 0.18;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      raf = window.requestAnimationFrame(update);
    };

    const spawnStar = () => {
      const star = document.createElement("span");
      star.className = "cursor-star";
      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      star.style.setProperty("--dx", `${(Math.random() - 0.5) * 24}px`);
      star.style.setProperty("--dy", `${(Math.random() - 0.5) * 24}px`);
      document.body.appendChild(star);
      window.setTimeout(() => star.remove(), 700);
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      const now = performance.now();
      if (now - lastSpawn > 45) {
        lastSpawn = now;
        spawnStar();
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("a, button")) {
        document.body.classList.add("cursor-link");
      }
    };

    const onOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest("a, button")) {
        document.body.classList.remove("cursor-link");
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        setCursorActive(false);
      } else {
        setCursorActive(true);
      }
    };

    const onEnter = () => setCursorActive(true);
    const onLeave = () => setCursorActive(false);

    setCursorActive(true);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mouseout", onOut, { passive: true });
    window.addEventListener("focus", onEnter);
    window.addEventListener("blur", onLeave);
    window.addEventListener("mouseenter", onEnter);
    window.addEventListener("mouseleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    raf = window.requestAnimationFrame(update);

    return () => {
      setCursorActive(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      window.removeEventListener("focus", onEnter);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("mouseenter", onEnter);
      window.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={cursorRef} className="cursor-galaxy" aria-hidden="true" />;
}
