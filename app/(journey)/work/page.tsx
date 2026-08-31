import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import FilmOverlay from "@/lib/journey/FilmOverlay";
import { ROUTE_CHAPTERS, WORK, WORK_ARC } from "@/lib/journey/content";
import { Blanks, JourneyBack } from "@/lib/journey/ui";

export const metadata = {
  title: "Work · Soham Kakra",
  description: "Roles, degrees and what each one actually involved.",
};

const KIND_LABEL: Record<string, string> = {
  degree: "degree",
  role: "role",
  internship: "internship",
};

const PUBLIC_RESUME_FILENAME = "soham-kakra-resume.pdf";

/**
 * The résumé link renders only when a file is there to serve.
 *
 * Checked on disk rather than assumed, because a download that 404s costs more trust than a
 * missing one, and the file is deliberately absent until a copy without a personal phone
 * number in it exists.
 */
function resumeFile(): string | null {
  const file = path.join(process.cwd(), "public", "resume", PUBLIC_RESUME_FILENAME);
  return fs.existsSync(file) ? `/resume/${PUBLIC_RESUME_FILENAME}` : null;
}

export default function WorkPage() {
  // Newest first. Nobody scanning a CV starts at the bottom.
  const roles = [...WORK].reverse();
  const resume = resumeFile();
  const chapterOf = (id: string) => ROUTE_CHAPTERS.find((c) => c.id === id);

  return (
    <div className="lab">
      <FilmOverlay vignette={0.42} grain={0.045} />
      <JourneyBack />

      <div className="lab-doc">
        <header>
          <div className="lab-eyebrow lab-eyebrow--accent">{WORK_ARC.eyebrow}</div>
          <h1 className="lab-display lab-h2" style={{ marginTop: "var(--l-3)", maxWidth: "26ch" }}>
            {WORK_ARC.title}
          </h1>
          <p className="lab-body" style={{ marginTop: "var(--l-4)", maxWidth: "62ch" }}>
            {WORK_ARC.body}
          </p>

          <div
            style={{
              marginTop: "var(--l-4)",
              display: "flex",
              gap: "var(--l-3)",
              flexWrap: "wrap",
              alignItems: "baseline",
            }}
          >
            {/* Absent until a PDF exists, and silent about why. The note here used to explain where
                to drop the file, which is a message to me appearing on a page for readers. */}
            {resume ? (
              <a href={resume} className="lab-exit" download>
                download the résumé ↓
              </a>
            ) : null}
            <Link href="/" className="lab-exit">
              or walk it as a route →
            </Link>
          </div>
        </header>

        <main style={{ marginTop: "var(--l-5)" }}>
          {roles.map((r) => {
            const chapter = chapterOf(r.chapter);
            return (
              <article key={r.id} id={r.id} className="lab-role">
                <div className="lab-role-head">
                  <h2 className="lab-role-org">{r.org}</h2>
                  <div className="lab-eyebrow">{r.span}</div>
                </div>

                <p className="lab-small" style={{ marginTop: 6, color: "var(--l-ink-2)" }}>
                  {r.role} · <Blanks text={r.city} /> · {KIND_LABEL[r.kind]}
                </p>

                <p className="lab-body" style={{ marginTop: "var(--l-2)", maxWidth: "58ch" }}>
                  {r.note}
                </p>

                {r.detail ? (
                  <p
                    className="lab-body"
                    style={{ marginTop: "var(--l-2)", maxWidth: "58ch", color: "var(--l-ink-2)" }}
                  >
                    {r.detail}
                  </p>
                ) : null}

                {r.metrics?.length ? (
                  <div className="lab-metrics">
                    {r.metrics.map((m) => (
                      <div key={m.label}>
                        <div className="lab-metric-value">{m.value}</div>
                        <div className="lab-eyebrow">{m.label}</div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Every role happened somewhere, and the route is where that means something —
                    but a role whose city is still a blank cannot be pinned to a chapter's
                    region without asserting a place I have not confirmed. */}
                {chapter && !r.city.includes("[") ? (
                  <Link
                    href={`/#${chapter.id}`}
                    className="lab-exit"
                    style={{ marginTop: "var(--l-3)", display: "inline-block" }}
                  >
                    {chapter.region.toLowerCase()}, on the route →
                  </Link>
                ) : null}
              </article>
            );
          })}
        </main>

        <footer style={{ marginTop: "var(--l-6)" }}>
          <p className="lab-italic" style={{ fontSize: "1.0625rem", maxWidth: "44ch" }}>
            The list is short because I am early. It is also entirely true, which is rarer.
          </p>
        </footer>
      </div>
    </div>
  );
}
