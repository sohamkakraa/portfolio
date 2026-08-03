/**
 * Consent, kept as an external store so components can subscribe without an effect that sets state
 * during render.
 *
 * Storing anything on a visitor's device for measurement needs their agreement in the EU, and this
 * site is written from the Netherlands, so the answer is asked for before a single event is queued.
 * "unknown" means the question has not been put yet; the collector treats it exactly like "no".
 */

export type ConsentState = "unknown" | "granted" | "denied";

const KEY = "sk-measure";
const listeners = new Set<() => void>();

let cache: ConsentState | null = null;

function read(): ConsentState {
  if (cache !== null) return cache;
  if (typeof window === "undefined") return "unknown";
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw === "granted" || raw === "denied" ? raw : "unknown";
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
  try {
    localStorage.setItem(KEY, next);
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
