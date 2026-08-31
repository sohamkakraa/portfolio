export const profile = {
  name: "Soham Kakra",
  location: "Eindhoven, Netherlands",
  email: "sohamkakra@gmail.com",
  website: "sohamkakra.com",
  linkedin: "linkedin.com/in/sohamkakra",
  github: "github.com/sohamkakraa",
};

const prosusResearch = [
  "Designed and built an on-demand structuring RAG system for enterprise questions requiring cross-document aggregation, causal reasoning, and reusable follow-ups across 1,120 synthetic Jira-style tickets and anonymized internal meeting documents.",
  "Built deterministic code-execution aggregation, evidence-grounded graph extraction, experiment tracking, cost controls, and an evaluation framework comparing six retrieval and agentic variants with deterministic checks and a two-model judge panel.",
];

const chuck =
  "Own Chuck, a three-person Slack-based 3D design-and-printing project; shipped the first end-to-end demo in 3–4 weeks and generated 15+ successfully printed items from text, images, and uploaded models using 3D AI Studio and agentic CAD.";

const roles = {
  prosus: {
    organization: "Prosus",
    title: "AI Intern — Master's Thesis",
    location: "Amsterdam, Netherlands",
    dates: "Apr 2026 – Present",
    bullets: [...prosusResearch, chuck],
  },
  idc: {
    organization: "IDC ABA Employment Services",
    title: "Data & AI Intern",
    dates: "Jul 2025 – Aug 2025",
    bullets: [
      "Built Microsoft Copilot agents for internal IT helpdesk and insurance risk-analysis workflows; also contributed to the company website redesign.",
    ],
  },
  amana: {
    organization: "Amana Global Partners",
    title: "Research Intern",
    dates: "Aug 2025",
    bullets: [
      "Scouted and assessed early-stage AI companies across defence, automotive, aerospace, and adjacent sectors using investment-analysis frameworks.",
    ],
  },
  eci: {
    organization: "Etihad Credit Insurance",
    title: "Data Analyst & IT Support",
    location: "Dubai, United Arab Emirates",
    dates: "Aug 2023 – Aug 2024",
    bullets: [
      "Designed Power BI dashboards for finance, risk, and HR reporting; automated multi-step data pipelines and built a SharePoint intranet for cross-team communication.",
    ],
  },
  firstGroup: {
    organization: "The First Group",
    title: "Learning & Development Intern",
    location: "Dubai, United Arab Emirates",
    dates: "Nov 2022 – May 2023",
    bullets: [
      "Managed Totara LMS deployment and operations, then analyzed training data to report on programme effectiveness.",
    ],
  },
  apptmyz: {
    organization: "Apptmyz LLC",
    title: "Software Developer Intern",
    location: "Hyderabad, India — Remote",
    dates: "Jun 2021 – Sep 2021",
    bullets: [
      "Developed and maintained AngularJS features for an employee-management system.",
    ],
  },
};

const education = [
  {
    organization: "Eindhoven University of Technology (TU/e)",
    title: "M.Sc. Data Science & Artificial Intelligence",
    location: "Eindhoven, Netherlands",
    dates: "Sep 2024 – Sep 2026 (expected)",
    detail:
      "Master's thesis at Prosus: adaptive retrieval and on-demand structure for complex enterprise queries.",
  },
  {
    organization: "Heriot-Watt University",
    title: "B.Sc. Computer Science, Artificial Intelligence Specialisation",
    location: "Dubai, United Arab Emirates",
    dates: "Sep 2020 – Jul 2023",
    detail: "With Honours, Second Class Upper Division.",
  },
];

const sage = {
  name: "Sage Advisory",
  label: "Live client delivery",
  url: "sagetaxconsultancy.com",
  description:
    "Designed and shipped a live website for a Dubai tax advisory firm, owning structure, copy, implementation, and deployment with Next.js, Tailwind CSS, and Vercel.",
};

const skills = [
  {
    label: "Languages & product",
    value: "Python, TypeScript, JavaScript, Next.js, React, Git",
  },
  {
    label: "AI & evaluation",
    value:
      "RAG, LLM evaluation, agentic systems, FAISS, SQLite/FTS5, NetworkX, BGE reranking, Claude and OpenAI APIs",
  },
  {
    label: "Build & deploy",
    value:
      "Cursor, Claude Code, Codex, Vercel, Azure, Microsoft Power Platform, Figma",
  },
];

export const variants = {
  master: {
    slug: "master",
    publicFilename: "soham-kakra-resume.pdf",
    privateFilename: "soham-kakra-resume-private.pdf",
    headline: "AI Product Builder · RAG, Agents & Full-Stack Prototyping",
    summary:
      "AI product builder completing an M.Sc. in Data Science & AI at TU/e. Turns ambiguous ideas into working systems across retrieval, agents, and full-stack products; uses AI coding tools to prototype quickly and evaluates outputs with targeted evals, experiments, and model comparisons.",
    signal: ["BUILD", "EVALUATE", "SHIP"],
    experience: [roles.prosus, roles.amana, roles.idc, roles.eci],
    additionalExperience: [roles.firstGroup, roles.apptmyz],
    projects: [sage],
    education,
    skills,
  },
  "prosus-ai-engineer": {
    slug: "prosus-ai-engineer",
    privateFilename: "soham-kakra-prosus-ai-engineer.pdf",
    headline: "AI Engineer · Zero-to-One Product Builder",
    summary:
      "Early-career AI builder who moves from an ambiguous concept to a working demo, then tests what deserves another iteration. Combines Python and LLM systems with Next.js product delivery, using Cursor, Claude Code, and Codex as part of a fast, evaluation-led build loop.",
    signal: ["PROTOTYPE", "TEST", "ITERATE"],
    experience: [
      {
        ...roles.prosus,
        bullets: [chuck, ...prosusResearch],
      },
      roles.idc,
      roles.eci,
    ],
    projects: [sage],
    education,
    skills,
  },
  "prosus-talent-lab-builder": {
    slug: "prosus-talent-lab-builder",
    privateFilename: "soham-kakra-prosus-talent-lab-builder.pdf",
    headline: "AI Product Builder · Research, Prototyping & Product Judgment",
    summary:
      "Builder first: takes AI products from a loose brief to a demonstrable system, while bringing research discipline and commercial judgment to what gets built next. Finishing an M.Sc. thesis at Prosus and available full-time from October 2026.",
    signal: ["BUILDER", "RESEARCH DEPTH", "PRODUCT JUDGMENT"],
    experience: [
      {
        ...roles.prosus,
        bullets: [chuck, ...prosusResearch],
      },
      roles.amana,
      roles.idc,
    ],
    projects: [sage],
    education,
    skills,
  },
};

export function getVariant(slug) {
  const variant = variants[slug];
  if (!variant) {
    throw new Error(
      `Unknown resume variant "${slug}". Expected one of: ${Object.keys(variants).join(", ")}`
    );
  }
  return variant;
}
