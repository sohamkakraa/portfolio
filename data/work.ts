export type WorkProject = {
  slug: string;
  title: string;
  meta: string;
  description: string;
  wip: boolean;
  links?: {
    live?: string;
    github?: string;
  };
  snapshots?: string[];
};

export const workProjects: WorkProject[] = [
  {
    slug: "medvault",
    title: "MedVault",
    meta: "Product engineering · Health records",
    description:
      "Built a high-fidelity Next.js prototype that turns scattered medical PDFs into a searchable health timeline with privacy-first, explicit-only extraction.",
    wip: true,
    links: {},
    snapshots: [],
  },
  {
    slug: "tabscape",
    title: "TabScape",
    meta: "Fintech product · Budgeting",
    description:
      "Built a Next.js platform for consolidating recurring expenses into a single dashboard with rules-based categorization, payday planning, and trend forecasts.",
    wip: true,
    links: {},
    snapshots: [],
  },
  {
    slug: "robotrader",
    title: "RoboTrader",
    meta: "Trading systems · Data platform",
    description:
      "Built a RoboInvestor-style daily swing trading stack with a FastAPI + Postgres backend and Next.js dashboard for signals, paper trades, and performance.",
    wip: true,
    links: {},
    snapshots: [],
  },
];
