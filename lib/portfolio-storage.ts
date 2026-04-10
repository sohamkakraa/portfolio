import type {
  LifeSection,
  PortfolioData,
  PhotographyCategory,
  PhotoItem,
} from "@/lib/portfolio-types";

const STORAGE_KEY = "portfolio-data-v2";

const mergeImages = (baseImages: PhotoItem[], storedImages: PhotoItem[]) => {
  const imageMap = new Map<string, PhotoItem>();
  baseImages.forEach((image) => imageMap.set(image.src, image));
  storedImages.forEach((image) => {
    const existing = imageMap.get(image.src);
    imageMap.set(image.src, existing ? { ...existing, ...image } : image);
  });
  return Array.from(imageMap.values());
};

const mergeCategories = (baseCategories: PhotographyCategory[], storedCategories: PhotographyCategory[]) => {
  const merged = baseCategories.map((category) => {
    const stored = storedCategories.find((item) => item.slug === category.slug);
    if (!stored) {
      return category;
    }
    return {
      ...category,
      ...stored,
      images: mergeImages(category.images, stored.images || []),
    };
  });
  const extras = storedCategories.filter(
    (stored) => !baseCategories.some((category) => category.slug === stored.slug)
  );
  return [...merged, ...extras];
};

const mergeLife = (base: LifeSection, stored?: LifeSection | null): LifeSection => {
  if (!stored) return base;
  return {
    ...base,
    ...stored,
    snapshots: stored.snapshots?.length ? stored.snapshots : base.snapshots,
    books: stored.books?.length ? stored.books : base.books,
    places: stored.places?.length ? stored.places : base.places,
    entertainment: stored.entertainment?.length ? stored.entertainment : base.entertainment,
  };
};

export const mergePortfolioData = (baseData: PortfolioData, storedData?: PortfolioData | null): PortfolioData => {
  if (!storedData) {
    return baseData;
  }

  return {
    ...baseData,
    ...storedData,
    site: {
      ...baseData.site,
      ...storedData.site,
      nav: storedData.site?.nav?.length ? storedData.site.nav : baseData.site.nav,
      socials: storedData.site?.socials?.length ? storedData.site.socials : baseData.site.socials,
    },
    hero: {
      ...baseData.hero,
      ...storedData.hero,
      badges: storedData.hero?.badges?.length ? storedData.hero.badges : baseData.hero.badges,
      showVivekaCta:
        storedData.hero?.showVivekaCta !== undefined
          ? storedData.hero.showVivekaCta
          : baseData.hero.showVivekaCta,
      vivekaCta: storedData.hero?.vivekaCta ?? baseData.hero.vivekaCta,
    },
    about: {
      ...baseData.about,
      ...storedData.about,
      highlights: storedData.about?.highlights?.length ? storedData.about.highlights : baseData.about.highlights,
      portraitSrc: storedData.about?.portraitSrc ?? baseData.about.portraitSrc,
    },
    highlights: {
      ...baseData.highlights,
      ...storedData.highlights,
      items: storedData.highlights?.items?.length ? storedData.highlights.items : baseData.highlights.items,
    },
    projects: {
      ...baseData.projects,
      ...storedData.projects,
      items: storedData.projects?.items?.length ? storedData.projects.items : baseData.projects.items,
    },
    photography: {
      ...baseData.photography,
      ...storedData.photography,
      categories: mergeCategories(
        baseData.photography.categories,
        storedData.photography?.categories || []
      ),
    },
    contact: {
      ...baseData.contact,
      ...storedData.contact,
    },
    footer: {
      ...baseData.footer,
      ...storedData.footer,
      links: storedData.footer?.links?.length ? storedData.footer.links : baseData.footer.links,
    },
    life: mergeLife(baseData.life, storedData.life),
  };
};

export const loadPortfolioData = (): PortfolioData | null => {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PortfolioData;
  } catch {
    return null;
  }
};

export const savePortfolioData = (data: PortfolioData) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const clearPortfolioData = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export const getPortfolioStorageKey = () => STORAGE_KEY;
