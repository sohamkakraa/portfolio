export type SocialLink = {
  label: string;
  href: string;
};

export type NavItem = {
  label: string;
  href: string;
};

/**
 * Headline text supports inline italic accents using `{{em}}…{{/em}}`.
 * Example: "that {{em}}feel human{{/em}}." renders the phrase between the
 * markers in italic Fraunces with the accent color.
 */
export type TableOfContentsEntry = {
  num: string;
  label: string;
  page: string;
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

  // ── Editorial / handoff fields ──────────────────────────────────
  /** Top-left issue line, e.g. "Issue №07 · Eindhoven". */
  issueLabel?: string;
  /** Top-right date / status line, e.g. "May 2026 / now reading". */
  dateLabel?: string;
  /** Three-line stylized headline; supports `{{em}}…{{/em}}` italic accents. */
  headline?: string[];
  /** Short paragraph under "The masthead" label. */
  masthead?: string;
  /** Right column "In this issue" table-of-contents entries. */
  tableOfContents?: TableOfContentsEntry[];
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

export type AboutPillar = {
  title: string;
  body: string;
};

export type AboutLogEntry = {
  year: string;
  org: string;
  role: string;
};

export type AboutMetaEntry = {
  label: string;
  value: string;
};

export type AboutSection = {
  title: string;
  subtitle: string;
  body: string;
  highlights: string[];
  /** Path under /public (e.g. /about/portrait.jpg) or absolute URL (e.g. Vercel Blob). */
  portraitSrc?: string;

  // ── Editorial / handoff fields ──────────────────────────────────
  /** Three-line stylized headline; supports `{{em}}…{{/em}}` italic accents. */
  headline?: string[];
  /** Three pillars rendered under the manifesto ("End-to-end", "Readable", etc.). */
  pillars?: AboutPillar[];
  /** Tabular CV log shown beneath pillars. */
  log?: AboutLogEntry[];
  /** Meta table beside the portrait (Based in / Studying / Available / Reach). */
  meta?: AboutMetaEntry[];
  /** Watermark text in upper-left corner of portrait card. */
  portraitLabel?: string;
  /** Watermark text in lower-right corner of portrait card. */
  portraitMeta?: string;
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
  /** Title supports `{{em}}…{{/em}}` italic accents. */
  title: string;
  snapshots: LifeSnapshot[];
  books: LifeBook[];
  places: LifePlace[];
  entertainment: LifeEntertainment[];
  /** Label above books column. Defaults to "Reading library". */
  readingLabel?: string;
  /** Label above places column. Defaults to "Places". */
  placesLabel?: string;
};

export type ProjectStorylineStep = {
  label: "trigger" | "move" | "result";
  body: string;
};

export type ProjectMetric = {
  label: string;
  value: string;
};

export type ProjectItem = {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  year: string;
  status?: string;
  /** Live website / demo URL. */
  link?: string;
  /** Source code / repository URL. */
  repo?: string;
  /** Optional 3-step storyline used by the hover-expand projects grid. */
  storyline?: ProjectStorylineStep[];
  /** Optional 2-4 quantitative metrics shown on expand. */
  metrics?: ProjectMetric[];
  /** Flat list of stack tags shown on expand. */
  stack?: string[];
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
  /** Free-text legacy location (kept for back-compat with AI rankings). */
  location?: string;
  /** Structured city / country used by the globe + lightbox sidebar. */
  city?: string;
  country?: string;
  /** Specific location / point of interest, e.g. "Masai Mara National Park". */
  landmark?: string;
};

export type EquipmentList = {
  cameras: string[];
  lenses: string[];
};

export type PhotoItem = {
  id: string;
  src: string;
  title: string;
  description: string;
  meta?: PhotoMeta;
  hidden?: boolean;
  /** AI-assigned quality rank (1–10, higher = better). Used for sort order. */
  rank?: number;
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
  /** Two-line stylized headline; supports `{{em}}…{{/em}}` italic accents. */
  headline?: string[];
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
  /** Optional second line e.g. "v3.0 · last edit: today" shown right-aligned. */
  versionNote?: string;
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
  /** My equipment — autofill source for image camera/lens fields. */
  equipment?: EquipmentList;
};
