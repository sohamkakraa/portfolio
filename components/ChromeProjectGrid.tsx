"use client";

import { useState } from "react";

type ChromeProject = {
  slug: string;
  title: string;
  meta: string;
  description: string;
  githubHref: string;
};

function gridSpanClass(index: number) {
  if (index % 5 === 0) return "md:col-span-7 md:row-span-2";
  if (index % 5 === 1) return "md:col-span-5 md:row-span-1";
  if (index % 5 === 2) return "md:col-span-5 md:row-span-1";
  if (index % 5 === 3) return "md:col-span-6 md:row-span-1";
  return "md:col-span-6 md:row-span-1";
}

function ChromeCard({ project, index }: { project: ChromeProject; index: number }) {
  const [spot, setSpot] = useState({ x: 50, y: 50 });

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(140deg,rgba(255,255,255,0.10),rgba(255,255,255,0.02))] p-6 shadow-[0_16px_60px_rgba(0,0,0,0.28)] transition duration-300 hover:-translate-y-1 hover:border-white/35 ${gridSpanClass(
        index
      )}`}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        setSpot({ x, y });
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(circle at ${spot.x}% ${spot.y}%, rgba(138,180,248,0.25), rgba(138,180,248,0.0) 45%)`,
        }}
      />
      <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-14 h-52 w-52 rounded-full bg-blue-400/10 blur-3xl" />

      <div className="relative z-10 flex h-full flex-col">
        <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--muted)]">{project.meta}</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
          {project.title}
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)] sm:text-base">
          {project.description}
        </p>

        <div className="mt-auto pt-6">
          <a
            href={project.githubHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[color:var(--foreground)] transition hover:border-white hover:bg-white/10"
          >
            GitHub
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export default function ChromeProjectGrid({ items }: { items: ChromeProject[] }) {
  return (
    <div className="mt-10 grid auto-rows-[220px] grid-cols-1 gap-6 md:grid-cols-12">
      {items.map((project, index) => (
        <ChromeCard key={project.slug} project={project} index={index} />
      ))}
    </div>
  );
}
