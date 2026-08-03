import { createHash } from "node:crypto";
import { getRedis, isRedisConfigured } from "@/lib/redis";
import {
  LIMITS,
  vitalBucket,
  type AnalyticsEvent,
  type Batch,
  type DeviceType,
  type SessionHello,
  type StoredSession,
} from "./schema";

/**
 * Redis layout. Every write is O(1) so ingest cost does not grow with history, and every dashboard
 * read is a handful of range queries rather than a scan over sessions.
 *
 *   an:days                  ZSET  day -> last write, so the dashboard knows which days exist
 *   an:d:<day>:pv            counter, pageviews
 *   an:d:<day>:uv            HyperLogLog of visitor hashes, unique visitors in ~12KB flat
 *   an:d:<day>:path|ref|dev  ZSET  value -> count
 *   an:d:<day>:engine        ZSET  "device · scene" -> sessions, which devices get the full scene
 *   an:d:<day>:served        ZSET  their device or the server -> sessions
 *   an:d:<day>:geo           ZSET  country -> count
 *   an:d:<day>:chapter       ZSET  chapter -> sessions that reached it, the road's funnel
 *   an:d:<day>:exit          ZSET  label -> clicks, which doors people actually take
 *   an:d:<day>:friction      ZSET  "kind label" -> count
 *   an:d:<day>:dwell         HASH  chapter -> seconds, summed
 *   an:d:<day>:v:<metric>    ZSET  bucket -> count, plus sum/n on an:d:<day>:vsum
 *   an:idx:<day>             ZSET  sid -> startedAt, the session list
 *   an:s:<sid>:m             HASH  session meta
 *   an:s:<sid>:e             LIST  events as JSON, appended, trimmed
 *
 * Sessions expire; rollups are kept, because they are tiny and are the long record.
 */

const TTL = LIMITS.sessionTtlDays * 24 * 60 * 60;
const MAX_EVENTS_PER_SESSION = 4000;

export const dayKey = (at: number | Date = Date.now()): string =>
  new Date(at).toISOString().slice(0, 10);

/**
 * A stable per-visitor value that is not an identity. IP and user agent are salted and hashed on
 * the server, truncated, and used only to add to a HyperLogLog; the raw values are never written
 * anywhere. Without a salt the hash would be reversible by brute force over the IPv4 space.
 */
export function visitorHash(ip: string, ua: string): string {
  const salt = process.env.ANALYTICS_SALT || process.env.JWT_SECRET || "";
  return createHash("sha256").update(`${salt}:${ip}:${ua}`).digest("hex").slice(0, 24);
}

export type IngestContext = {
  visitor: string;
  country?: string;
  day: string;
};

/** True when a visitor has sent more batches this minute than the contract allows. */
export async function overBatchLimit(visitor: string): Promise<boolean> {
  if (!isRedisConfigured()) return false;
  const redis = getRedis();
  const key = `an:rl:${visitor}:${Math.floor(Date.now() / 60000)}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 120);
  return n > LIMITS.batchesPerMinutePerVisitor;
}

export async function recordBatch(batch: Batch, ctx: IngestContext): Promise<void> {
  if (!isRedisConfigured()) return;
  const redis = getRedis();
  const p = redis.pipeline();
  const day = ctx.day;
  const meta = `an:s:${batch.sid}:m`;
  const events = `an:s:${batch.sid}:e`;

  p.zadd("an:days", { score: Date.now(), member: day });

  if (batch.hello) {
    const h = batch.hello;
    p.hset(meta, {
      sid: h.sid,
      startedAt: h.startedAt,
      device: h.device,
      renderer: h.renderer,
      viewport: `${h.viewport[0]}x${h.viewport[1]}`,
      reducedMotion: h.reducedMotion ? 1 : 0,
      onDevice: h.onDevice ? 1 : 0,
      theme: h.theme,
      ...(h.tz ? { tz: h.tz } : {}),
      ...(h.ref ? { ref: h.ref } : {}),
      ...(ctx.country ? { country: ctx.country } : {}),
    });
    p.zadd(`an:idx:${day}`, { score: h.startedAt, member: h.sid });
    p.pfadd(`an:d:${day}:uv`, ctx.visitor);
    p.zincrby(`an:d:${day}:dev`, 1, h.device);
    // Which machine did the work. Crossed with device because the useful question is not the overall
    // split but which devices keep falling back to the lite scene.
    p.zincrby(`an:d:${day}:engine`, 1, `${h.device} · ${h.renderer} scene`);
    p.zincrby(`an:d:${day}:served`, 1, h.onDevice ? "arrived with it installed" : "first arrival");
    p.zincrby(`an:d:${day}:ref`, 1, h.ref || "direct");
    if (ctx.country) p.zincrby(`an:d:${day}:geo`, 1, ctx.country);
    p.expire(`an:idx:${day}`, TTL);
  }

  p.hset(meta, { lastAt: Date.now() });

  if (batch.events.length) {
    p.rpush(events, ...batch.events.map((e) => JSON.stringify(e)));
    p.ltrim(events, -MAX_EVENTS_PER_SESSION, -1);
  }
  p.expire(meta, TTL);
  p.expire(events, TTL);

  for (const e of batch.events) rollUp(p, day, e);

  await p.exec();
}

type Pipeline = ReturnType<ReturnType<typeof getRedis>["pipeline"]>;

function rollUp(p: Pipeline, day: string, e: AnalyticsEvent): void {
  switch (e.k) {
    case "view":
      p.incr(`an:d:${day}:pv`);
      p.zincrby(`an:d:${day}:path`, 1, e.path);
      break;
    case "chapter":
      // The collector emits a chapter only when the furthest reached advances, so this counts
      // each chapter once per session and the ZSET reads as a funnel without deduplication here.
      p.zincrby(`an:d:${day}:chapter`, 1, `${e.i}:${e.id}`);
      break;
    case "click":
      p.zincrby(`an:d:${day}:exit`, 1, e.to ? `${e.label} -> ${e.to}` : e.label);
      break;
    case "photo":
      p.zincrby(`an:d:${day}:photo`, 1, e.src);
      break;
    case "friction":
      p.zincrby(`an:d:${day}:friction`, 1, `${e.kind} · ${e.path} · ${e.label}`);
      break;
    case "vital":
      p.zincrby(`an:d:${day}:v:${e.name}`, 1, vitalBucket(e.name, e.value));
      p.hincrbyfloat(`an:d:${day}:vsum`, `${e.name}:sum`, e.value);
      p.hincrbyfloat(`an:d:${day}:vsum`, `${e.name}:n`, 1);
      break;
    case "leave":
      p.hincrbyfloat(`an:d:${day}:dwell`, e.path, Math.round(e.ms / 1000));
      break;
    case "scroll":
      // Deliberately not rolled up. Scroll is the replay track and is read per session.
      break;
  }
}

/* ── Reads, for the dashboard ─────────────────────────────────────────── */

export type DayTotals = {
  day: string;
  pageviews: number;
  visitors: number;
};

export type Ranked = { label: string; count: number };

const rank = (raw: unknown[]): Ranked[] => {
  const out: Ranked[] = [];
  for (let i = 0; i < raw.length; i += 2) {
    out.push({ label: String(raw[i]), count: Number(raw[i + 1]) });
  }
  return out.sort((a, b) => b.count - a.count);
};

export function lastDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(dayKey(Date.now() - i * 86400000));
  }
  return days;
}

export async function getDailyTotals(days: string[]): Promise<DayTotals[]> {
  if (!isRedisConfigured()) return days.map((day) => ({ day, pageviews: 0, visitors: 0 }));
  const redis = getRedis();
  const p = redis.pipeline();
  for (const day of days) {
    p.get(`an:d:${day}:pv`);
    p.pfcount(`an:d:${day}:uv`);
  }
  const res = await p.exec<(number | string | null)[]>();
  return days.map((day, i) => ({
    day,
    pageviews: Number(res[i * 2] ?? 0),
    visitors: Number(res[i * 2 + 1] ?? 0),
  }));
}

/** Merges one ZSET dimension across a range of days. */
export async function getRanked(days: string[], dim: string, limit = 12): Promise<Ranked[]> {
  if (!isRedisConfigured()) return [];
  const redis = getRedis();
  const p = redis.pipeline();
  for (const day of days) {
    p.zrange(`an:d:${day}:${dim}`, 0, -1, { withScores: true });
  }
  const res = await p.exec<unknown[][]>();
  const totals = new Map<string, number>();
  for (const row of res) {
    for (const { label, count } of rank(row ?? [])) {
      totals.set(label, (totals.get(label) ?? 0) + count);
    }
  }
  return [...totals]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getDwell(days: string[]): Promise<Ranked[]> {
  if (!isRedisConfigured()) return [];
  const redis = getRedis();
  const p = redis.pipeline();
  for (const day of days) p.hgetall(`an:d:${day}:dwell`);
  const res = await p.exec<(Record<string, string> | null)[]>();
  const totals = new Map<string, number>();
  for (const row of res) {
    for (const [k, v] of Object.entries(row ?? {})) {
      totals.set(k, (totals.get(k) ?? 0) + Number(v));
    }
  }
  return [...totals].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export type VitalSummary = { name: string; mean: number; n: number; buckets: Ranked[] };

export async function getVitals(days: string[]): Promise<VitalSummary[]> {
  if (!isRedisConfigured()) return [];
  const redis = getRedis();
  const names = ["LCP", "INP", "CLS", "FCP", "TTFB"];
  const p = redis.pipeline();
  for (const day of days) {
    p.hgetall(`an:d:${day}:vsum`);
    for (const n of names) p.zrange(`an:d:${day}:v:${n}`, 0, -1, { withScores: true });
  }
  const res = await p.exec<unknown[]>();

  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  const buckets = new Map<string, Map<string, number>>();
  const stride = 1 + names.length;

  days.forEach((_, dayIndex) => {
    const base = dayIndex * stride;
    const vsum = (res[base] ?? {}) as Record<string, string>;
    for (const [k, v] of Object.entries(vsum)) {
      const [name, field] = k.split(":");
      const target = field === "sum" ? sums : counts;
      target.set(name, (target.get(name) ?? 0) + Number(v));
    }
    names.forEach((name, i) => {
      const row = (res[base + 1 + i] ?? []) as unknown[];
      const map = buckets.get(name) ?? new Map<string, number>();
      for (const { label, count } of rank(row)) map.set(label, (map.get(label) ?? 0) + count);
      buckets.set(name, map);
    });
  });

  return names
    .map((name) => {
      const n = counts.get(name) ?? 0;
      return {
        name,
        n,
        mean: n ? (sums.get(name) ?? 0) / n : 0,
        buckets: [...(buckets.get(name) ?? new Map())]
          .map(([label, count]) => ({ label, count: Number(count) }))
          .sort((a, b) => a.label.localeCompare(b.label)),
      };
    })
    .filter((v) => v.n > 0);
}

export type SessionSummary = {
  sid: string;
  startedAt: number;
  lastAt: number;
  device: DeviceType;
  renderer: string;
  country?: string;
  ref?: string;
  theme: string;
  viewport: string;
  reducedMotion: boolean;
  onDevice: boolean;
  eventCount: number;
};

export async function listSessions(days: string[], limit = 60): Promise<SessionSummary[]> {
  if (!isRedisConfigured()) return [];
  const redis = getRedis();
  const idx = redis.pipeline();
  for (const day of days) idx.zrange(`an:idx:${day}`, 0, -1, { rev: true, withScores: true });
  const rows = await idx.exec<unknown[][]>();

  const sids: string[] = [];
  for (const row of rows) {
    for (let i = 0; i < (row ?? []).length; i += 2) sids.push(String(row[i]));
  }
  if (!sids.length) return [];

  const recent = sids.slice(0, limit);
  const p = redis.pipeline();
  for (const sid of recent) {
    p.hgetall(`an:s:${sid}:m`);
    p.llen(`an:s:${sid}:e`);
  }
  const res = await p.exec<unknown[]>();

  return recent
    .map((sid, i): SessionSummary | null => {
      const m = (res[i * 2] ?? null) as Record<string, string> | null;
      if (!m || !m.startedAt) return null;
      return {
        sid,
        startedAt: Number(m.startedAt),
        lastAt: Number(m.lastAt ?? m.startedAt),
        device: (m.device ?? "desktop") as DeviceType,
        renderer: m.renderer ?? "full",
        country: m.country,
        ref: m.ref,
        theme: m.theme ?? "dark",
        viewport: m.viewport ?? "",
        reducedMotion: m.reducedMotion === "1",
        onDevice: m.onDevice === "1",
        eventCount: Number(res[i * 2 + 1] ?? 0),
      };
    })
    .filter((s): s is SessionSummary => s !== null)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/**
 * Downsampled scroll tracks for a set of sessions, for the sparkline in the list. Pipelined into
 * one round trip, and thinned to a fixed number of points so a long visit costs no more than a
 * short one to draw.
 */
export async function getTracks(sids: string[], points = 24): Promise<Map<string, number[]>> {
  const out = new Map<string, number[]>();
  if (!isRedisConfigured() || !sids.length) return out;
  const redis = getRedis();
  const p = redis.pipeline();
  for (const sid of sids) p.lrange(`an:s:${sid}:e`, 0, -1);
  const res = await p.exec<(string[] | null)[]>();

  sids.forEach((sid, i) => {
    const track: number[] = [];
    for (const line of res[i] ?? []) {
      try {
        const e = typeof line === "string" ? JSON.parse(line) : line;
        if (e?.k === "scroll") track.push(e.p);
      } catch {
        // Skip an unreadable row rather than lose the whole track.
      }
    }
    if (track.length <= points) {
      out.set(sid, track);
      return;
    }
    const step = track.length / points;
    out.set(
      sid,
      Array.from({ length: points }, (_, j) => track[Math.min(track.length - 1, Math.floor(j * step))]!)
    );
  });

  return out;
}

export async function getSession(sid: string): Promise<StoredSession | null> {
  if (!isRedisConfigured() || !/^[a-z0-9]+$/i.test(sid)) return null;
  const redis = getRedis();
  const [m, raw] = await Promise.all([
    redis.hgetall<Record<string, string>>(`an:s:${sid}:m`),
    redis.lrange<string>(`an:s:${sid}:e`, 0, -1),
  ]);
  if (!m || !m.startedAt) return null;

  const events: AnalyticsEvent[] = [];
  for (const line of raw ?? []) {
    try {
      events.push(typeof line === "string" ? JSON.parse(line) : (line as AnalyticsEvent));
    } catch {
      // A single malformed row should not cost the whole replay.
    }
  }

  const [vw, vh] = (m.viewport ?? "0x0").split("x").map(Number);
  const hello: SessionHello = {
    sid,
    startedAt: Number(m.startedAt),
    tz: m.tz,
    ref: m.ref,
    device: (m.device ?? "desktop") as DeviceType,
    renderer: m.renderer === "lite" ? "lite" : "full",
    viewport: [vw || 0, vh || 0],
    reducedMotion: m.reducedMotion === "1",
    theme: m.theme === "light" ? "light" : "dark",
    onDevice: m.onDevice === "1",
  };

  return { ...hello, country: m.country, lastAt: Number(m.lastAt ?? m.startedAt), events };
}
