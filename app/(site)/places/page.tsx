import type { Metadata } from "next";
import Link from "next/link";
import TripSignup from "@/components/basecamp/TripSignup";
import { LOGBOOK } from "@/lib/basecamp/logbook";
import { WISHLIST } from "@/lib/basecamp/lists";

export const metadata: Metadata = {
  title: "Places",
  description: "Where I've been, and where I want to go next. Tell me if you'd like to come along.",
  alternates: { canonical: "/places" },
};

export default function PlacesPage() {
  const count = WISHLIST.reduce((n, g) => n + g.places.length, 0);

  return (
    <div className="bc-wrap">
      <header className="bc-page-head">
        <span className="bc-eyebrow">The map on the tent wall</span>
        <h1 className="bc-h1">Places</h1>
        <p className="bc-read bc-lede">
          Where I&apos;ve been so far, and the much longer list of where I want to go. If one of them is on your
          list too, say so. One day these might turn into group trips, for like-minded people and for people
          who want to argue with me the whole way.
        </p>
      </header>

      <section className="bc-section" aria-labelledby="been-h">
        <div className="bc-section-head">
          <div>
            <span className="bc-eyebrow">
              <span className="bc-dot">{LOGBOOK.length}</span> trips logged
            </span>
            <h2 id="been-h" className="bc-h2">
              Been
            </h2>
          </div>
        </div>
        <div className="bc-been">
          {LOGBOOK.map((e) => (
            <Link key={e.slug} href={`/logbook/${e.slug}`}>
              <span className="bc-dot">{e.no}</span>
              {e.title}
            </Link>
          ))}
        </div>
      </section>

      <section className="bc-section" aria-labelledby="next-h">
        <div className="bc-section-head">
          <div>
            <span className="bc-eyebrow">
              <span className="bc-dot">{count}</span> on the list
            </span>
            <h2 id="next-h" className="bc-h2">
              Where next
            </h2>
          </div>
        </div>
        {WISHLIST.map((group) => (
          <div key={group.region} className="bc-place-group">
            <h3 className="bc-eyebrow">{group.region}</h3>
            <ul className="bc-places">
              {group.places.map((p) => (
                <li key={p.id} className="bc-place">
                  <h3>{p.name}</h3>
                  {p.why ? <p>{p.why}</p> : null}
                  <TripSignup placeId={p.id} placeName={p.name} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
