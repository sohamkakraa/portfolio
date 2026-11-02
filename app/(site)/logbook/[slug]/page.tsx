import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import TrailProgress from "@/components/basecamp/TrailProgress";
import { LOGBOOK, TAG_LABEL, coverOf, entryBySlug, framesOf } from "@/lib/basecamp/logbook";

export function generateStaticParams() {
  return LOGBOOK.map((e) => ({ slug: e.slug }));
}

export const dynamicParams = false;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const entry = entryBySlug((await params).slug);
  if (!entry) return {};
  const cover = coverOf(entry);
  return {
    title: `${entry.no} ${entry.title}, ${entry.when}`,
    description: entry.note,
    alternates: { canonical: `/logbook/${entry.slug}` },
    openGraph: cover ? { images: [{ url: cover.src, width: cover.w, height: cover.h }] } : undefined,
  };
}

export default async function EntryPage({ params }: Params) {
  const entry = entryBySlug((await params).slug);
  if (!entry) notFound();

  const index = LOGBOOK.indexOf(entry);
  const prev = LOGBOOK[index - 1];
  const next = LOGBOOK[index + 1];
  const photoCount = framesOf(entry).length;

  return (
    <div className="bc-wrap">
      <header className="bc-page-head">
        <Link href="/logbook" className="bc-back">
          ← Logbook
        </Link>
        <span className="bc-eyebrow">
          Entry <span className="bc-dot">{entry.no}</span> · <span className="bc-dot">{entry.when}</span>
        </span>
        <div className="bc-entry-head">
          <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
            <h1 className="bc-h1">{entry.title}</h1>
            <div className="bc-entry-facts">
              <span>
                <strong>{entry.region}</strong>
              </span>
              {entry.company ? <span>{entry.company}</span> : null}
              <span>
                {entry.stops.length} stops · {photoCount ? `${photoCount} photos` : "photos soon"}
              </span>
            </div>
          </div>
          <div className="bc-entry-fig">
            <span className="bc-dot">{entry.figure.value}</span>
            <span className="bc-figure-label">{entry.figure.label}</span>
          </div>
        </div>
        <p className="bc-read bc-lede">{entry.note}</p>
        <div className="bc-tags">
          {entry.tags.map((t) => (
            <span key={t} className={`bc-tag bc-tag--${t}`}>
              {TAG_LABEL[t]}
            </span>
          ))}
        </div>
        {entry.story ? (
          <div className="bc-hero-actions">
            <Link href={entry.story.href} className="bc-btn">
              Read the story: {entry.story.title}
            </Link>
          </div>
        ) : null}
      </header>

      <section aria-label="The trail" style={{ paddingBlock: "clamp(24px, 4vw, 48px) clamp(48px, 7vw, 88px)" }}>
        <TrailProgress>
          {entry.stops.map((stop, i) => (
            <li key={stop.place} className="bc-stop">
              <span className="bc-stop-marker" aria-hidden />
              <div className="bc-stop-head">
                <span className="bc-dot">{String(i + 1).padStart(2, "0")}</span>
                <h2 className="bc-stop-place">{stop.place}</h2>
              </div>
              {stop.note ? <p className="bc-stop-note">{stop.note}</p> : null}
              {stop.frames.length ? (
                <>
                  {stop.frames.slice(0, 1).map((f) => (
                    <div
                      key={f.src}
                      className={`bc-frame bc-frame-lead${f.h > f.w ? " is-portrait" : ""}`}
                      style={{ ["--ar" as string]: `${f.w} / ${f.h}` }}
                    >
                      <Image
                        src={f.src}
                        alt={`${f.place}, ${entry.when}`}
                        fill
                        sizes={f.h > f.w ? "520px" : "(max-width: 1120px) 90vw, 1000px"}
                        priority={i === 0}
                      />
                    </div>
                  ))}
                  {stop.frames.length > 1 ? (
                    <div className="bc-frames-rest">
                      {stop.frames.slice(1).map((f) => (
                        <div key={f.src} className="bc-frame" style={{ ["--ar" as string]: `${f.w} / ${f.h}` }}>
                          <Image src={f.src} alt={`${f.place}, ${entry.when}`} fill sizes="(max-width: 700px) 50vw, 340px" />
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="bc-stop-empty">No photos from here on the site yet.</p>
              )}
            </li>
          ))}
        </TrailProgress>
      </section>

      <nav className="bc-entry-nav" aria-label="More entries">
        {prev ? (
          <Link href={`/logbook/${prev.slug}`}>
            <span className="bc-eyebrow">
              ← Before · <span className="bc-dot">{prev.no}</span>
            </span>
            <strong>{prev.title}</strong>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/logbook/${next.slug}`} className="next">
            <span className="bc-eyebrow">
              After · <span className="bc-dot">{next.no}</span> →
            </span>
            <strong>{next.title}</strong>
          </Link>
        ) : null}
      </nav>
    </div>
  );
}
