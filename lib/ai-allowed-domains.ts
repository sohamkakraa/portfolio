import type { PortfolioData } from "@/lib/portfolio-types";

// Always-on baseline. The assistant can reach the user's GitHub plus the
// portfolio's primary domain even before any project link is added.
export const STATIC_ALLOWED_DOMAINS = [
  "github.com",
  "raw.githubusercontent.com",
  "gist.github.com",
  "sohamkakra.com",
  "www.sohamkakra.com",
];

function hostFromUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url, "https://placeholder.invalid");
    if (u.hostname === "placeholder.invalid") return null; // relative
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Build the web_search allowed_domains list for the AI chat. Pure function so
 * both the server route and the admin chat UI can render the same set.
 */
export function buildAllowedDomains(data: PortfolioData): string[] {
  const set = new Set<string>(STATIC_ALLOWED_DOMAINS);

  const add = (host: string | null) => {
    if (!host) return;
    set.add(host);
    if (!host.startsWith("www.")) set.add(`www.${host}`);
  };

  for (const p of data.projects?.items ?? []) {
    add(hostFromUrl(p.link));
    add(hostFromUrl(p.repo));
  }

  add(hostFromUrl(data.hero?.vivekaCta?.href));
  add(hostFromUrl(data.hero?.ctaPrimary?.href));
  add(hostFromUrl(data.hero?.ctaSecondary?.href));

  for (const s of data.site?.socials ?? []) add(hostFromUrl(s.href));
  for (const l of data.footer?.links ?? []) add(hostFromUrl(l.href));

  return Array.from(set).sort();
}
