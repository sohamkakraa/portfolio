# Privacy compliance checklist

This is an operational checklist, not legal advice. Review it whenever analytics, hosting, forms or service providers change.

## Current processing

| Purpose | Data | Legal basis | Retention | Recipient |
| --- | --- | --- | --- | --- |
| Deliver and secure the site | IP address, IP-derived location, user agent, request and system data | Legitimate interests | Customer-visible runtime logs: 1 hour to 30 days depending on plan; Vercel's separate service-generated retention follows its published criteria | Vercel |
| First-party audience and UX measurement | Random session ID, route and interaction events, coarse device details, referrer host, consented UTM labels, masked daily visitor hash | Consent | Detailed sessions: 45 days; daily aggregate counts: 24 months | Vercel, Upstash |
| Google Analytics 4 audience measurement | Page views, page URL and title, referrer, IP-derived approximate location, browser, OS, screen size, language, random client ID in `_ga` / `_ga_<ID>` cookies (13 months max). Google signals and ad personalisation off | Consent | Cookies: 13 months. GA property retention: set to the minimum in Admin > Data collection and modification > Data retention | Google |
| Remember the visitor's analytics choice | Consent state and timestamp in local storage | Necessary to respect the choice | 6 months | Browser only |
| Guesses on open questions | Guess text, optional name, question id, time | Consent (sending the form) | Pending: 90 days. Approved: until removed | Site server, Upstash |
| Trip signups | Email, wishlist place id, time | Consent (checkbox) | 24 months after the latest signup for that place, or on request | Site server, Upstash; never public |
| Form abuse limits | One-way hash of IP + user agent with server secret, submission count | Legitimate interests | 1 hour | Upstash |
| Admin authentication | Admin session cookie | Strictly necessary; legitimate interests | 30 days maximum | Browser, site server |

## Before production

- Confirm which Vercel plan is used and that its current DPA applies to the account.
- Retain the current Upstash DPA, choose an EU database region, enable TLS and assess whether its at-rest encryption add-on is needed; document each setting.
- Verify HTTPS, production secrets, dashboard access controls and `ANALYTICS_SALT` configuration.
- Record the actual retention of Vercel request and security logs in the public privacy notice.
- Keep proof of the consent wording and version deployed on each material change.
- Test that reject, accept and later withdrawal all work without reducing site functionality.
- Reassess whether long-lived aggregate dimensions can single out a person; delete or coarsen sparse values.
- Google Analytics: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` for Production only. In the GA4 property, set event data retention to the shortest option, turn Google signals off, disable data sharing settings you do not need, accept the data processing terms, and do not link Google Ads.
- Confirm GA loads only after accepting: with no choice made or "necessary only", the network tab must show no request to googletagmanager.com or google-analytics.com and no `_ga` cookies. After withdrawing in the footer, the cookies must disappear.
- Do not enter names, email addresses or other personal data into GA custom dimensions or event parameters.
- Review this record and the public notice at least annually.
- If analytics data predates the automated 24-month expiry, remove those legacy Redis keys manually.

## Request handling

- Acknowledge privacy requests promptly and normally complete them within one month.
- Verify the requester only to the extent necessary.
- Search consented analytics by session ID and approximate visit time where possible.
- Record access, correction, deletion, restriction, objection and withdrawal requests without retaining unnecessary identity documents.
- Document security incidents and assess whether the Dutch supervisory authority and affected people must be notified.
