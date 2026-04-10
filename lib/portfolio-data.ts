import fs from "fs";
import path from "path";
import type { PortfolioData, PhotographyCategory, PhotoItem } from "@/lib/portfolio-types";

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".avif", ".JPG", ".JPEG"];

const CATEGORY_SEEDS: Omit<PhotographyCategory, "images">[] = [
  {
    slug: "wildlife",
    title: "Wildlife",
    description: "Quiet encounters and slow-frame patience in the wild.",
    accent: "#7DD3FC",
  },
  {
    slug: "landscape",
    title: "Landscape",
    description: "Open horizons and layered atmospheres.",
    accent: "#A5B4FC",
  },
  {
    slug: "astrophotography",
    title: "Astrophotography",
    description: "Long exposures, star geometry, and cosmic texture.",
    accent: "#C4B5FD",
  },
  {
    slug: "light-trails",
    title: "Light Trails",
    description: "Motion carved into neon ribbons.",
    accent: "#F9A8D4",
  },
  {
    slug: "automobile",
    title: "Automobile",
    description: "Reflections, curves, and engineered silhouettes.",
    accent: "#FCA5A5",
  },
  {
    slug: "events",
    title: "Events",
    description: "Candid energy and story between frames.",
    accent: "#FCD34D",
  },
  {
    slug: "cityscapes",
    title: "Cityscapes",
    description: "Urban grids, midnight color, and volume.",
    accent: "#6EE7B7",
  },
];

const basePortfolioData: Omit<PortfolioData, "photography"> = {
  site: {
    name: "Soham Kakra",
    role: "M.Sc. Data Science & AI student · Full-stack and ML engineer",
    location: "Eindhoven, NL",
    email: "sohamkakra@gmail.com",
    nav: [
      { label: "About", href: "#about" },
      { label: "Projects", href: "#projects" },
      { label: "Photography", href: "#photography" },
      { label: "Life", href: "#life" },
      { label: "Contact", href: "#contact" },
    ],
    socials: [
      { label: "GitHub", href: "https://github.com/sohamkakraa" },
      { label: "LinkedIn", href: "https://www.linkedin.com/in/sohamkakra" },
      { label: "Email", href: "mailto:sohamkakra@gmail.com" },
    ],
  },
  hero: {
    eyebrow: "AI research, full-stack systems, and visual storytelling",
    titleLine1: "I build data and AI",
    titleLine2: "products that feel human.",
    subtitle:
      "M.Sc. Data Science & AI at TU/e. I design and engineer end-to-end systems from model logic to production UX, with a strong focus on clarity and speed.",
    ctaPrimary: {
      label: "View projects",
      href: "#projects",
    },
    ctaSecondary: {
      label: "Explore photography",
      href: "#photography",
    },
    badges: ["AI/ML systems", "Data visualization", "Full-stack engineering", "Real-time products"],
  },
  about: {
    title: "About me",
    subtitle: "Data Science and AI builder with a product-first systems mindset.",
    body:
      "I am pursuing an M.Sc. in Data Science and AI at Eindhoven University of Technology (TU/e). Across internships and independent products, I have worked on AI/ML-driven systems, full-stack applications, and analytics workflows that improve real decision-making.",
    highlights: [
      "Eindhoven University of Technology (TU/e) · M.Sc. Data Science & AI",
      "Etihad Credit Insurance · Data Analyst & IT Support (2023–2024)",
      "Heriot-Watt University Dubai · B.Sc. Computer Science",
      "Built AI/ML, dashboard, and full-stack systems across fintech and health",
    ],
  },
  highlights: {
    title: "What I optimize for",
    description: "A practical stack that connects data, models, and user experience.",
    items: [
      {
        title: "End-to-end delivery",
        description: "From data ingestion and model design to product UI and deployment workflows.",
      },
      {
        title: "Readable intelligence",
        description: "Turning complex model behavior into interfaces people can trust and use.",
      },
      {
        title: "Real-time thinking",
        description: "Building systems that react quickly and stay reliable under live conditions.",
      },
    ],
  },
  projects: {
    title: "Selected projects",
    description:
      "A curated mix of AI, analytics, and product engineering work across healthcare, fintech, and autonomous decision systems.",
    items: [
      {
        id: "uma",
        title: "UMA",
        summary:
          "A privacy-first medical record workspace that converts fragmented documents into structured patient timelines with clear retrieval.",
        tags: ["Healthcare", "Next.js", "Data UX"],
        year: "2025",
        status: "Prototype",
        link: "https://uma-taupe-rho.vercel.app",
      },
      {
        id: "tabscape",
        title: "TabScape",
        summary:
          "A personal finance product focused on forecasting, recurring expense logic, and budgeting behavior over time.",
        tags: ["Fintech", "Forecasting", "Product"],
        year: "2025",
        status: "In progress",
        link: "https://github.com/sohamkakraa",
      },
      {
        id: "robotrader",
        title: "RoboTrader",
        summary:
          "A signal-driven trading platform with live dashboards, strategy backtesting, and autonomous execution controls.",
        tags: ["AI/ML", "Trading", "Real-time"],
        year: "2024",
        status: "Live",
        link: "https://github.com/sohamkakraa",
      },
    ],
  },
  contact: {
    title: "Let’s build something meaningful",
    description:
      "I am open to internships, collaborations, and product engineering opportunities in AI, data systems, and full-stack development.",
    ctaLabel: "Email me",
    email: "sohamkakra@gmail.com",
  },
  footer: {
    note: "Designed and built by Soham Kakra · 2026",
    links: [{ label: "Admin", href: "/admin" }],
  },
};

const titleFromFilename = (filename: string, fallback: string) => {
  const base = filename.replace(/\.[^/.]+$/, "");
  const spaced = base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return fallback;
  return spaced
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : ""))
    .join(" ");
};

const listImages = (slug: string) => {
  const folderPath = path.join(process.cwd(), "public", "photography", slug);
  if (!fs.existsSync(folderPath)) return [];
  return fs
    .readdirSync(folderPath)
    .filter((file) => IMAGE_EXTENSIONS.some((ext) => file.endsWith(ext)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

const buildPhotoItems = (slug: string): PhotoItem[] => {
  const files = listImages(slug);
  if (!files.length) {
    return [];
  }

  return files.map((file, index) => ({
    id: `${slug}-${index + 1}`,
    src: `/photography/${slug}/${file}`,
    title: titleFromFilename(file, `${slug} ${index + 1}`),
    description: "Add a short description for this image.",
  }));
};

export const getDefaultPortfolioData = (): PortfolioData => {
  const categories = CATEGORY_SEEDS.map((category) => ({
    ...category,
    images: buildPhotoItems(category.slug),
  }));

  return {
    ...basePortfolioData,
    photography: {
      title: "Photography",
      description:
        "A visual journal from field sessions across cities, landscapes, and night skies. Open any collection and move through it seamlessly.",
      categories,
    },
  };
};
