/**
 * The measurement contract, shared by the collector in the browser and the ingest route.
 *
 * Two decisions are baked in here and worth stating once.
 *
 * There is no DOM recording. The homepage is a WebGL canvas, and a DOM recorder cannot see inside
 * one: with rrweb's canvas capture enabled it emitted zero canvas events and recorded the node as
 * an empty `<canvas class="lab-canvas">`, at ~287KB per ninety-second visit. A replay of the road
 * would have been a blank rectangle. What a scroll-driven scene needs instead is the scroll
 * timeline, which replays through the real renderer at about 1KB a visit and shows what the
 * visitor actually saw.
 *
 * Nothing here identifies a person. The visitor key is a salted hash of IP and user agent computed
 * on the server and never stored in raw form, and it exists so unique-visitor counts work; it is
 * not written into the session record.
 */

export const ANALYTICS_VERSION = 1;

/** Batches arrive by sendBeacon, so these caps bound what one request can cost. */
export const LIMITS = {
  eventsPerBatch: 200,
  bodyBytes: 64 * 1024,
  sessionRecordBytes: 96 * 1024,
  batchesPerMinutePerVisitor: 30,
  scrollHz: 4,
  sessionTtlDays: 45,
} as const;

export type DeviceType = "phone" | "tablet" | "desktop";
export type Renderer = "full" | "lite";

/** A discrete thing that happened, in the order it happened. */
export type AnalyticsEvent =
  /** A route was shown. `path` is the app route, not the raw URL, so query strings never arrive. */
  | { t: number; k: "view"; path: string }
  /**
   * Scroll progress through a journey, quantised to 1/1000 and sampled at LIMITS.scrollHz.
   * This is the replay signal: driving the live scene to `p` reproduces the frame they saw.
   */
  | { t: number; k: "scroll"; p: number }
  /** Furthest chapter reached on the road, emitted when it changes. */
  | { t: number; k: "chapter"; id: string; i: number }
  /** A link or control was activated. `to` is a route or an outbound host, never a full URL. */
  | { t: number; k: "click"; label: string; to?: string }
  /** A photograph was opened large. */
  | { t: number; k: "photo"; src: string }
  /**
   * Repeated clicks in one spot with nothing happening, or a click on something inert. The two
   * classic signals that a visitor expected an affordance the page did not give them. The path
   * travels with it, because "people rage-click here" is only useful with the where.
   */
  | { t: number; k: "friction"; kind: "rage" | "dead"; label: string; path: string }
  /** Core Web Vitals, reported by the browser as they settle. */
  | { t: number; k: "vital"; name: "LCP" | "CLS" | "INP" | "FCP" | "TTFB"; value: number }
  /** The visitor left this route. `ms` is time with the tab actually visible. */
  | { t: number; k: "leave"; path: string; ms: number };

export type EventKind = AnalyticsEvent["k"];

/** Sent once per session, with the first batch. */
export type SessionHello = {
  sid: string;
  startedAt: number;
  tz?: string;
  /** Referrer host only. A full referring URL can carry search terms and private paths. */
  ref?: string;
  device: DeviceType;
  renderer: Renderer;
  viewport: [number, number];
  reducedMotion: boolean;
  theme: "dark" | "light";
  /**
   * Whether this navigation went through the visitor's own service worker — that is, whether they
   * arrived with the site already installed on their machine. Read together with the renderer it
   * answers the only useful version of "their compute or ours": how often the site is already on
   * their side, and how often a device refuses the full scene and falls back.
   */
  onDevice: boolean;
};

export type Batch = {
  v: number;
  sid: string;
  hello?: SessionHello;
  events: AnalyticsEvent[];
};

/** What the server keeps. Assembled from batches, read whole by the replay viewer. */
export type StoredSession = SessionHello & {
  country?: string;
  lastAt: number;
  events: AnalyticsEvent[];
  /** Set when the record hit LIMITS.sessionRecordBytes and later events were dropped. */
  truncated?: boolean;
};

const DEVICES = new Set<DeviceType>(["phone", "tablet", "desktop"]);
const VITALS = new Set(["LCP", "CLS", "INP", "FCP", "TTFB"]);
const KINDS = new Set<EventKind>([
  "view",
  "scroll",
  "chapter",
  "click",
  "photo",
  "friction",
  "vital",
  "leave",
]);

const str = (v: unknown, max: number): string | null =>
  typeof v === "string" && v.length > 0 && v.length <= max ? v : null;
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * Validates an untrusted body. The ingest route is public by necessity, so this rejects rather
 * than coerces: an event that does not match the contract is dropped, not repaired.
 */
export function parseBatch(input: unknown): Batch | null {
  if (typeof input !== "object" || input === null) return null;
  const b = input as Record<string, unknown>;

  if (num(b.v) !== ANALYTICS_VERSION) return null;
  const sid = str(b.sid, 40);
  if (!sid || !/^[a-z0-9]+$/i.test(sid)) return null;
  if (!Array.isArray(b.events)) return null;
  if (b.events.length > LIMITS.eventsPerBatch) return null;

  const events: AnalyticsEvent[] = [];
  for (const raw of b.events) {
    const e = parseEvent(raw);
    if (e) events.push(e);
  }

  return { v: ANALYTICS_VERSION, sid, hello: parseHello(b.hello, sid), events };
}

function parseHello(input: unknown, sid: string): SessionHello | undefined {
  if (typeof input !== "object" || input === null) return undefined;
  const h = input as Record<string, unknown>;
  const startedAt = num(h.startedAt);
  const device = str(h.device, 10) as DeviceType | null;
  const vw = Array.isArray(h.viewport) ? num(h.viewport[0]) : null;
  const vh = Array.isArray(h.viewport) ? num(h.viewport[1]) : null;
  if (!startedAt || !device || !DEVICES.has(device) || vw === null || vh === null) return undefined;

  return {
    sid,
    startedAt,
    tz: str(h.tz, 64) ?? undefined,
    ref: str(h.ref, 128) ?? undefined,
    device,
    renderer: h.renderer === "lite" ? "lite" : "full",
    viewport: [Math.round(vw), Math.round(vh)],
    reducedMotion: h.reducedMotion === true,
    theme: h.theme === "light" ? "light" : "dark",
    onDevice: h.onDevice === true,
  };
}

function parseEvent(raw: unknown): AnalyticsEvent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const e = raw as Record<string, unknown>;
  const t = num(e.t);
  const k = str(e.k, 12) as EventKind | null;
  if (t === null || t < 0 || !k || !KINDS.has(k)) return null;

  switch (k) {
    case "view":
    case "leave": {
      const path = str(e.path, 128);
      if (!path) return null;
      if (k === "view") return { t, k, path };
      const ms = num(e.ms);
      return ms === null || ms < 0 ? null : { t, k, path, ms: Math.round(ms) };
    }
    case "scroll": {
      const p = num(e.p);
      if (p === null || p < 0 || p > 1) return null;
      return { t, k, p: Math.round(p * 1000) / 1000 };
    }
    case "chapter": {
      const id = str(e.id, 40);
      const i = num(e.i);
      return id && i !== null && i >= 0 ? { t, k, id, i: Math.round(i) } : null;
    }
    case "click": {
      const label = str(e.label, 64);
      return label ? { t, k, label, to: str(e.to, 128) ?? undefined } : null;
    }
    case "photo": {
      const src = str(e.src, 200);
      return src ? { t, k, src } : null;
    }
    case "friction": {
      const label = str(e.label, 64);
      const kind = e.kind === "rage" ? "rage" : e.kind === "dead" ? "dead" : null;
      const path = str(e.path, 128);
      return label && kind && path ? { t, k, kind, label, path } : null;
    }
    case "vital": {
      const name = str(e.name, 6);
      const value = num(e.value);
      if (!name || !VITALS.has(name) || value === null || value < 0) return null;
      return { t, k, name: name as "LCP", value: Math.round(value * 100) / 100 };
    }
  }
}

/** Coarse buckets keep a usable distribution without storing every sample. */
export function vitalBucket(name: string, value: number): string {
  const edges: Record<string, number[]> =
    name === "CLS"
      ? { d: [0.05, 0.1, 0.25, 0.5] }
      : name === "INP"
        ? { d: [100, 200, 500, 1000] }
        : { d: [1000, 2500, 4000, 6000] };
  const e = edges.d;
  const i = e.findIndex((edge) => value <= edge);
  return i === -1 ? `>${e[e.length - 1]}` : `<=${e[i]}`;
}
