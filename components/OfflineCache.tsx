"use client";

import { useEffect } from "react";

/** Removes the portfolio's old service worker and its browser caches. */
export default function OfflineCache() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void (async () => {
      for (const registration of await navigator.serviceWorker.getRegistrations()) {
        if (registration.scope.startsWith(location.origin)) await registration.unregister();
      }
      for (const name of await caches.keys()) {
        if (/^(shell|assets|images)-v\d+$/.test(name)) await caches.delete(name);
      }
    })();
  }, []);

  return null;
}
