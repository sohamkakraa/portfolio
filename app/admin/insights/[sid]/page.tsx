import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { getSession } from "@/lib/analytics/store";
import Replay from "@/components/admin/insights/Replay";
import "../insights.css";

export const metadata = {
  title: "Replay · Soham Kakra",
  robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";

export default async function ReplayPage({ params }: { params: Promise<{ sid: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  const session = token ? await verifySessionToken(token).catch(() => null) : null;
  if (!session) redirect("/admin");

  const { sid } = await params;
  const record = await getSession(sid);
  if (!record) notFound();

  const scrolls = record.events.filter((e) => e.k === "scroll").length;
  const deepest = record.events.reduce((m, e) => (e.k === "scroll" ? Math.max(m, e.p) : m), 0);

  return (
    <main className="ins">
      <div className="ins-head">
        <div>
          <div className="ins-eyebrow">
            {new Date(record.startedAt).toLocaleString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
          <h1 className="ins-title">One visit, replayed</h1>
          <p className="ins-sub">
            {[
              `${record.device} at ${record.viewport[0]}×${record.viewport[1]}`,
              `${record.renderer} scene`,
              `${record.theme} theme`,
              record.ref ? `arrived from ${record.ref}` : "no referrer",
              record.country,
              record.reducedMotion ? "asked for reduced motion" : null,
            ]
              .filter(Boolean)
              .join(" · ")}
            . Reached {Math.round(deepest * 100)}% of the page across {scrolls} scroll samples.
          </p>
        </div>
        <div className="ins-range">
          <Link href="/admin/insights">← all sessions</Link>
        </div>
      </div>

      <Replay session={record} />
    </main>
  );
}
