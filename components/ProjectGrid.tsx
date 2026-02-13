"use client";

import type { ProjectItem } from "@/lib/portfolio-types";

type ProjectGridProps = {
  items: ProjectItem[];
};

export default function ProjectGrid({ items }: ProjectGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((project) => (
        <article
          key={project.id}
          className="group relative overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-6 shadow-[0_18px_40px_rgba(15,20,35,0.08)] transition hover:-translate-y-1 hover:border-[color:var(--accent)]"
        >
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
            <span>{project.year}</span>
            {project.status ? (
              <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-elevated)] px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-[color:var(--foreground)]">
                {project.status}
              </span>
            ) : null}
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-[color:var(--foreground)]">
            {project.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)]">
            {project.summary}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={`${project.id}-${tag}`}
                className="inline-flex items-center gap-1 rounded-full border border-[color:color-mix(in_srgb,var(--border)_65%,transparent)] bg-[color:color-mix(in_srgb,var(--surface-elevated)_68%,transparent)] px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]"
              >
                <span
                  aria-hidden="true"
                  className="h-1 w-1 rounded-full bg-[color:color-mix(in_srgb,var(--muted)_65%,transparent)]"
                />
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6">
            {project.link ? (
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.25em]"
              >
                View project
                <span aria-hidden="true">↗</span>
              </a>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.24em] text-[color:var(--muted)]">
                Details on request
              </span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
