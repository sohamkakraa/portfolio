/**
 * Google Analytics 4, loaded only after consent.
 *
 * The first-party collector in client.ts stays the primary record. This sits beside it for the
 * things Google's reports do well (acquisition, audiences, search-console linking) and is held to
 * the same rule: not one byte reaches Google, and no Google script is even downloaded, until the
 * visitor has accepted analytics. Declining or withdrawing removes it again in place.
 *
 * The measurement ID is public by design (it ships in every GA page). With no ID configured this
 * whole module is inert, so a fork or a preview deploy never reports to someone else's property.
 */

const RAW_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";

/** G- followed by the property's alphanumeric ID. Anything else is treated as not configured. */
export const GA_ID = /^G-[A-Z0-9]{6,14}$/.test(RAW_ID) ? RAW_ID : "";

/** Thirteen months, the longest the Dutch and French regulators accept for an analytics cookie. */
const COOKIE_EXPIRES_S = 60 * 60 * 24 * 395;

const SCRIPT_ID = "sk-ga";

type Gtag = (...args: unknown[]) => void;
type GaWindow = Window & {
  dataLayer?: unknown[];
  gtag?: Gtag;
  [disableKey: string]: unknown;
};

const w = () => window as unknown as GaWindow;

export function gaConfigured(): boolean {
  return GA_ID !== "";
}

/** Adds the library and configures the property. Safe to call repeatedly. */
export function gaStart(): void {
  if (!GA_ID || typeof window === "undefined") return;
  const win = w();
  win[`ga-disable-${GA_ID}`] = false;

  if (!win.gtag) {
    win.dataLayer = win.dataLayer || [];
    // gtag.js reads the Arguments object itself, not an array, so this cannot be a rest parameter.
    win.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      win.dataLayer!.push(arguments);
    };
    win.gtag("js", new Date());
    win.gtag("config", GA_ID, {
      // Page views are sent by hand on every route change, because the App Router navigates
      // without a page load and the automatic one would count only the first page.
      send_page_view: false,
      // Advertising features off: no Google signals, no ad personalisation, no remarketing.
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: COOKIE_EXPIRES_S,
      cookie_flags: "SameSite=Lax;Secure",
    });
  }

  if (!document.getElementById(SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(script);
  }
}

export function gaView(path: string): void {
  const win = w();
  if (!GA_ID || !win.gtag) return;
  win.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: document.title,
  });
}

/** Stops collection and removes the cookies Google set, so withdrawing leaves nothing behind. */
export function gaStop(): void {
  if (!GA_ID || typeof window === "undefined") return;
  w()[`ga-disable-${GA_ID}`] = true;

  const host = window.location.hostname;
  const apex = host.split(".").slice(-2).join(".");
  const domains = new Set([host, `.${host}`, apex, `.${apex}`]);
  const names = document.cookie
    .split(";")
    .map((c) => c.split("=")[0]!.trim())
    .filter((n) => n === "_ga" || n.startsWith("_ga_") || n === "_gid" || n.startsWith("_gat"));
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${domain}`;
    }
    document.cookie = `${name}=; Max-Age=0; Path=/`;
  }
}
