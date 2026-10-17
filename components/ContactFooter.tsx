"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import type { ContactSection, FooterContent, SocialLink } from "@/lib/portfolio-types";
import { getConsent, serverConsent, setConsent, subscribeConsent } from "@/lib/analytics/consent";
import { QUOTES } from "@/lib/basecamp/lists";
import StarTrailsMark from "@/components/StarTrailsMark";

/** Picked once per page load, so it stays put while you browse and changes on the next visit. */
const VISIT_QUOTE = typeof window === "undefined" ? 0 : Math.floor(Math.random() * QUOTES.length);
const visitQuote = () => VISIT_QUOTE;
const noSubscribe = () => () => {};

type Props = {
  contact: ContactSection;
  footer: FooterContent;
  socials: SocialLink[];
};

/**
 * The campfire at the bottom of every page: one quote per visit, how to reach me, and the
 * analytics choice. The quote is picked after hydration so the server and client agree on the
 * first render.
 */
export default function ContactFooter({ contact, socials }: Props) {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, serverConsent);
  const analyticsOn = consent === "granted";
  const qi = useSyncExternalStore(noSubscribe, visitQuote, () => 0);

  const quote = QUOTES[qi];
  const links = socials.filter((l) => !l.href.startsWith("mailto:"));

  return (
    <footer className="bc-footer">
      <div className="bc-footer-inner">
        <figure className="bc-quote">
          <blockquote>{quote.text}</blockquote>
          {quote.gloss ? <p className="bc-quote-gloss">{quote.gloss}</p> : null}
          <figcaption>{quote.by}</figcaption>
        </figure>

        <div className="bc-footer-grid">
          <div className="bc-footer-col">
            <h2>Say hi</h2>
            <p>Planning a trip, curious about something, or just want to talk? Write to me.</p>
            <a className="bc-footer-email" href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </div>
          <div className="bc-footer-col">
            <h2>Elsewhere</h2>
            <ul>
              {links.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bc-footer-base">
          <Link href="/" className="bc-footer-mark" aria-label="Basecamp">
            <StarTrailsMark size={22} detail="small" />
            <span>Soham Kakra · {new Date().getFullYear()}</span>
          </Link>
          <div className="bc-footer-fine">
            <button type="button" onClick={() => setConsent(analyticsOn ? "denied" : "granted")} aria-pressed={analyticsOn}>
              Analytics: {consent === "unknown" ? "not chosen" : analyticsOn ? "on" : "off"}
            </button>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
