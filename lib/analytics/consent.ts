/**
 * Consent, kept as an external store so components can subscribe without an effect that sets state
 * during render.
 *
 * The collector is limited to first-party audience measurement and UX improvement. Visitors can
 * object at any time, and browser-level privacy signals are treated as an objection automatically.
 */

export type ConsentState = "unknown" | "granted" | "denied";

const KEY = "sk-measure";
const SESSION_KEYS = ["sk-sid", "sk-attribution"];
const PREFERENCE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const listeners = new Set<() => void>();

let cache: ConsentState | null = null;

function isSavedConsent(value: unknown): value is Exclude<ConsentState, "unknown"> {
  return value === "granted" || value === "denied";
}

function clearAnalyticsSession(): void {
  try {
    for (const key of SESSION_KEYS) sessionStorage.removeItem(key);
  } catch {
    // Session storage may be unavailable; the collector remains disabled either way.
  }
}

function read(): ConsentState {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return "unknown";
  try {
    const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (privacyNavigator.globalPrivacyControl === true || navigator.doNotTrack === "1") {
      clearAnalyticsSession();
      cache = "denied";
      return cache;
    }
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      clearAnalyticsSession();
      cache = "unknown";
      return cache;
    }
    if (raw === "denied") {
      localStorage.setItem(KEY, JSON.stringify({ state: "denied", savedAt: Date.now() }));
      cache = "denied";
      return cache;
    }
    if (raw === "granted") {
      localStorage.removeItem(KEY);
      clearAnalyticsSession();
      cache = "unknown";
      return cache;
    }
    let saved: { state?: unknown; savedAt?: unknown };
    try {
      saved = JSON.parse(raw) as { state?: unknown; savedAt?: unknown };
    } catch {
      localStorage.removeItem(KEY);
      clearAnalyticsSession();
      cache = "unknown";
      return cache;
    }
    const savedState = isSavedConsent(saved.state) ? saved.state : null;
    const savedAt = typeof saved.savedAt === "number" ? saved.savedAt : 0;
    const age = Date.now() - savedAt;
    cache = savedState !== null && age >= 0 && age <= PREFERENCE_MAX_AGE_MS ? savedState : "unknown";
    if (cache === "unknown") {
      localStorage.removeItem(KEY);
      clearAnalyticsSession();
    }
  } catch {
    // Private mode with storage disabled. Treated as not asked, and nothing is written.
    cache = "unknown";
  }
  return cache;
}

export function getConsent(): ConsentState {
  return read();
}

export function setConsent(next: Exclude<ConsentState, "unknown">): void {
  cache = next;
  if (next === "denied") clearAnalyticsSession();
  try {
    localStorage.setItem(KEY, JSON.stringify({ state: next, savedAt: Date.now() }));
  } catch {
    // A refused write should not refuse the choice for this visit.
  }
  for (const l of listeners) l();
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** useSyncExternalStore needs a stable server value, and the server never has an answer. */
export function serverConsent(): ConsentState {
  return "unknown";
}
