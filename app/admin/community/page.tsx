import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { allSignups, approvedGuesses, communityReady, pendingGuesses, type Guess } from "@/lib/basecamp/community";
import { ALL_PLACES, CURIOUS } from "@/lib/basecamp/lists";
import { approve, remove, removeSignup } from "./actions";
import "./community.css";

export const metadata = { title: "Community", robots: "noindex, nofollow" };
export const dynamic = "force-dynamic";

const question = (id: string) => CURIOUS.find((q) => q.id === id)?.text ?? id;
const place = (id: string) => ALL_PLACES.find((p) => p.id === id)?.name ?? id;
const when = (at: number) =>
  new Date(at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function GuessRow({ g, pending }: { g: Guess; pending: boolean }) {
  return (
    <li className="cm-row">
      <div className="cm-q">{question(g.questionId)}</div>
      <p className="cm-text">{g.text}</p>
      <div className="cm-meta">
        {g.name || "Anonymous"} · {when(g.at)}
      </div>
      <div className="cm-actions">
        {pending ? (
          <form action={approve}>
            <input type="hidden" name="id" value={g.id} />
            <button className="cm-btn cm-btn--yes">Approve</button>
          </form>
        ) : null}
        <form action={remove}>
          <input type="hidden" name="id" value={g.id} />
          <button className="cm-btn">{pending ? "Delete" : "Take down"}</button>
        </form>
      </div>
    </li>
  );
}

export default async function CommunityPage() {
  const token = (await cookies()).get("admin_session")?.value;
  const session = token ? await verifySessionToken(token).catch(() => null) : null;
  if (!session) redirect("/admin");

  if (!communityReady()) {
    return (
      <main className="cm">
        <h1>Community</h1>
        <p className="cm-empty">Redis is not configured, so guesses and signups can&apos;t be stored yet.</p>
      </main>
    );
  }

  const [pending, approved, signups] = await Promise.all([pendingGuesses(), approvedGuesses(), allSignups()]);
  const byPlace = new Map<string, typeof signups>();
  for (const s of signups) byPlace.set(s.placeId, [...(byPlace.get(s.placeId) ?? []), s]);

  return (
    <main className="cm">
      <div className="cm-head">
        <h1>Community</h1>
        <nav>
          <Link href="/admin">Admin</Link>
          <Link href="/admin/insights">Insights</Link>
          <Link href="/lists">See it live</Link>
        </nav>
      </div>

      <section>
        <h2>Waiting for you ({pending.length})</h2>
        {pending.length ? (
          <ul className="cm-list">{pending.map((g) => <GuessRow key={g.id} g={g} pending />)}</ul>
        ) : (
          <p className="cm-empty">No new guesses. Unreviewed ones expire after 90 days.</p>
        )}
      </section>

      <section>
        <h2>On the site ({approved.length})</h2>
        {approved.length ? (
          <ul className="cm-list">{approved.map((g) => <GuessRow key={g.id} g={g} pending={false} />)}</ul>
        ) : (
          <p className="cm-empty">Nothing approved yet.</p>
        )}
      </section>

      <section>
        <h2>Trip signups ({signups.length})</h2>
        <p className="cm-note">Private. Only use these to write about the trip they signed up for.</p>
        {byPlace.size ? (
          [...byPlace.entries()].map(([placeId, list]) => (
            <div key={placeId} className="cm-place">
              <h3>
                {place(placeId)} <span>{list.length}</span>
              </h3>
              <ul className="cm-list">
                {list.map((s) => (
                  <li key={s.email} className="cm-row cm-row--signup">
                    <span className="cm-email">{s.email}</span>
                    <span className="cm-meta">{when(s.at)}</span>
                    <form action={removeSignup}>
                      <input type="hidden" name="placeId" value={placeId} />
                      <input type="hidden" name="email" value={s.email} />
                      <button className="cm-btn">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="cm-empty">No signups yet.</p>
        )}
      </section>
    </main>
  );
}
