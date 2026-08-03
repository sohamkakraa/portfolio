"use client";

import { useEffect, useState } from "react";
import { setConsent, type ConsentState } from "@/lib/analytics/consent";

/**
 * The one banner on the site, so it is written like the rest of it rather than like a legal notice.
 *
 * It appears late on purpose. Meeting a stranger with a consent dialogue before they have read a
 * sentence is the opposite of a warm front door, so the question waits until the visitor has had a
 * few seconds with the page, and it never covers the opening question on the road.
 */
export default function ConsentNote({ state }: { state: ConsentState }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (state !== "unknown") return;
    // Never inside a frame. The only frame this site permits is the admin replay stage, where the
    // note would sit over the scene being watched and ask a question of nobody.
    if (window.self !== window.top) return;
    const timer = setTimeout(() => setShown(true), 6000);
    return () => clearTimeout(timer);
  }, [state]);

  if (state !== "unknown" || !shown) return null;

  return (
    <aside className="consent" role="region" aria-label="About being counted">
      <p className="consent-body">
        I keep a quiet record of how people move through here — which chapters hold you, where you
        turn back — because guessing is how portfolios stay broken. It stays with me: nothing sold,
        nothing following you off this site.
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-yes" onClick={() => setConsent("granted")}>
          fine by me
        </button>
        <button type="button" className="consent-no" onClick={() => setConsent("denied")}>
          rather not
        </button>
      </div>
      <p className="consent-fine">Either way the site behaves the same. You can change this in the footer.</p>
    </aside>
  );
}
