import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import StarTrailsMark from "@/components/StarTrailsMark";
import { LOGBOOK, TAG_LABEL, coverOf, framesOf, newestFirst } from "@/lib/basecamp/logbook";

export const metadata: Metadata = {
  title: "Logbook",
  description: "Every trip so far, from Kenya in 2021 to the Alps in 2026: where, when, who came along, and a trail of photos for each.",
  alternates: { canonical: "/logbook" },
};

export default function LogbookPage() {
  const entries = newestFirst();
  const first = LOGBOOK[0];

  return (
    <div className="bc-wrap">
      <header className="bc-page-head">
        <span className="bc-eyebrow">
          Logbook · <span className="bc-dot">{String(LOGBOOK.length).padStart(3, "0")}</span> entries
        </span>
        <h1 className="bc-h1">Every trip so far</h1>
        <p className="bc-read bc-lede">
          From {first.title} in {first.when} to now. Each entry is a trail you can walk through, stop by stop,
          with the photos from each place.
        </p>
      </header>

      <ol className="bc-log">
        {entries.map((e) => {
          const cover = coverOf(e);
          const count = framesOf(e).length;
          return (
            <li key={e.slug}>
              <Link href={`/logbook/${e.slug}`} className="bc-log-row">
                <span className="bc-dot bc-no">{e.no}</span>
                {cover ? (
                  <span className="bc-frame bc-log-thumb">
                    <Image src={cover.src} alt="" fill sizes="168px" />
                  </span>
                ) : (
                  <span className="bc-frame bc-log-thumb bc-log-thumb--empty">
                    <StarTrailsMark size={40} />
                  </span>
                )}
                <span className="bc-log-body">
                  <span className="bc-log-title">{e.title}</span>
                  <span className="bc-log-meta">
                    {e.when} · {e.region}
                    {e.company ? ` · ${e.company}` : ""}
                  </span>
                  <span className="bc-log-note">{e.note}</span>
                  <span className="bc-tags">
                    {e.tags.map((t) => (
                      <span key={t} className={`bc-tag bc-tag--${t}`}>
                        {TAG_LABEL[t]}
                      </span>
                    ))}
                    {e.story ? <span className="bc-tag bc-tag--night">story</span> : null}
                    <span className="bc-tag">{count ? `${count} photos` : "photos soon"}</span>
                  </span>
                </span>
                <span className="bc-log-fig">
                  <span className="bc-dot">{e.figure.value}</span>
                  <span className="bc-figure-label">{e.figure.label}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
