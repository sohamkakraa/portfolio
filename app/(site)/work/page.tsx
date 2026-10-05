import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { WORK } from "@/lib/work";

export const metadata: Metadata = {
  title: "Work",
  description: "AI engineer and Talent Lab resident at Prosus. Roles, degrees, projects and CV.",
  alternates: { canonical: "/work" },
};

const RESUME = "soham-kakra-resume.pdf";

/** Linked only when the file is actually there, so the link never 404s. */
function resumeHref(): string | null {
  return fs.existsSync(path.join(process.cwd(), "public", "resume", RESUME)) ? `/resume/${RESUME}` : null;
}

const KIND: Record<string, string> = { degree: "Degree", role: "Role", internship: "Internship" };

/** The quiet tent: calm, plain, short. */
export default function WorkPage() {
  const roles = [...WORK].reverse();
  const resume = resumeHref();

  return (
    <div className="bc-wrap">
      <header className="bc-page-head">
        <span className="bc-eyebrow">Work</span>
        <h1 className="bc-h1">AI engineer</h1>
        <p className="bc-read bc-lede">
          I&apos;m a Talent Lab resident at Prosus in Amsterdam. Before that I interned there and wrote my
          master&apos;s thesis at TU/e on adaptive retrieval for complex enterprise questions.
        </p>
        <p className="bc-read">
          I like building things end to end, from the model to the interface someone actually uses. Most of
          my work so far has been data systems, AI agents and full-stack products.
        </p>
        <div className="bc-hero-actions">
          {resume ? (
            <a href={resume} className="bc-btn" target="_blank" rel="noreferrer">
              CV (PDF)
            </a>
          ) : null}
          <Link href="/projects" className="bc-arrow">
            Projects
          </Link>
        </div>
      </header>

      <section className="bc-section" aria-labelledby="roles-h" style={{ borderTop: 0, paddingTop: 0 }}>
        <h2 id="roles-h" className="bc-eyebrow" style={{ marginBottom: 8 }}>
          Roles and degrees
        </h2>
        <ol className="bc-roles">
          {roles.map((r) => {
            const city = r.city.includes("[") ? "" : r.city;
            const current = r.status === "current" || r.span.endsWith("now");
            return (
              <li key={r.id} id={r.id} className="bc-role">
                <div className="bc-role-when">{r.span}</div>
                <div className="bc-role-body">
                  <h3 className="bc-role-title">
                    {r.org} <span>· {r.role}</span>
                    {current && r.kind !== "degree" ? <span className="bc-role-now">Now</span> : null}
                  </h3>
                  <div className="bc-muted" style={{ fontSize: "0.92rem" }}>
                    {[KIND[r.kind], city].filter(Boolean).join(" · ")}
                  </div>
                  <p>{r.note}</p>
                  {r.detail ? <p>{r.detail}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
