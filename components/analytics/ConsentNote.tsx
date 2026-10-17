"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { setConsent, type ConsentState } from "@/lib/analytics/consent";
import { gaConfigured } from "@/lib/analytics/ga";

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
        {gaConfigured()
          ? "May I use analytics to see how you found this site and move through it? This records page views, scroll progress, clicks, basic device details and campaign labels, and shares anonymous usage data with Google Analytics so I can improve the writing, SEO and experience. Google's advertising features are switched off. No ads, marketing profiles or cross-site tracking."
          : "May I use first-party analytics to see how you found this site and move through it? This records page views, scroll progress, clicks, basic device details and campaign labels so I can improve the writing, SEO and experience. No ads, marketing profiles or cross-site tracking."}
      </p>
      <div className="consent-actions">
        <button type="button" className="consent-yes" onClick={() => setConsent("granted")}>
          accept analytics
        </button>
        <button type="button" className="consent-no" onClick={() => setConsent("denied")}>
          necessary only
        </button>
      </div>
      <p className="consent-fine">
        Nothing is measured until you choose. The site works the same either way. Change your choice
        any time in the footer. <Link href="/privacy">Privacy details</Link>.
      </p>
    </aside>
  );
}
