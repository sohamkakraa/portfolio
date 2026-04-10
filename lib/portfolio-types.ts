export type SocialLink = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
};

export type HeroContent = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaPrimary: {
    label: string;
    href: string;
  };
  ctaSecondary: {
    label: string;
    href: string;
  };
  badges: string[];
  /** When false, the third hero CTA (Viveka) is hidden. */
  showVivekaCta?: boolean;
  vivekaCta?: {
    label: string;
    href: string;
  };
};

export type HighlightItem = {
  title: string;
  description: string;
};

export type HighlightsSection = {
  title: string;
  description: string;
  items: HighlightItem[];
};

export type AboutSection = {
  title: string;
  subtitle: string;
  body: string;
  highlights: string[];
  /** Public path under /public, e.g. /about/portrait.jpg */
  portraitSrc?: string;
};

export type LifeSnapshot = {
  title: string;
  note: string;
  detail: string;
};

export type LifeBook = {
  title: string;
  author: string;
  theme: string;
  /** Tailwind gradient classes for placeholder when no cover */
  palette: string;
  /** Uploaded cover under /public/books/... */
  coverSrc?: string;
  /** Digits only ISBN for Open Library cover (fallback) */
  isbn?: string;
};

export type LifePlace = {
  place: string;
  context: string;
  note: string;
};

export type LifeEntertainment = {
  title: string;
  kind: "film" | "music" | "show";
  picks: string[];
};

export type LifeSection = {
  eyebrow: string;
  title: string;
  snapshots: LifeSnapshot[];
  books: LifeBook[];
  places: LifePlace[];
  entertainment: LifeEntertainment[];
};

export type ProjectItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  year: string;
  status?: string;
  link?: string;
};

export type ProjectsSection = {
  title: string;
  description: string;
  items: ProjectItem[];
};

export type PhotoMeta = {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutter?: string;
  iso?: string;
  focalLength?: string;
  date?: string;
  location?: string;
};

export type PhotoItem = {
  id: string;
  src: string;
  title: string;
  description: string;
  meta?: PhotoMeta;
  hidden?: boolean;
};

export type PhotographyCategory = {
  slug: string;
  title: string;
  description: string;
  accent: string;
  hidden?: boolean;
  images: PhotoItem[];
};

export type PhotographySection = {
  title: string;
  description: string;
  categories: PhotographyCategory[];
};

export type ContactSection = {
  title: string;
  description: string;
  ctaLabel: string;
  email: string;
};

export type SiteSettings = {
  name: string;
  role: string;
  location: string;
  email: string;
  nav: NavItem[];
  socials: SocialLink[];
};

export type FooterContent = {
  note: string;
  links: SocialLink[];
};

export type PortfolioData = {
  site: SiteSettings;
  hero: HeroContent;
  about: AboutSection;
  highlights: HighlightsSection;
  projects: ProjectsSection;
  photography: PhotographySection;
  contact: ContactSection;
  footer: FooterContent;
  /** “Beyond work” — life, books, places, entertainment */
  life: LifeSection;
};
