import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import {
  isPortfolioRedisConfigured,
  readPortfolioFromRedis,
} from "@/lib/portfolio-redis";
import PortfolioPage from "@/components/PortfolioPage";
import type { PortfolioData } from "@/lib/portfolio-types";

// Project per-item merge: stored items inherit storyline / metrics / stack
// defaults so older stored payloads don't blank those fields out on the live
// portfolio page.
function mergeStoredProjects(
  defaults: PortfolioData["projects"],
  stored?: PortfolioData["projects"]
): PortfolioData["projects"] {
  if (!stored) return defaults;
  const byId = new Map(defaults.items.map((p) => [p.id, p]));
  const items = (stored.items ?? []).map((s) => {
    const d = byId.get(s.id);
    if (!d) return s;
    return {
      ...d,
      ...s,
      storyline: s.storyline?.length ? s.storyline : d.storyline,
      metrics: s.metrics?.length ? s.metrics : d.metrics,
      stack: s.stack?.length ? s.stack : d.stack,
    };
  });
  const seen = new Set(items.map((p) => p.id));
  for (const d of defaults.items) if (!seen.has(d.id)) items.push(d);
  return { ...defaults, ...stored, items };
}

// Force dynamic rendering so server always fetches latest CMS data from Redis
export const dynamic = "force-dynamic";

async function getPortfolioData() {
  const defaults = getDefaultPortfolioData();

  if (isPortfolioRedisConfigured()) {
    try {
      const stored = await readPortfolioFromRedis();
      if (stored) {
        return {
          ...defaults,
          ...stored,
          // Deep-merge each section so older stored payloads inherit editorial defaults.
          site: { ...defaults.site, ...stored.site },
          hero: { ...defaults.hero, ...stored.hero },
          about: { ...defaults.about, ...stored.about },
          highlights: { ...defaults.highlights, ...stored.highlights },
          projects: mergeStoredProjects(defaults.projects, stored.projects),
          life: { ...defaults.life, ...stored.life },
          contact: { ...defaults.contact, ...stored.contact },
          footer: { ...defaults.footer, ...stored.footer },
          photography: {
            ...defaults.photography,
            ...stored.photography,
            categories: defaults.photography.categories.map((defCat) => {
              const storedCat = stored.photography?.categories?.find(
                (c) => c.slug === defCat.slug
              );
              if (!storedCat) return defCat;
              return {
                ...defCat,
                ...storedCat,
                images:
                  storedCat.images?.length
                    ? storedCat.images
                    : defCat.images,
              };
            }),
          },
        };
      }
    } catch (e) {
      console.error("[page] Redis read failed, using defaults:", e);
    }
  }

  return defaults;
}

export default async function HomePage() {
  const data = await getPortfolioData();
  return <PortfolioPage initialData={data} />;
}
