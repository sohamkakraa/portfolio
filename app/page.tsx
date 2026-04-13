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
                images: Array.isArray(storedCat.images)
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
