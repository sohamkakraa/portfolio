/**
 * Service worker: the honest form of "the site lives on the visitor's computer".
 *
 * This is what the peer-to-peer idea was really after. A browser cannot serve HTTP to other
 * browsers, and a swarm needs concurrent visitors to have anyone to ask — but a visitor's own device
 * can absolutely hold the site after the first visit, and that is where the waiting actually goes.
 *
 * The strategy is chosen to make a stale deploy impossible:
 *
 *   HTML          network first, cache as fallback. A new deploy is always seen immediately; the
 *                 cached copy only appears when the network does not answer.
 *   /_next/static cache first, forever. These filenames contain a content hash, so a changed file is
 *                 a different URL and can never be served stale.
 *   photographs   cache first with a bounded store. The expensive part of this site is the pictures,
 *                 and a picture already seen should never travel twice.
 *   /api, /admin  never touched. Measurement, the CMS and the admin surfaces must not be cached.
 */

const VERSION = "v1";
const SHELL = `shell-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const IMAGES = `images-${VERSION}`;
const KEEP = new Set([SHELL, ASSETS, IMAGES]);

/** Bounded so a long browse of the archive cannot fill a visitor's disk. */
const MAX_IMAGES = 220;

const OFFLINE_FALLBACK = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHELL);
      // Just the front door, so there is something to show when offline.
      await cache.add(new Request(OFFLINE_FALLBACK, { cache: "reload" })).catch(() => {});
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !KEEP.has(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

const isImage = (url, request) =>
  request.destination === "image" ||
  url.pathname.startsWith("/_next/image") ||
  /\.(?:avif|webp|jpe?g|png|gif|svg)$/i.test(url.pathname);

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // Oldest first, which for a cache is insertion order.
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

/**
 * Writes to the cache after the page already has its copy.
 *
 * Awaiting cache.put before returning would hold the whole body in the worker first, which costs a
 * large photograph its progressive paint and Next's streamed HTML its early flush. The event keeps the
 * worker alive until the write lands, so nothing is lost by handing the response over first.
 */
function storeLater(event, cacheName, request, response, cap) {
  // Opaque and error responses are not worth keeping and would poison the cache.
  if (!response.ok || response.type === "opaque") return response;
  const copy = response.clone();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      await cache.put(request, copy);
      if (cap) await trim(cacheName, cap);
    })()
  );
  return response;
}

async function cacheFirst(event, request, cacheName, cap) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  return storeLater(event, cacheName, request, await fetch(request), cap);
}

async function networkFirst(event, request) {
  try {
    return storeLater(event, SHELL, request, await fetch(request));
  } catch (e) {
    const cache = await caches.open(SHELL);
    const hit = (await cache.match(request)) || (await cache.match(OFFLINE_FALLBACK));
    if (hit) return hit;
    throw e;
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return;
  // A range request expects a 206, which a cached 200 would not satisfy.
  if (request.headers.has("range")) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, request, ASSETS));
    return;
  }

  if (isImage(url, request)) {
    event.respondWith(cacheFirst(event, request, IMAGES, MAX_IMAGES));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(event, request));
  }
});

/** Lets the page ask how much of itself is already on this device. */
self.addEventListener("message", (event) => {
  if (event.data !== "sk-cache-report") return;
  event.waitUntil(
    (async () => {
      const out = {};
      for (const name of KEEP) {
        out[name] = (await caches.open(name).then((c) => c.keys())).length;
      }
      const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
      event.source?.postMessage({ type: "sk-cache-report", caches: out, estimate });
    })()
  );
});
