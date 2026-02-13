"use client";

import { useEffect, useMemo, useRef } from "react";

export type ProjectRailItem = {
  slug: string;
  title: string;
  meta: string;
  description: string;
  githubHref: string;
};

export default function InfiniteProjectRail({ items }: { items: ProjectRailItem[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const repeated = useMemo(() => {
    if (!items.length) return [] as ProjectRailItem[];
    return [...items, ...items, ...items];
  }, [items]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el || items.length === 0) return;

    let rafId = 0;

    const recenter = () => {
      const segmentWidth = el.scrollWidth / 3;
      if (segmentWidth > 0) {
        el.scrollLeft = segmentWidth;
      }
    };

    rafId = requestAnimationFrame(recenter);

    const onScroll = () => {
      const segmentWidth = el.scrollWidth / 3;
      if (!segmentWidth) return;

      if (el.scrollLeft <= 0) {
        el.scrollLeft += segmentWidth;
      } else if (el.scrollLeft >= segmentWidth * 2) {
        el.scrollLeft -= segmentWidth;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      el.scrollLeft += event.deltaY;
    };

    const resizeObserver = new ResizeObserver(() => {
      recenter();
    });

    resizeObserver.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("wheel", onWheel);
    };
  }, [items.length]);

  if (!items.length) {
    return null;
  }

  return (
    <div
      ref={trackRef}
      className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4"
      aria-label="Project cards"
    >
      {repeated.map((project, index) => (
        <article
          key={`${project.slug}-${index}`}
          className="min-h-[380px] w-[280px] shrink-0 snap-center rounded-2xl border border-white/20 bg-white/[0.04] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
        >
          <div className="flex h-full flex-col">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">{project.meta}</p>
              <h3 className="mt-3 text-2xl font-semibold text-[color:var(--foreground)]">{project.title}</h3>
            </div>

            <p className="mt-5 text-sm leading-relaxed text-[color:var(--muted)]">
              {project.description}
            </p>

            <div className="mt-auto pt-6">
              <a
                href={project.githubHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-white hover:bg-white/10"
              >
                Open GitHub
              </a>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
