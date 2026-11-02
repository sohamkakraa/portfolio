import type { Metadata } from "next";
import Link from "next/link";
import { getPortfolioData } from "@/lib/portfolio-server";
import { PROJECTS_COPY, PROJECT_COPY } from "@/lib/basecamp/copy";

export const metadata: Metadata = {
  title: "Projects",
  description: PROJECTS_COPY.intro,
  alternates: { canonical: "/projects" },
};

/**
 * Plain cards, everything visible. Titles, links, status and stack come from the CMS; the Why /
 * What / Now text is owned by lib/basecamp/copy.ts and falls back to the CMS summary.
 */
export default async function ProjectsPage() {
  const { projects } = await getPortfolioData();

  return (
    <div className="bc-wrap">
      <header className="bc-page-head">
        <Link href="/work" className="bc-back">
          ← Work
        </Link>
        <h1 className="bc-h1">{PROJECTS_COPY.title}</h1>
        <p className="bc-read bc-lede">{PROJECTS_COPY.intro}</p>
      </header>

      <ul className="bc-projects">
        {projects.items.map((p) => {
          const copy = PROJECT_COPY[p.id];
          const rows = copy
            ? ([
                ["Why", copy.why],
                ["What", copy.what],
                ["Now", copy.now],
              ] as const)
            : ([["What", p.summary]] as const);
          return (
            <li key={p.id} id={p.id} className="bc-project">
              <div className="bc-project-head">
                <h2 className="bc-project-title">{p.title}</h2>
                <span className="bc-muted">
                  <span className="bc-dot">{p.year}</span>
                  {p.status ? ` · ${p.status}` : ""}
                </span>
              </div>
              <dl className="bc-project-rows">
                {rows.map(([label, body]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>{body}</dd>
                  </div>
                ))}
              </dl>
              {p.stack?.length ? (
                <div className="bc-tags">
                  {p.stack.map((s) => (
                    <span key={s} className="bc-tag">
                      {s}
                    </span>
                  ))}
                </div>
              ) : null}
              {p.link || p.repo ? (
                <div className="bc-hero-actions" style={{ marginTop: 0 }}>
                  {p.link ? (
                    <a href={p.link} className="bc-arrow" target="_blank" rel="noreferrer">
                      Open it
                    </a>
                  ) : null}
                  {p.repo ? (
                    <a href={p.repo} className="bc-arrow" target="_blank" rel="noreferrer">
                      Code
                    </a>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
