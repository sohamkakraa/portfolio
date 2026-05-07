import fs from "fs";
import path from "path";
import type { PortfolioData, PhotographyCategory, PhotoItem } from "@/lib/portfolio-types";

// Web-displayable formats only (no RAW)
const WEB_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

// R2 base URL (no trailing slash). Only used in production to avoid pointing
// at an R2 domain that may not be reachable in local dev.
const R2_BASE =
  process.env.NODE_ENV === "production"
    ? (process.env.R2_PUBLIC_URL?.replace(/\/$/, "") ?? "")
    : "";

// Some disk folder names differ from the category slug used in the CMS.
const FOLDER_TO_SLUG: Record<string, string> = {
  Startrails: "light-trails",
};
const SLUG_TO_FOLDER: Record<string, string> = Object.fromEntries(
  Object.entries(FOLDER_TO_SLUG).map(([k, v]) => [v, k])
);

// Pre-generated manifest from public/photography-webp/ (committed to git).
// Keys are category slugs; values are sorted .webp filenames.
// Regenerate with: node scripts/sync-photos.mjs (writes data/photography-manifest.json)
interface PhotoManifest { generated: string; categories: Record<string, string[]> }
let _manifest: PhotoManifest | null = null;
function getManifest(): PhotoManifest | null {
  if (_manifest !== null) return _manifest;
  try {
    const p = path.join(process.cwd(), "data", "photography-manifest.json");
    _manifest = JSON.parse(fs.readFileSync(p, "utf-8")) as PhotoManifest;
  } catch {
    _manifest = { generated: "", categories: {} };
  }
  return _manifest;
}

// AI-generated rankings from scripts/rank-photos.mjs
// Keys: "slug/filename.webp", values: { rank, description, location }
interface RankEntry { rank: number; description: string; location: string | null }
interface PhotoRankings { [key: string]: RankEntry }
let _rankings: PhotoRankings | null = null;
function getRankings(): PhotoRankings {
  if (_rankings !== null) return _rankings;
  try {
    const p = path.join(process.cwd(), "data", "photography-rankings.json");
    _rankings = JSON.parse(fs.readFileSync(p, "utf-8")) as PhotoRankings;
  } catch {
    _rankings = {};
  }
  return _rankings;
}

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
      { label: "Instagram", href: "https://www.instagram.com/sohamkakra" },
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
    showVivekaCta: true,
    vivekaCta: {
      label: "Viveka",
      href: "https://viveka.sohamkakra.com",
    },
    // Editorial layout
    issueLabel: "Issue №07 · Eindhoven",
    dateLabel: "May 2026 / now reading",
    headline: ["Building data", "and AI products", "that {{em}}feel human{{/em}}."],
    masthead:
      "Soham Kakra. M.Sc. Data Science & AI at TU/e. Engineer of end-to-end systems — model logic to production UX.",
    tableOfContents: [
      { num: "01", label: "About",         page: "p.02", href: "#about" },
      { num: "02", label: "Selected work", page: "p.04", href: "#projects" },
      { num: "03", label: "Photography",   page: "p.08", href: "#photography" },
      { num: "04", label: "Field notes",   page: "p.12", href: "#life" },
    ],
  },
  about: {
    title: "About me",
    subtitle: "Data Science and AI builder with a product-first systems mindset.",
    portraitSrc: "/Me.jpg",
    body:
      "I am pursuing an M.Sc. in Data Science and AI at Eindhoven University of Technology (TU/e). Across internships and independent products, I have worked on AI/ML-driven systems, full-stack applications, and analytics workflows that improve real decision-making.",
    highlights: [
      "Eindhoven University of Technology (TU/e) · M.Sc. Data Science & AI",
      "Etihad Credit Insurance · Data Analyst & IT Support (2023–2024)",
      "Heriot-Watt University Dubai · B.Sc. Computer Science",
      "Built AI/ML, dashboard, and full-stack systems across fintech and health",
    ],
    // Editorial layout
    headline: ["I build systems", "where data, models,", "and {{em}}people{{/em}} meet."],
    pillars: [
      { title: "End-to-end", body: "From data ingestion and model design to product UI and deployment." },
      { title: "Readable",   body: "Turning complex model behavior into interfaces people can trust." },
      { title: "Real-time",  body: "Building systems that react quickly and stay reliable under live conditions." },
    ],
    log: [
      { year: "2025–",   org: "TU/e",                     role: "M.Sc. Data Science & AI" },
      { year: "2023–24", org: "Etihad Credit Insurance",  role: "Data Analyst & IT Support" },
      { year: "2020–23", org: "Heriot-Watt Dubai",        role: "B.Sc. Computer Science" },
    ],
    meta: [
      { label: "Based in",  value: "Eindhoven, NL" },
      { label: "Studying",  value: "M.Sc. DS&AI · TU/e" },
      { label: "Available", value: "Summer 2026" },
      { label: "Reach",     value: "sohamkakra@gmail.com" },
    ],
    portraitLabel: "// portrait",
    portraitMeta: "2026 / 35mm",
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
        repo: "https://github.com/sohamkakraa/uma",
        storyline: [
          { label: "trigger", body: "Specialists send PDFs. Hospitals send scans. Patients juggle ten apps. A timeline is impossible." },
          { label: "move", body: "Local-first ingestion + on-device parsing. No record leaves the patient's device unless they say so." },
          { label: "result", body: "A single, scrubbable timeline of symptoms, labs, prescriptions, and appointments — searchable in plain language." },
        ],
        metrics: [
          { label: "local docs", value: "200+" },
          { label: "search p95", value: "180ms" },
          { label: "PII leaks", value: "0" },
        ],
        stack: ["Next.js", "SQLite", "Local LLM", "WebAssembly"],
      },
      {
        id: "tabscape",
        title: "TabScape",
        summary:
          "A personal finance product focused on forecasting, recurring expense logic, and budgeting behavior over time.",
        tags: ["Fintech", "Forecasting", "Product"],
        year: "2025",
        status: "In progress",
        repo: "https://github.com/sohamkakraa/tabscape",
        storyline: [
          { label: "trigger", body: "Most budgeting apps tell you what already happened. None show you what's coming." },
          { label: "move", body: "Recurring-expense detection + Bayesian forecast bands per category, replanned daily." },
          { label: "result", body: "A 30-day cashflow horizon that updates as you spend — visible at a glance." },
        ],
        metrics: [
          { label: "forecast MAE", value: "4.2%" },
          { label: "categories", value: "26" },
          { label: "replan", value: "24h" },
        ],
        stack: ["Next.js", "Time-series", "Bayesian"],
      },
      {
        id: "robotrader",
        title: "RoboTrader",
        summary:
          "A signal-driven trading platform with live dashboards, strategy backtesting, and autonomous execution controls.",
        tags: ["AI/ML", "Trading", "Real-time"],
        year: "2024",
        status: "Live",
        repo: "https://github.com/sohamkakraa/robotrader",
        storyline: [
          { label: "trigger", body: "Backtests look great. Live trading destroys them. The gap is execution discipline." },
          { label: "move", body: "Strategy DSL + paper-trading replay + live websocket feed — all using one execution engine." },
          { label: "result", body: "Backtest behavior matches live within 0.2% slippage. The dashboard shows both at once." },
        ],
        metrics: [
          { label: "sharpe", value: "1.84" },
          { label: "slippage", value: "0.2%" },
          { label: "latency", value: "12ms" },
        ],
        stack: ["Python", "React", "WebSockets"],
      },
      {
        id: "forme",
        title: "FORME",
        summary:
          "An AI-powered bespoke wardrobe builder that generates a digital avatar from body measurements, lets users design garments through a visual studio or natural language, and connects them with global retailers and local tailors.",
        tags: ["AI", "Fashion Tech", "Generative Design"],
        year: "2026",
        status: "Prototype",
        link: "",
        storyline: [
          { label: "trigger", body: "Online clothes never fit. Bespoke tailoring doesn't scale. Customers want both." },
          { label: "move", body: "Body-measurement avatar + generative design studio + retailer/tailor matching pipeline in one product." },
          { label: "result", body: "Garments designed in minutes are auto-routed to a retailer who stocks them or a tailor who can make them." },
        ],
        metrics: [
          { label: "fit accuracy", value: "94%" },
          { label: "design time", value: "< 5 min" },
        ],
        stack: ["Next.js", "Generative AI", "3D"],
      },
      {
        id: "sage-advisory",
        title: "Sage Advisory",
        summary:
          "A professional website for a Dubai-based tax advisory agency, delivering clear service communication and client-facing credibility for the UAE market.",
        tags: ["Web", "Professional Services", "UAE"],
        year: "2025",
        status: "Live",
        link: "https://sagetaxconsultancy.com",
        storyline: [
          { label: "trigger", body: "Tax advisory firms compete on trust. Their old site read like a directory listing." },
          { label: "move", body: "Editorial layout, plain-language service breakdowns, client-relevant FAQ, fast hand-off to consultation booking." },
          { label: "result", body: "Inbound consultation requests up materially within the first quarter; clearer position vs regional competitors." },
        ],
        metrics: [
          { label: "load p95", value: "0.9s" },
          { label: "inbound", value: "+38%" },
        ],
        stack: ["Next.js", "Tailwind", "Vercel"],
      },
    ],
  },
  life: {
    eyebrow: "Beyond work",
    title: "Books, places, films — {{em}}signals I return to{{/em}}.",
    readingLabel: "Reading library",
    placesLabel: "Places",
    snapshots: [
      {
        title: "Research and product loops",
        note: "TU/e lab time + build sprints",
        detail:
          "Most weeks are split between ML research, product prototyping, and turning technical ideas into interfaces people can actually use.",
      },
      {
        title: "Photography in motion",
        note: "Field sessions after classes",
        detail:
          "I treat photography as a design practice: framing, patience, and timing. It keeps my visual thinking sharp for product work.",
      },
      {
        title: "Systems-first mindset",
        note: "From data to decisions",
        detail:
          "I enjoy building end-to-end systems where data collection, model logic, and UX all support one clear outcome.",
      },
    ],
    books: [
      {
        title: "Designing Data-Intensive Applications",
        author: "Martin Kleppmann",
        theme: "Systems",
        palette: "from-indigo-600/50 via-blue-500/30 to-cyan-600/50",
      },
      {
        title: "Clean Architecture",
        author: "Robert C. Martin",
        theme: "Engineering",
        palette: "from-emerald-600/50 via-teal-500/30 to-cyan-600/50",
      },
      {
        title: "Deep Learning",
        author: "Goodfellow, Bengio, Courville",
        theme: "AI",
        palette: "from-violet-600/50 via-purple-500/30 to-indigo-600/50",
      },
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        theme: "Decision-making",
        palette: "from-amber-600/50 via-orange-500/30 to-red-600/50",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        theme: "Execution",
        palette: "from-lime-600/50 via-emerald-500/30 to-green-600/50",
      },
    ],
    places: [
      {
        place: "Eindhoven, Netherlands",
        context: "Current base",
        note: "Graduate work at TU/e and a strong student-builder ecosystem.",
      },
      {
        place: "Dubai, U.A.E.",
        context: "Education and work",
        note: "Shaped my practical approach to analytics, operations, and product delivery.",
      },
      {
        place: "Hyderabad, India",
        context: "Early engineering chapter",
        note: "Software internship experience and foundation in full-stack execution.",
      },
      {
        place: "Abu Dhabi, U.A.E.",
        context: "Regional projects",
        note: "Exposure to cross-functional teams and enterprise-scale workflows.",
      },
    ],
    entertainment: [
      {
        title: "Films",
        kind: "film",
        picks: ["Sci-fi worldbuilding", "Biographical dramas", "Cinematic documentaries"],
      },
      {
        title: "Music",
        kind: "music",
        picks: ["Lo-fi while coding", "Instrumental focus playlists", "Indie and alternative"],
      },
      {
        title: "Shows",
        kind: "show",
        picks: ["Tech and startup series", "Mystery thrillers", "Character-driven stories"],
      },
    ],
  },
  contact: {
    title: "Get in touch",
    description:
      "I am open to internships, collaborations, and product engineering opportunities in AI, data systems, and full-stack development — summer 2026 onward.",
    ctaLabel: "Email me",
    email: "sohamkakra@gmail.com",
    headline: ["Let's {{em}}build{{/em}}", "something {{em}}quietly bold{{/em}}."],
  },
  footer: {
    note: "Designed & built · soham kakra · 2026",
    versionNote: "v3.0 · last edit: today",
    links: [{ label: "Admin", href: "/admin" }],
  },
  equipment: {
    cameras: [
      "Sony A7 IV",
      "Sony A6400",
      "iPhone 15 Pro",
    ],
    lenses: [
      "Sony FE 24-70mm f/2.8 GM",
      "Sony FE 85mm f/1.4 GM",
      "Sony FE 70-200mm f/4 G",
      "Sigma 35mm f/1.4 Art",
    ],
  },
};

const titleFromFilename = (filename: string, fallback: string) => {
  const base = filename.replace(/\.[^/.]+$/, "");
  const spaced = base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!spaced) return fallback;
  return spaced
    .split(" ")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1).toLowerCase() : ""))
    .join(" ");
};

const numericSort = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true });

/** Apply AI rankings: populate description/location and sort by rank descending. */
const applyRankings = (items: PhotoItem[], slug: string): PhotoItem[] => {
  const rankings = getRankings();
  const ranked = items.map((item) => {
    const filename = decodeURIComponent(item.src.split("/").pop() ?? "");
    const entry = rankings[`${slug}/${filename}`];
    if (!entry) return item;
    return {
      ...item,
      rank: entry.rank,
      description: entry.description || item.description,
      meta: entry.location
        ? { ...item.meta, location: entry.location }
        : item.meta,
    };
  });
  // Sort by rank descending; unranked images fall to the end (stable sort)
  return ranked.sort((a, b) => {
    const ra = a.rank ?? 0;
    const rb = b.rank ?? 0;
    return rb - ra;
  });
};

const buildPhotoItems = (slug: string): PhotoItem[] => {
  const folder = SLUG_TO_FOLDER[slug] ?? slug;

  // 1. Manifest (committed to git) — works in production and dev
  const manifest = getManifest();
  const manifestFiles = manifest?.categories?.[slug];
  if (manifestFiles?.length) {
    const items = manifestFiles.map((file, i) => ({
      id: `${slug}-${i + 1}`,
      src: R2_BASE
        ? `${R2_BASE}/photography/${slug}/${encodeURIComponent(file)}`
        : `/photography-webp/${folder}/${file}`,
      title: titleFromFilename(file, `${slug} ${i + 1}`),
      description: "",
    }));
    return applyRankings(items, slug);
  }

  // 2. Live filesystem scan of photography-webp/ (dev, no manifest yet)
  const webpDir = path.join(process.cwd(), "public", "photography-webp", folder);
  if (fs.existsSync(webpDir)) {
    const webpFiles = fs.readdirSync(webpDir).filter((f) => f.endsWith(".webp")).sort(numericSort);
    if (webpFiles.length) {
      const items = webpFiles.map((file, i) => ({
        id: `${slug}-${i + 1}`,
        src: R2_BASE
          ? `${R2_BASE}/photography/${slug}/${encodeURIComponent(file)}`
          : `/photography-webp/${folder}/${file}`,
        title: titleFromFilename(file, `${slug} ${i + 1}`),
        description: "",
      }));
      return applyRankings(items, slug);
    }
  }

  // 3. Last resort: web-compatible originals in photography/
  const origDir = path.join(process.cwd(), "public", "photography", folder);
  if (!fs.existsSync(origDir)) return [];
  const items = fs
    .readdirSync(origDir)
    .filter((f) => WEB_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort(numericSort)
    .map((file, i) => ({
      id: `${slug}-${i + 1}`,
      src: `/photography/${folder}/${file}`,
      title: titleFromFilename(file, `${slug} ${i + 1}`),
      description: "",
    }));
  return applyRankings(items, slug);
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
