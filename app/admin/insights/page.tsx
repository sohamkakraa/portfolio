import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { ROUTE_CHAPTERS } from "@/lib/journey/content";
import {
  getDailyTotals,
  getDwell,
  getRanked,
  getTracks,
  getVitals,
  lastDays,
  listSessions,
} from "@/lib/analytics/store";
import { isRedisConfigured } from "@/lib/redis";
import {
  Bars,
  Figure,
  RoadFunnel,
  TrackSpark,
  TrafficChart,
  Vitals,
  type RoadStop,
} from "@/components/admin/insights/charts";
import "./insights.css";

export const metadata = {
  title: "Insights · Soham Kakra",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

const RANGES = [7, 30, 90] as const;

function minutes(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const session = token ? await verifySessionToken(token).catch(() => null) : null;
  // Gated on the server rather than in the client, so an unauthenticated request never receives
  // visitor data in the HTML at all.
  if (!session) redirect("/admin");

  const { days: raw } = await searchParams;
  const span = RANGES.includes(Number(raw) as 7) ? Number(raw) : 30;
  const days = lastDays(span);

  if (!isRedisConfigured()) {
    return (
      <main className="ins">
        <h1 className="ins-title">Insights</h1>
        <p className="ins-empty">
          Redis is not configured, so nothing is being recorded. Set UPSTASH_REDIS_REST_URL and
          UPSTASH_REDIS_REST_TOKEN and this fills in on its own.
        </p>
      </main>
    );
  }

  const [
    totals,
    paths,
    chapters,
    exits,
    friction,
    refs,
    devices,
    geo,
    engine,
    served,
    dwell,
    vitals,
    sessions,
  ] = await Promise.all([
    getDailyTotals(days),
    getRanked(days, "path", 10),
    getRanked(days, "chapter", 12),
    getRanked(days, "exit", 10),
    getRanked(days, "friction", 10),
    getRanked(days, "ref", 8),
    getRanked(days, "dev", 4),
    getRanked(days, "geo", 8),
    getRanked(days, "engine", 6),
    getRanked(days, "served", 2),
    getDwell(days),
    getVitals(days),
    listSessions(days, 40),
  ]);

  const tracks = await getTracks(sessions.map((s) => s.sid));

  const visitors = totals.reduce((s, d) => s + d.visitors, 0);
  const pageviews = totals.reduce((s, d) => s + d.pageviews, 0);
  const reachedByChapter = new Map(
    chapters.map((c) => [c.label.slice(c.label.indexOf(":") + 1), c.count])
  );
  const arrivedOnRoad = paths.find((p) => p.label === "/")?.count ?? 0;

  const stops: RoadStop[] = ROUTE_CHAPTERS.map((c) => ({
    id: c.id,
    label: c.short,
    t: c.t,
    reached: reachedByChapter.get(c.id) ?? 0,
  }));
  const finished = stops.length ? stops[stops.length - 1]!.reached : 0;
  const walkedAny = stops.length ? stops[0]!.reached : 0;

  // The median, because the label says median and because one tab left open all afternoon would
  // drag a mean somewhere useless.
  const lengths = sessions
    .map((s) => Math.max(0, s.lastAt - s.startedAt))
    .sort((a, b) => a - b);
  const medianVisit = lengths.length ? lengths[Math.floor(lengths.length / 2)]! : 0;

  const totalDwell = dwell.reduce((s, d) => s + d.count, 0);

  const servedLocally = served.find((s) => s.label.includes("installed"))?.count ?? 0;
  const servedTotal = served.reduce((s, d) => s + d.count, 0);
  const liteShare = (() => {
    const lite = engine.filter((e) => e.label.includes("lite")).reduce((s, e) => s + e.count, 0);
    const all = engine.reduce((s, e) => s + e.count, 0);
    return all ? Math.round((lite / all) * 100) : null;
  })();

  return (
    <main className="ins">
      <div className="ins-head">
        <div>
          <div className="ins-eyebrow">private · not indexed</div>
          <h1 className="ins-title">What people do here</h1>
          <p className="ins-sub">
            Measured first-party, no third parties, no identifiers kept. The road&apos;s funnel is
            the number that matters: it says which chapter loses people, which is the only honest
            way to find out what to rewrite.
          </p>
        </div>
        <div className="ins-range">
          {RANGES.map((r) => (
            <Link key={r} href={`/admin/insights?days=${r}`} aria-current={r === span}>
              {r}d
            </Link>
          ))}
        </div>
      </div>

      <div className="ins-figures">
        <Figure value={visitors} label="visitors" note={`over ${span} days`} />
        <Figure value={pageviews} label="pageviews" note={visitors ? `${(pageviews / visitors).toFixed(1)} per visitor` : undefined} />
        <Figure value={sessions.length} label="sessions kept" note="most recent, with replay" />
        <Figure value={medianVisit ? minutes(medianVisit) : "—"} label="median visit" note="first to last event" />
        <Figure
          value={walkedAny ? `${Math.round((finished / walkedAny) * 100)}%` : "—"}
          label="walked it all"
          note={`${finished} of ${walkedAny} who started`}
        />
        <Figure value={totalDwell ? minutes(totalDwell * 1000) : "—"} label="time on page" note="tab visible only" />
        <Figure
          value={servedTotal ? `${Math.round((servedLocally / servedTotal) * 100)}%` : "—"}
          label="arrived with it installed"
          note={servedTotal ? `${servedLocally} of ${servedTotal} sessions` : "needs a return visit"}
        />
      </div>

      <section className="ins-section">
        <div className="ins-section-head">
          <h2 className="ins-h2">Traffic</h2>
          <span className="ins-eyebrow">solid: visitors · dashed: pageviews</span>
        </div>
        <TrafficChart days={totals} />
      </section>

      <section className="ins-section">
        <div className="ins-section-head">
          <h2 className="ins-h2">How far down the road</h2>
          <span className="ins-eyebrow">the funnel</span>
        </div>
        <p className="ins-note">
          Each stop is a chapter of the journey, counted once per visitor at the furthest point they
          reached. Where the band narrows sharply is where the writing or the pacing is losing them.
        </p>
        <RoadFunnel stops={stops} starts={arrivedOnRoad || walkedAny} />
      </section>

      <div className="ins-grid-2" style={{ marginTop: "3.5rem" }}>
        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">Friction</h2>
            <span className="ins-eyebrow">rage and dead clicks</span>
          </div>
          <p className="ins-note">
            Somebody clicking a thing that does not respond. A photograph high on this list wants a
            lightbox.
          </p>
          <Bars rows={friction} warn />
        </section>

        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">Doors taken</h2>
            <span className="ins-eyebrow">what gets clicked</span>
          </div>
          <p className="ins-note">
            The front door offers a walk or a shortcut to the work. This says which one strangers
            actually pick.
          </p>
          <Bars rows={exits} />
        </section>

        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">Surfaces</h2>
            <span className="ins-eyebrow">views</span>
          </div>
          <Bars rows={paths} />
        </section>

        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">Attention</h2>
            <span className="ins-eyebrow">seconds, tab visible</span>
          </div>
          <Bars rows={dwell} />
        </section>

        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">Where from</h2>
            <span className="ins-eyebrow">referrer host</span>
          </div>
          <Bars rows={refs} />
        </section>

        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">On what</h2>
            <span className="ins-eyebrow">device · country</span>
          </div>
          <Bars rows={[...devices, ...geo]} />
        </section>

        <section>
          <div className="ins-section-head">
            <h2 className="ins-h2">Whose machine did the work</h2>
            <span className="ins-eyebrow">scene · delivery</span>
          </div>
          <p className="ins-note">
            {liteShare === null
              ? "Once sessions arrive this says which devices ran the real scene and which fell back."
              : `${liteShare}% of visits fell back to the lite scene, meaning their hardware would not carry the WebGL road. If that share climbs on desktop, the scene is asking too much and the fallback needs to become the default rather than the rescue.`}
          </p>
          <Bars rows={[...engine, ...served]} />
        </section>
      </div>

      <section className="ins-section">
        <div className="ins-section-head">
          <h2 className="ins-h2">Speed, as visitors actually experience it</h2>
          <span className="ins-eyebrow">field data</span>
        </div>
        <Vitals vitals={vitals} />
      </section>

      <section className="ins-section">
        <div className="ins-section-head">
          <h2 className="ins-h2">Sessions</h2>
          <span className="ins-eyebrow">newest first</span>
        </div>
        <p className="ins-note">
          The profile is their scroll track — up is further down the page. Play it back and the real
          scene renders at their pace, which is the only way to see a WebGL journey as they saw it.
        </p>
        {sessions.length === 0 ? (
          <p className="ins-empty">
            No sessions recorded in this window. They appear here once a visitor accepts the note at
            the bottom of the page.
          </p>
        ) : (
          <table className="ins-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Track</th>
                <th>Length</th>
                <th>Device</th>
                <th>Scene</th>
                <th>From</th>
                <th>Where</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.sid}>
                  <td className="ins-mono">
                    {new Date(s.startedAt).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    <TrackSpark track={tracks.get(s.sid) ?? []} />
                  </td>
                  <td className="ins-mono">{minutes(Math.max(0, s.lastAt - s.startedAt))}</td>
                  <td>
                    {s.device}
                    {s.reducedMotion ? " · reduced motion" : ""}
                  </td>
                  <td>
                    {s.renderer}
                    {s.onDevice ? " · cached" : ""}
                  </td>
                  <td>{s.ref ?? "direct"}</td>
                  <td>{s.country ?? "—"}</td>
                  <td>
                    <Link className="ins-play" href={`/admin/insights/${s.sid}`}>
                      play →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p style={{ marginTop: "3rem" }}>
        <Link className="ins-back" href="/admin">
          ← back to admin
        </Link>
      </p>
    </main>
  );
}
