import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import TripSignup from "@/components/basecamp/TripSignup";
import { TAG_LABEL, coverOf, newestFirst } from "@/lib/basecamp/logbook";
import { BUCKET, CURIOUS, FACTOIDS, INTRO, NEXT_UP, WISHLIST } from "@/lib/basecamp/lists";

export const metadata: Metadata = {
  title: { absolute: "Soham Kakra" },
  description: `${INTRO.line} ${INTRO.body}`,
  alternates: { canonical: "/" },
};

const HERO = {
  src: "/photography-webp/astrophotography/Nagaru%20Night%20Sky.webp",
  alt: "Snow-covered Himalayan peaks under a sky full of stars, with a few village lights in the valley below",
  place: "Nagaru, Sar Pass trek",
  when: "May 2023",
};

export default function BasecampPage() {
  const entries = newestFirst();
  const latest = entries.find((e) => e.story) ?? entries[0];
  const latestCover = coverOf(latest);
  const recent = entries.filter((e) => e.slug !== latest.slug).slice(0, 4);
  const done = BUCKET.filter((b) => b.done).length;
  const next = BUCKET.find((b) => b.id === NEXT_UP);
  const northernLights = WISHLIST[0].places[0];

  return (
    <>
      <div className="bc-wrap">
        <section className="bc-hero" aria-labelledby="hello">
          <div className="bc-hero-copy">
            <span className="bc-eyebrow">Basecamp</span>
            <h1 id="hello" className="bc-h1">
              Hi, I&apos;m Soham.
            </h1>
            <p className="bc-hero-line">{INTRO.line}</p>
            <p className="bc-read bc-lede">{INTRO.body}</p>
            <p className="bc-read">
              This is where I come back to between trips. The logbook has every trip so far, the lists
              have what I still want to do and what I&apos;m still figuring out, and you&apos;re welcome to
              help with either.
            </p>
            <div className="bc-hero-actions">
              <Link href="/logbook" className="bc-btn">
                Open the logbook
              </Link>
              <Link href="/lists" className="bc-arrow">
                The lists
              </Link>
            </div>
          </div>
          <figure className="bc-hero-photo">
            <div className="bc-frame">
              <Image src={HERO.src} alt={HERO.alt} fill priority sizes="(max-width: 820px) 100vw, 45vw" style={{ objectPosition: "50% 64%" }} />
            </div>
            <figcaption className="bc-caption">
              <span>{HERO.place}</span>
              <span className="bc-dot">{HERO.when}</span>
            </figcaption>
          </figure>
        </section>
      </div>

      <section className="bc-section" aria-labelledby="camp">
        <div className="bc-wrap">
          <div className="bc-section-head">
            <div>
              <span className="bc-eyebrow">At camp right now</span>
              <h2 id="camp" className="bc-h2">
                What&apos;s going on
              </h2>
            </div>
          </div>

          <div className="bc-board">
            <article className="bc-card bc-card--latest">
              {latestCover ? (
                <div className="bc-frame">
                  <Image src={latestCover.src} alt={`${latest.title}, ${latestCover.place}`} fill sizes="(max-width: 980px) 100vw, 40vw" />
                </div>
              ) : null}
              <div className="bc-card-body">
                <span className="bc-eyebrow">
                  Latest entry · <span className="bc-dot">{latest.no}</span>
                </span>
                <h3 className="bc-h2" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)" }}>
                  {latest.title}
                </h3>
                <p className="bc-read" style={{ fontSize: "1.02rem" }}>
                  {latest.note}
                </p>
                <div>
                  <div className="bc-dot bc-figure">{latest.figure.value}</div>
                  <div className="bc-figure-label">{latest.figure.label}</div>
                </div>
                <div className="bc-hero-actions" style={{ marginTop: 0 }}>
                  {latest.story ? (
                    <Link href={latest.story.href} className="bc-btn">
                      Read the story
                    </Link>
                  ) : null}
                  <Link href={`/logbook/${latest.slug}`} className="bc-arrow">
                    Walk the trail
                  </Link>
                </div>
              </div>
            </article>

            <article className="bc-card bc-card--bucket">
              <span className="bc-eyebrow">Bucket list</span>
              <div>
                <span className="bc-dot bc-figure">
                  {done}/{BUCKET.length}
                </span>
                <div className="bc-figure-label">ticked off</div>
              </div>
              <div className="bc-dots" aria-hidden>
                {BUCKET.map((b) => (
                  <span key={b.id} className={b.done ? "on" : undefined} />
                ))}
              </div>
              {next ? (
                <p className="bc-read" style={{ fontSize: "1rem" }}>
                  Next up: <strong style={{ color: "var(--ink)" }}>{next.label.toLowerCase()}</strong>.
                </p>
              ) : null}
              <Link href="/lists#bucket" className="bc-arrow">
                The whole list
              </Link>
            </article>

            <article className="bc-card bc-card--curious">
              <span className="bc-eyebrow">Still figuring out</span>
              <ul>
                {CURIOUS.slice(0, 3).map((q) => (
                  <li key={q.id}>{q.text}</li>
                ))}
              </ul>
              <Link href="/lists#curious" className="bc-arrow">
                Know the answer? Send a guess
              </Link>
            </article>

            <article className="bc-card bc-card--factoid">
              <span className="bc-eyebrow">Figured out on a bus</span>
              <h3 className="bc-h3">{FACTOIDS[0].title}</h3>
              <p className="bc-read" style={{ fontSize: "1.02rem" }}>
                {FACTOIDS[0].body}
              </p>
              <Link href="/lists#figured-out" className="bc-arrow">
                More factoids
              </Link>
            </article>

            <article className="bc-card bc-card--next">
              <span className="bc-eyebrow">Where next</span>
              <h3 className="bc-h2" style={{ fontSize: "clamp(1.4rem, 2.8vw, 1.9rem)" }}>
                Chasing the northern lights
              </h3>
              <p className="bc-read" style={{ fontSize: "1.02rem" }}>
                {northernLights.name}. Nothing booked yet. If you&apos;d like to come, or to argue about where to
                go, leave your email.
              </p>
              <div className="bc-hero-actions" style={{ marginTop: 0, alignItems: "start" }}>
                <TripSignup placeId={northernLights.id} placeName="the northern lights" />
                <Link href="/places" className="bc-arrow">
                  Everywhere else on the list
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bc-section" aria-labelledby="recent">
        <div className="bc-wrap">
          <div className="bc-section-head">
            <div>
              <span className="bc-eyebrow">From the logbook</span>
              <h2 id="recent" className="bc-h2">
                Recent entries
              </h2>
            </div>
            <Link href="/logbook" className="bc-arrow">
              All {entries.length} entries
            </Link>
          </div>
          <ol className="bc-log">
            {recent.map((e) => (
              <li key={e.slug}>
                <Link href={`/logbook/${e.slug}`} className="bc-log-row" style={{ gridTemplateColumns: "56px minmax(0, 1fr) auto" }}>
                  <span className="bc-dot bc-no">{e.no}</span>
                  <span className="bc-log-body">
                    <span className="bc-log-title">{e.title}</span>
                    <span className="bc-log-meta">
                      {e.when} · {e.region}
                    </span>
                    <span className="bc-tags">
                      {e.tags.map((t) => (
                        <span key={t} className={`bc-tag bc-tag--${t}`}>
                          {TAG_LABEL[t]}
                        </span>
                      ))}
                    </span>
                  </span>
                  <span className="bc-log-fig">
                    <span className="bc-dot">{e.figure.value}</span>
                    <span className="bc-figure-label">{e.figure.label}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bc-section" aria-labelledby="work">
        <div className="bc-wrap" style={{ display: "grid", gap: 12 }}>
          <span className="bc-eyebrow">The quiet tent</span>
          <h2 id="work" className="bc-h3" style={{ fontSize: "1.35rem" }}>
            I&apos;m an AI engineer and a Talent Lab resident at Prosus in Amsterdam.
          </h2>
          <Link href="/work" className="bc-arrow">
            Work, projects and CV
          </Link>
        </div>
      </section>
    </>
  );
}
