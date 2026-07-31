import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import { isPortfolioRedisConfigured, readPortfolioFromRedis } from "@/lib/portfolio-redis";
import { stripHiddenContent } from "@/lib/portfolio-visibility";
import type { PortfolioData } from "@/lib/portfolio-types";

/**
 * Reads the CMS payload for a server-rendered page.
 *
 * This used to live in app/page.tsx, when there was one page that needed it. The homepage is the
 * journey now and the CMS-backed sections have their own surfaces, so the merge rules had to become
 * shared rather than get copied per page — the last time editorial defaults were merged in two
 * places the site spent a while claiming a student with one finished job.
 */

// Stored items inherit storyline, metrics and stack from the defaults so an older stored payload
// does not blank those fields out.
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

export async function getPortfolioData(): Promise<PortfolioData> {
  const defaults = getDefaultPortfolioData();

  if (isPortfolioRedisConfigured()) {
    try {
      const stored = await readPortfolioFromRedis();
      if (stored) {
        return stripHiddenContent({
          ...defaults,
          ...stored,
          site: { ...defaults.site, ...stored.site },
          hero: { ...defaults.hero, ...stored.hero },
          // `log` is deliberately not overridable: it is projected from lib/work.ts, and a stored
          // payload saved before a job existed was how the site came to describe an out-of-date
          // career. Work facts belong to the code.
          about: { ...defaults.about, ...stored.about, log: defaults.about.log },
          highlights: { ...defaults.highlights, ...stored.highlights },
          projects: mergeStoredProjects(defaults.projects, stored.projects),
          life: { ...defaults.life, ...stored.life },
          contact: { ...defaults.contact, ...stored.contact },
          footer: { ...defaults.footer, ...stored.footer },
          photography: {
            ...defaults.photography,
            ...stored.photography,
            categories: defaults.photography.categories.map((defCat) => {
              const storedCat = stored.photography?.categories?.find((c) => c.slug === defCat.slug);
              if (!storedCat) return defCat;
              return {
                ...defCat,
                ...storedCat,
                images: storedCat.images?.length ? storedCat.images : defCat.images,
              };
            }),
          },
        });
      }
    } catch (e) {
      console.error("[portfolio-server] Redis read failed, using defaults:", e);
    }
  }

  return stripHiddenContent(defaults);
}
