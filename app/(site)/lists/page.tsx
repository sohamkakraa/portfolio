import type { Metadata } from "next";
import Link from "next/link";
import GuessBox from "@/components/basecamp/GuessBox";
import { approvedByQuestion, type Guess } from "@/lib/basecamp/community";
import { entryBySlug } from "@/lib/basecamp/logbook";
import { BUCKET, CURIOUS, FACTOIDS, NEXT_UP } from "@/lib/basecamp/lists";

export const metadata: Metadata = {
  title: "Lists",
  description: "The bucket list, the questions I'm still figuring out (send me your guess), and the things I figured out on a bus.",
  alternates: { canonical: "/lists" },
};

/** Approved guesses change when one is approved in admin, which revalidates this page directly. */
export const revalidate = 3600;

async function loadGuesses(): Promise<Record<string, Guess[]>> {
  try {
    return await approvedByQuestion();
  } catch {
    // A Redis hiccup should cost the guesses, not the page.
    return {};
  }
}

export default async function ListsPage() {
  const guesses = await loadGuesses();
  const done = BUCKET.filter((b) => b.done);
  const todo = BUCKET.filter((b) => !b.done);

  return (
    <div className="bc-wrap">
      <header className="bc-page-head">
        <span className="bc-eyebrow">Pinned up at camp</span>
        <h1 className="bc-h1">Lists</h1>
        <p className="bc-read bc-lede">
          What I still want to do, what I&apos;m still trying to figure out, and the small things I figured
          out along the way. I&apos;m happy being average at a lot of these.
        </p>
      </header>

      <section id="bucket" className="bc-section" aria-labelledby="bucket-h">
        <div className="bc-section-head">
          <div>
            <span className="bc-eyebrow">
              <span className="bc-dot">
                {done.length}/{BUCKET.length}
              </span>{" "}
              ticked off
            </span>
            <h2 id="bucket-h" className="bc-h2">
              Bucket list
            </h2>
          </div>
        </div>
        <ul className="bc-bucket">
          {[...done, ...todo].map((b) => {
            const entry = b.entry ? entryBySlug(b.entry) : undefined;
            return (
              <li key={b.id} className={b.done ? "done" : b.id === NEXT_UP ? "next" : undefined}>
                {entry ? <Link href={`/logbook/${entry.slug}`}>{b.label}</Link> : <span>{b.label}</span>}
                {b.id === NEXT_UP ? <small>next up</small> : null}
                {b.done && entry ? <small className="bc-dot">{entry.no}</small> : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="curious" className="bc-section" aria-labelledby="curious-h">
        <div className="bc-section-head">
          <div>
            <span className="bc-eyebrow">{CURIOUS.length} open questions</span>
            <h2 id="curious-h" className="bc-h2">
              Still figuring out
            </h2>
            <p className="bc-read">
              If you know, or think you know, send me your guess. I read every one, and the good ones show up
              under the question.
            </p>
          </div>
        </div>
        <div className="bc-questions">
          {CURIOUS.map((q) => {
            const list = guesses[q.id] ?? [];
            return (
              <article key={q.id} id={q.id} className="bc-question">
                <h3>{q.text}</h3>
                {list.length ? (
                  <ul className="bc-guesses">
                    {list.map((g) => (
                      <li key={g.id}>
                        <p>{g.text}</p>
                        <span>{g.name || "Anonymous"}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <GuessBox questionId={q.id} />
              </article>
            );
          })}
        </div>
      </section>

      <section id="figured-out" className="bc-section" aria-labelledby="factoids-h">
        <div className="bc-section-head">
          <div>
            <span className="bc-eyebrow">Factoids</span>
            <h2 id="factoids-h" className="bc-h2">
              Figured out, usually on a bus
            </h2>
          </div>
        </div>
        <div className="bc-factoids">
          {FACTOIDS.map((f) => {
            const entry = f.entry ? entryBySlug(f.entry) : undefined;
            return (
              <article key={f.id} className="bc-factoid">
                <h3 className="bc-h3">{f.title}</h3>
                <p>{f.body}</p>
                {entry ? (
                  <Link href={`/logbook/${entry.slug}`} className="bc-arrow">
                    From entry {entry.no}, {entry.title}
                  </Link>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
