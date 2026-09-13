"use client";

import { useEffect, useRef, useState } from "react";

export default function DayOneProgress() {
  const progressRef = useRef<HTMLSpanElement>(null);
  const [chapter, setChapter] = useState("Cold open");

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".day-one");
    if (!root) return;

    const revealTargets = [...root.querySelectorAll<HTMLElement>(".day-section, .day-photo, .day-diptych, .day-stat-row, .day-storm")];
    const parallaxTargets = [...root.querySelectorAll<HTMLElement>("[data-parallax]")];
    const sections = [...root.querySelectorAll<HTMLElement>(".day-section")];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let currentChapter = "Cold open";

    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const progress = distance > 0 ? Math.min(window.scrollY / distance, 1) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;

      let activeSection = sections[0];
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.42) activeSection = section;
        else break;
      }
      const activeHeading = activeSection?.querySelector("h2")?.textContent?.trim();
      if (activeHeading && activeHeading !== currentChapter) {
        currentChapter = activeHeading;
        setChapter(activeHeading);
      }

      if (!reducedMotion) {
        root.style.setProperty("--day-hero-shift", `${Math.min(window.scrollY * 0.11, 110)}px`);
        for (const target of parallaxTargets) {
          const bounds = target.getBoundingClientRect();
          const distanceFromCentre = bounds.top + bounds.height / 2 - window.innerHeight / 2;
          const shift = Math.max(-42, Math.min(42, distanceFromCentre * -0.045));
          target.style.setProperty("--day-parallax", `${shift}px`);
        }
      }
      frame = 0;
    };

    const scheduleUpdate = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    for (const target of revealTargets) {
      if (target.getBoundingClientRect().top < window.innerHeight * 0.94) target.classList.add("is-visible");
    }
    root.classList.add("day-motion-ready");

    const revealObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10%", threshold: 0.08 }
    );
    for (const target of revealTargets) revealObserver.observe(target);

    update();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      revealObserver.disconnect();
      root.classList.remove("day-motion-ready");
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  return (
    <>
      <div className="day-progress" aria-hidden="true"><span ref={progressRef} /></div>
      <div className="day-chapter-rail" aria-live="polite"><span>Now reading</span><strong>{chapter}</strong></div>
    </>
  );
}
