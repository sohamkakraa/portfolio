import {
  ANALYTICS_VERSION,
  LIMITS,
  type AnalyticsEvent,
  type Batch,
  type DeviceType,
  type SessionHello,
} from "./schema";

/**
 * The browser half of measurement. Framework-agnostic on purpose: React mounts it and tells it when
 * the route changes, and everything else it observes for itself.
 *
 * Three things shape this file.
 *
 * It sends nothing until consent is given, and holds no queue before then, so declining costs a
 * visitor nothing and leaves nothing behind.
 *
 * It batches. A scroll track sampled four times a second would be absurd as four requests a second,
 * so events accumulate and leave every ten seconds, plus once on the way out through sendBeacon,
 * which is the only send that survives a closing tab.
 *
 * The scroll track is the replay. Rather than record pixels, which cannot be done for a WebGL
 * scene, it records progress through the document; the admin viewer drives the real page to those
 * positions and the scene renders itself again.
 */

const ENDPOINT = "/api/analytics";
const FLUSH_MS = 10_000;
const SCROLL_MS = 1000 / LIMITS.scrollHz;
const SCROLL_EPSILON = 0.002;
const RAGE_WINDOW_MS = 900;
const RAGE_RADIUS_PX = 32;
const RAGE_CLICKS = 3;

type Chapter = { t: number; id: string };

let started = false;
let sid = "";
let t0 = 0;
let queue: AnalyticsEvent[] = [];
let hello: SessionHello | null = null;
let helloSent = false;

let path = "";
let visibleSince = 0;
let visibleMs = 0;

let chapters: Chapter[] = [];
let furthestChapter = -1;
let lastScrollAt = 0;
let lastScrollP = -1;

let flushTimer: ReturnType<typeof setInterval> | null = null;
const teardown: Array<() => void> = [];

const now = () => Math.round(performance.now() - t0);

function newSessionId(): string {
  try {
    const existing = sessionStorage.getItem("sk-sid");
    if (existing && /^[a-z0-9]+$/i.test(existing)) return existing;
    const fresh = crypto.randomUUID().replace(/-/g, "");
    sessionStorage.setItem("sk-sid", fresh);
    return fresh;
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}

function deviceType(): DeviceType {
  // Width alone. Taking the smaller axis called a 1440x900 laptop a tablet, because its height
  // is what a tablet's width is.
  const w = window.innerWidth;
  if (w <= 600) return "phone";
  if (w <= 1024) return "tablet";
  return "desktop";
}

function referrerHost(): string | undefined {
  if (!document.referrer) return undefined;
  try {
    const url = new URL(document.referrer);
    // Internal navigation is not a referral, and would otherwise drown the real sources.
    if (url.host === location.host) return undefined;
    return url.host.slice(0, 128);
  } catch {
    return undefined;
  }
}

function push(event: AnalyticsEvent): void {
  if (!started) return;
  queue.push(event);
  // A pathological session should drop its oldest detail rather than grow without bound.
  if (queue.length > LIMITS.eventsPerBatch * 4) queue = queue.slice(-LIMITS.eventsPerBatch * 2);
}

function body(): string | null {
  if (!queue.length && helloSent) return null;
  if (hello && !helloSent) {
    // Read the renderer at send time, not at start. The tier is measured after mount, so asking
    // immediately reports lite for every visitor who in fact got the full scene.
    hello.renderer = document.querySelector("canvas.lab-canvas") ? "full" : "lite";
  }
  const batch: Batch = {
    v: ANALYTICS_VERSION,
    sid,
    events: queue.slice(0, LIMITS.eventsPerBatch),
    ...(helloSent || !hello ? {} : { hello }),
  };
  return JSON.stringify(batch);
}

function flush(final = false): void {
  if (!started) return;
  const payload = body();
  if (!payload) return;

  const sent = queue.length;
  if (final && typeof navigator.sendBeacon === "function") {
    // The only transport a browser will still run while the tab is closing.
    if (!navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }))) return;
  } else {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Measurement is best effort. A failed send is not worth a visitor's console.
    });
  }

  helloSent = true;
  queue = queue.slice(Math.min(sent, LIMITS.eventsPerBatch));
}

/* ── observers ─────────────────────────────────────────────────────────── */

function readChapters(): void {
  const host = document.querySelector<HTMLElement>("[data-chapters]");
  chapters = [];
  furthestChapter = -1;
  if (!host) return;
  for (const pair of (host.dataset.chapters ?? "").split(",")) {
    const [t, id] = pair.split(":");
    const at = Number(t);
    if (id && Number.isFinite(at)) chapters.push({ t: at, id });
  }
  chapters.sort((a, b) => a.t - b.t);
}

function scrollProgress(): number {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return 0;
  return Math.min(1, Math.max(0, window.scrollY / max));
}

function onScroll(): void {
  const at = performance.now();
  if (at - lastScrollAt < SCROLL_MS) return;
  lastScrollAt = at;

  const p = scrollProgress();
  if (Math.abs(p - lastScrollP) >= SCROLL_EPSILON) {
    lastScrollP = p;
    push({ t: now(), k: "scroll", p });
  }

  // Furthest reached only, so the funnel counts each chapter once however much they wander.
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (p + 0.02 >= chapters[i]!.t) {
      if (i > furthestChapter) {
        furthestChapter = i;
        push({ t: now(), k: "chapter", id: chapters[i]!.id, i });
      }
      break;
    }
  }
}

const INTERACTIVE = "a,button,[role=button],input,select,textarea,summary,label,[data-track]";

const NAMELESS = new Set(["STYLE", "SCRIPT", "NOSCRIPT", "HTML", "BODY", "TEMPLATE"]);

function describe(el: Element): string {
  const tag = el.tagName.toLowerCase();
  const cls = String(el.className || "").split(/\s+/)[0];
  return (cls ? `${tag}.${cls}` : tag).slice(0, 64);
}

function labelFor(el: Element): string {
  const tracked = el.closest<HTMLElement>("[data-track]");
  if (tracked?.dataset.track) return tracked.dataset.track.slice(0, 64);

  if (NAMELESS.has(el.tagName)) return describe(el);

  const aria = el.getAttribute("aria-label");
  if (aria?.trim()) return aria.trim().slice(0, 64);
  if (el instanceof HTMLImageElement) {
    return `image ${(el.alt || el.src.split("/").pop() || "").slice(0, 48)}`.trim();
  }

  // Only take text from something small enough for it to be a name. Reading textContent off a
  // container swept in an injected <style> block and produced a label of raw @font-face rules.
  if (el.querySelectorAll("*").length <= 6 && !el.querySelector("style,script")) {
    const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
    if (text && text.length <= 80) return text.slice(0, 64);
  }
  return describe(el);
}

let recentClicks: Array<{ x: number; y: number; at: number }> = [];

function onClick(event: MouseEvent): void {
  const target = event.target as Element | null;
  if (!target || !(target instanceof Element)) return;

  const at = performance.now();
  recentClicks = recentClicks.filter((c) => at - c.at < RAGE_WINDOW_MS);
  recentClicks.push({ x: event.clientX, y: event.clientY, at });
  const clustered = recentClicks.filter(
    (c) => Math.hypot(c.x - event.clientX, c.y - event.clientY) <= RAGE_RADIUS_PX
  );
  if (clustered.length >= RAGE_CLICKS) {
    push({ t: now(), k: "friction", kind: "rage", label: labelFor(target), path });
    recentClicks = [];
    return;
  }

  const control = target.closest(INTERACTIVE);
  if (control) {
    const anchor = control.closest("a");
    let to: string | undefined;
    if (anchor instanceof HTMLAnchorElement && anchor.href) {
      try {
        const url = new URL(anchor.href, location.href);
        to =
          url.host === location.host
            ? url.pathname.slice(0, 128)
            : url.protocol === "mailto:"
              ? "mailto"
              : url.host.slice(0, 128);
      } catch {
        to = undefined;
      }
    }
    push({ t: now(), k: "click", label: labelFor(control), to });
    return;
  }

  // Looks clickable, is not. A photograph or a pointer cursor with no control behind it is a
  // visitor expecting an affordance the page never offered, which is the useful kind of dead click.
  const looksClickable =
    target.tagName === "IMG" ||
    target.closest("img") !== null ||
    getComputedStyle(target).cursor === "pointer";
  if (looksClickable) {
    push({ t: now(), k: "friction", kind: "dead", label: labelFor(target), path });
  }
}

function accrueVisible(): void {
  if (visibleSince) {
    visibleMs += performance.now() - visibleSince;
    visibleSince = 0;
  }
}

function onVisibility(): void {
  if (document.visibilityState === "hidden") {
    accrueVisible();
    leaveCurrent();
    flush(true);
  } else {
    visibleSince = performance.now();
  }
}

function leaveCurrent(): void {
  accrueVisible();
  if (path && visibleMs > 0) {
    push({ t: now(), k: "leave", path, ms: visibleMs });
    visibleMs = 0;
  }
  visibleSince = document.visibilityState === "visible" ? performance.now() : 0;
}

/* ── public surface ────────────────────────────────────────────────────── */

/**
 * True when this document is inside a frame, which on this site means the admin replay stage: the
 * CSP allows framing by 'self' and nobody else. A staged copy must not record, or watching a visit
 * back would manufacture visits of its own.
 */
function framed(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    // A cross-origin parent throws on access, which is itself proof of being framed.
    return true;
  }
}

/**
 * Whether this visitor already had the site installed on their machine when they arrived.
 *
 * Read from navigation timing rather than from navigator.serviceWorker.controller, because the
 * controller is not a safe signal here: the worker calls clients.claim() and takes over the very
 * first visit part way through, and this collector only starts once consent is given, by which time
 * the first visit also reports a controller. workerStart is a property of the navigation itself and
 * is zero for anyone arriving without the worker.
 */
function arrivedInstalled(): boolean {
  const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return Boolean(nav && nav.workerStart > 0);
}

/** Sets up the observers. The caller records views, including the first. */
export function start(): void {
  if (started || typeof window === "undefined" || framed()) return;
  started = true;
  sid = newSessionId();
  t0 = performance.now();

  hello = {
    sid,
    startedAt: Date.now(),
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ref: referrerHost(),
    device: deviceType(),
    renderer: document.querySelector("canvas.lab-canvas") ? "full" : "lite",
    viewport: [window.innerWidth, window.innerHeight],
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    theme: document.documentElement.classList.contains("light") ? "light" : "dark",
    onDevice: arrivedInstalled(),
  };

  const scroll = () => onScroll();
  const click = (e: MouseEvent) => onClick(e);
  const hide = () => {
    accrueVisible();
    leaveCurrent();
    flush(true);
  };

  addEventListener("scroll", scroll, { passive: true });
  addEventListener("click", click, { capture: true, passive: true });
  // visibilitychange is dispatched at the document, so that is where it is listened for.
  document.addEventListener("visibilitychange", onVisibility);
  addEventListener("pagehide", hide);
  teardown.push(
    () => removeEventListener("scroll", scroll),
    () => removeEventListener("click", click, { capture: true } as EventListenerOptions),
    () => document.removeEventListener("visibilitychange", onVisibility),
    () => removeEventListener("pagehide", hide)
  );

  flushTimer = setInterval(() => flush(false), FLUSH_MS);
  visibleSince = document.visibilityState === "visible" ? performance.now() : 0;
}

/** Called on every route change, including the first. */
export function view(nextPath: string): void {
  if (!started) return;
  if (path && path !== nextPath) leaveCurrent();
  path = nextPath;
  push({ t: now(), k: "view", path: nextPath.slice(0, 128) });

  // Chapter geometry belongs to whichever journey just mounted, so re-read it per route.
  lastScrollP = -1;
  requestAnimationFrame(() => {
    readChapters();
    onScroll();
  });
}

export function vital(name: string, value: number): void {
  if (!started) return;
  if (!["LCP", "CLS", "INP", "FCP", "TTFB"].includes(name)) return;
  push({ t: now(), k: "vital", name: name as "LCP", value });
}

export function photo(src: string): void {
  if (!started) return;
  push({ t: now(), k: "photo", src: src.slice(0, 200) });
}

export function stop(): void {
  if (!started) return;
  leaveCurrent();
  flush(true);
  started = false;
  if (flushTimer) clearInterval(flushTimer);
  flushTimer = null;
  while (teardown.length) teardown.pop()!();
  queue = [];
}
