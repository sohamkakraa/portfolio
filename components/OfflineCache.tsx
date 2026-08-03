"use client";

import { useEffect } from "react";

/**
 * Registers the service worker, and only in production.
 *
 * In development a worker intercepting /_next/static would fight hot reloading, and the whole point
 * of the cache-first rule there is that those filenames are content-hashed, which they are not while
 * a dev server is rewriting them.
 */
export default function OfflineCache() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // The escape hatch. A worker that ships broken can keep serving its own broken self, and the
    // visitor has no way to know why the site is wrong. /?nosw tears the whole thing out.
    if (new URLSearchParams(location.search).has("nosw")) {
      void (async () => {
        for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister();
        for (const name of await caches.keys()) await caches.delete(name);
        console.info("[offline] worker and caches removed");
      })();
      return;
    }

    if (process.env.NODE_ENV !== "production") return;

    // After load, so registration never competes with the first paint for bandwidth.
    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((e) => {
        console.warn("[offline] service worker did not register:", e);
      });
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    addEventListener("load", register, { once: true });
    return () => removeEventListener("load", register);
  }, []);

  return null;
}
