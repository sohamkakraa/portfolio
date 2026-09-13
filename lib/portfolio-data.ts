import fs from "fs";
import path from "path";
import type { PortfolioData, PhotographyCategory, PhotoItem } from "@/lib/portfolio-types";
import { workLogEntries } from "@/lib/work";

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
    role: "Incoming trainee at Prosus · starts 1 October",
    location: "Eindhoven, NL",
    email: "sohamkakra@gmail.com",
    nav: [
      { label: "About", href: "#about" },
      { label: "Projects", href: "#projects" },
      { label: "Photography", href: "#photography" },
      { label: "Life", href: "#life" },
      { label: "Blog", href: "/blog/day-1" },
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
      "M.Sc. Data Science & AI graduate from TU/e. I design and engineer end-to-end systems from model logic to production UX, with a strong focus on clarity and speed.",
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
      "Soham Kakra. M.Sc. Data Science & AI graduate from TU/e. Engineer of end-to-end systems — model logic to production UX.",
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
    portraitSrc: "/Me.png",
    body:
      "I completed an M.Sc. in Data Science and AI at Eindhoven University of Technology (TU/e) in 2026. Across internships and independent products, I have worked on AI/ML-driven systems, full-stack applications, and analytics workflows that improve real decision-making.",
    highlights: [
      "Prosus, Amsterdam · AI internship and master's thesis (Apr–28 Aug 2026) · traineeship from Oct 2026",
      "Eindhoven University of Technology (TU/e) · M.Sc. Data Science & AI (2024–2026)",
      "Etihad Credit Insurance, Dubai · Data Analyst & IT Support (2023–2024)",
      "Heriot-Watt University Dubai · B.Sc. Computer Science, AI (2020–2023)",
    ],
    // Editorial layout
    headline: ["I build systems", "where data, models,", "and {{em}}people{{/em}} meet."],
    pillars: [
      { title: "End-to-end", body: "From data ingestion and model design to product UI and deployment." },
      { title: "Readable",   body: "Turning complex model behavior into interfaces people can trust." },
      { title: "Real-time",  body: "Building systems that react quickly and stay reliable under live conditions." },
    ],
    // Projected from lib/work.ts rather than restated. The previous hand-written version had
    // drifted to three rows and no current role, which read as a student with one finished job.
    log: workLogEntries(),
    meta: [
      { label: "Based in",  value: "Eindhoven, NL" },
      { label: "Degree",    value: "M.Sc. DS&AI · TU/e" },
      { label: "Next",      value: "Prosus traineeship · 01 Oct" },
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
    /**
     * `metrics` here describe capabilities, not measurements.
     *
     * An earlier draft carried figures like a 1.84 Sharpe, 0.2% slippage and 94% fit accuracy
     * that were never measured. Precise numbers invite the one question that costs the most to
     * answer badly, so a metric only holds a figure when there is a real measurement behind it.
     */
    items: [
      {
        id: "uma",
        title: "UMA",
        summary:
          "A privacy-first medical record workspace that converts fragmented documents into structured patient timelines with clear retrieval, and much more!",
        tags: ["Healthcare"],
        year: "2026",
        status: "Prototype",
        link: "https://uma.sohamkakra.com",
        repo: "https://github.com/sohamkakraa/uma",
        storyline: [
          { label: "trigger", body: "Medical records are scattered across PDFs, scans, and discharge letters — patients arrive at appointments without context and doctors spend the first minutes reconstructing history instead of deciding." },
          { label: "move", body: "Built UMA: a privacy-first workspace that ingests fragmented documents, runs structured extraction pipelines, and assembles them into a clean, chronological patient timeline with semantic search and retrieval." },
          { label: "result", body: "A working prototype that turns unstructured medical uploads into navigable records — reducing the time to locate a specific test result or diagnosis from minutes of manual scanning to a single query." },
        ],
        // Capabilities, not measurements. See the note on the projects array above.
        metrics: [
          { label: "Input formats", value: "PDF, images, text" },
          { label: "Output", value: "Structured timeline" },
          { label: "Privacy model", value: "Local-first" },
        ],
        stack: ["Next.js", "Python", "LLM extraction", "RAG pipeline", "Vercel"],
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
          { label: "move", body: "Recurring-expense detection plus Bayesian forecast bands per category, replanned as new spending lands." },
          { label: "result", body: "A rolling cashflow horizon that updates as you spend, so the question stops being what did I spend and becomes what can I afford." },
        ],
        metrics: [
          { label: "Signal", value: "Recurring-expense detection" },
          { label: "Method", value: "Bayesian forecast bands" },
          { label: "Horizon", value: "Rolling 30-day" },
        ],
        stack: ["Next.js", "Time-series", "Bayesian"],
      },
      {
        // Renamed to Latent.Alpha. The id stays `robotrader` so the repo link, the palette
        // and any stored CMS edits keyed to it survive the rename.
        id: "robotrader",
        title: "Latent.Alpha",
        summary:
          "A signal-driven trading platform with live dashboards, strategy backtesting, and autonomous execution controls.",
        tags: ["AI/ML", "Trading", "Real-time"],
        year: "2026",
        status: "Prototype",
        link: "https://latent.alpha.sohamkakra.com",
        repo: "https://github.com/sohamkakraa/robotrader",
        storyline: [
          { label: "trigger", body: "Retail and semi-professional traders lack a unified environment to research signals, validate strategies on historical data, and move to live execution — they switch between disconnected tools at every step." },
          { label: "move", body: "Built Latent.Alpha: a signal-driven trading platform combining live market dashboards, a backtesting engine for strategy validation, and autonomous execution controls — all in one coherent interface." },
          { label: "result", body: "A prototype platform where a strategy can go from idea to backtest to live execution without leaving the product, with real-time P&L visibility and configurable risk controls at each stage." },
        ],
        metrics: [
          { label: "Data", value: "Live market feeds" },
          { label: "Backtesting", value: "Historical replay engine" },
          { label: "Execution", value: "Autonomous + manual modes" },
        ],
        stack: ["Next.js", "Python", "WebSockets", "Trading APIs", "Vercel"],
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
          { label: "move", body: "A digital avatar built from real body measurements, a design studio driven either visually or by plain language, and a pipeline that matches the result to retailers and local tailors." },
          { label: "result", body: "A garment designed against your own measurements is routed to a retailer who already stocks something close, or to a tailor who can make it." },
        ],
        metrics: [
          { label: "Input", value: "Body measurements" },
          { label: "Design", value: "Visual studio or plain language" },
          { label: "Fulfilment", value: "Retailers and local tailors" },
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
          { label: "result", body: "A live site the firm uses as its front door, where each service is explained in language a prospective client can act on." },
        ],
        metrics: [
          { label: "Client", value: "Dubai tax advisory" },
          { label: "Scope", value: "Structure, copy, and build" },
          { label: "Status", value: "Live, in client use" },
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
        note: "M.Sc. at TU/e and a strong builder ecosystem.",
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
      "I recently completed my M.Sc. in Data Science and AI at TU/e and start a traineeship with Prosus on 1 October 2026. I am always open to conversations about AI, data systems, and full-stack product work.",
    ctaLabel: "Email me",
    email: "sohamkakra@gmail.com",
    headline: ["Let's {{em}}build{{/em}}", "something {{em}}quietly bold{{/em}}."],
  },
  footer: {
    note: "Designed & built · soham kakra · 2026",
    versionNote: "v3.0 · last edit: today",
    links: [],
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
