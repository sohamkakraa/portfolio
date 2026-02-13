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
};
