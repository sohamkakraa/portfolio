"use client";

import { ArrowUpRight } from "lucide-react";
import type { ProjectItem } from "@/lib/portfolio-types";
import ScrollReveal from "@/components/ui/ScrollReveal";

type ProjectGridProps = {
  items: ProjectItem[];
};

const statusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "live":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "in progress":
      return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "prototype":
      return "bg-violet-500/20 text-violet-400 border-violet-500/30";
    default:
      return "bg-[color:var(--bg-elevated)] text-[color:var(--fg-muted)] border-[color:var(--border)]";
  }
};

export default function ProjectGrid({ items }: ProjectGridProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {items.map((project, index) => (
        <ScrollReveal key={project.id} delay={index * 100}>
          <article className="project-card group">
            {/* Content sits above the ::before gradient */}
            <div className="relative z-10">
              {/* Top row: year + status */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[color:var(--fg-subtle)]">
                  {project.year}
                </span>
                {project.status && (
                  <span
                    className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] ${statusColor(
                      project.status
                    )}`}
                  >
                    {project.status}
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="mt-5 text-2xl font-bold tracking-tight text-[color:var(--fg)] sm:text-3xl">
                {project.title}
              </h3>

              {/* Summary */}
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--fg-muted)]">
                {project.summary}
              </p>

              {/* Tags */}
              <div className="mt-5 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <span
                    key={`${project.id}-${tag}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.15em] text-[color:var(--fg-muted)]"
                  >
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-[color:var(--accent)]"
                    />
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-6">
                {project.link ? (
                  <a
                    href={project.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--fg)] transition-colors hover:text-[color:var(--accent)]"
                  >
                    View project
                    <ArrowUpRight
                      size={16}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                ) : (
                  <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--fg-subtle)]">
                    Details on request
                  </span>
                )}
              </div>
            </div>
          </article>
        </ScrollReveal>
      ))}
    </div>
  );
}
