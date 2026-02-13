export type PhotographyCategory = {
  slug: string;
  title: string;
  description: string;
};

export const photographyCategories: PhotographyCategory[] = [
  {
    slug: "wildlife",
    title: "Wildlife",
    description: "Candid moments of animals in motion, patience, and quiet light.",
  },
  {
    slug: "landscape",
    title: "Landscape",
    description: "Wide frames, layered horizons, and the scale of open terrain.",
  },
  {
    slug: "astrophotography",
    title: "Astrophotography",
    description: "Night skies, long exposures, and the geometry of stars.",
  },
  {
    slug: "light-trails",
    title: "Light trails",
    description: "Long-exposure motion studies with city glow and traffic flow.",
  },
  {
    slug: "automobile",
    title: "Automobile",
    description: "Lines, reflections, and the craft of engineered motion.",
  },
  {
    slug: "events",
    title: "Events",
    description: "Crowd energy, candid moments, and the story between frames.",
  },
  {
    slug: "cityscapes",
    title: "Cityscapes",
    description: "Urban geometry, neon dusk, and the rhythm of streets.",
  },
];
