import { getDefaultPortfolioData } from "@/lib/portfolio-data";
import {
  isPortfolioRedisConfigured,
  readPortfolioFromRedis,
} from "@/lib/portfolio-redis";
import PortfolioPage from "@/components/PortfolioPage";

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
          projects: { ...defaults.projects, ...stored.projects },
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
