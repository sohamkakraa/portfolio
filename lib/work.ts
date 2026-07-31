/**
 * Roles and degrees. The single source for every surface that talks about work.
 *
 * Deliberately outside lib/lab/: the résumé strip on the live homepage, the route panels and
 * the work page all read from here. Keeping three copies in three files is exactly how the
 * homepage ended up claiming a current student with one finished job.
 */

/**
 * A job or a degree.
 *
 * The route shows these inline at the place they happened and the work page shows them in
 * full, so both read from this array rather than keeping their own copy. `line` is the
 * pre-tuned one-liner for the route panel, which has a hard height budget; everything else
 * is for the page, which does not.
 */
export type Role = {
  id: string;
  org: string;
  /** Compact form for the homepage's CV strip, where the column is narrow. */
  orgShort?: string;
  /** Short form for the route's one-liner. */
  role: string;
  /** May carry a [blank] where the location is genuinely unconfirmed. */
  city: string;
  span: string;
  /** Condensed span for the CV strip, e.g. "2023–24". */
  years: string;
  kind: "degree" | "role" | "internship";
  /** The route chapter this happened inside. */
  chapter: string;
  /** Exactly what the route panel prints. */
  line: string;
  /** One line. Shown under the role on the work page. */
  note: string;
  /** The full account. */
  detail?: string;
  /** Only where a real number exists. Nothing here is rounded up from a feeling. */
  metrics?: { label: string; value: string }[];
};

/**
 * Chronological, oldest first. The work page reverses it; the route slices it by chapter.
 */
export const WORK: Role[] = [
  {
    id: "bsc",
    org: "Heriot-Watt University",
    orgShort: "Heriot-Watt Dubai",
    role: "B.Sc. Computer Science, AI specialisation",
    city: "Dubai",
    span: "Sep 2020 – Jul 2023",
    years: "2020–23",
    kind: "degree",
    chapter: "dubai",
    line: "B.Sc. Computer Science, AI · Heriot-Watt · Sep 2020 – Jul 2023",
    note: "With Honours, Second Class Upper Division.",
    detail:
      "The courses that turned out to matter: data mining and machine learning, advanced human-computer interaction, and AI and intelligent agents — the last of which is roughly what I do for a living now.",
  },
  {
    id: "apptmyz",
    org: "Apptmyz LLC",
    role: "Software Developer Intern",
    city: "Hyderabad, remote",
    span: "Jun – Sep 2021",
    years: "2021",
    kind: "internship",
    chapter: "dubai",
    line: "Apptmyz LLC · Hyderabad, remote · Jun – Sep 2021",
    note: "AngularJS, then an employee management system.",
    detail:
      "The first one, and I got in through a distant relative who owns the company. Started on simple AngularJS apps, then helped build and maintain an employee management system for one of their clients under an engineer's supervision. It ran June to September 2021, which puts the Kenya week squarely in the middle of it.",
  },
  {
    id: "firstgroup",
    org: "The First Group",
    role: "Learning & Development Intern",
    city: "Dubai",
    span: "Nov 2022 – May 2023",
    years: "2022–23",
    kind: "internship",
    chapter: "dubai",
    line: "The First Group · Nov 2022 – May 2023",
    note: "Ran the Totara learning management system.",
    detail:
      "Handled deployment and day-to-day operation of the Totara LMS for the learning and development team — labelling content, keeping its data straight, and reporting on what training was actually working. Also organised sales and soft-skills sessions with their NLP practitioner. Neuro-linguistic programming, not the other kind.",
    metrics: [{ label: "user engagement", value: "+25%" }],
  },
  {
    id: "eci",
    org: "Etihad Credit Insurance",
    role: "Data Analyst & IT Support",
    city: "Dubai",
    span: "Aug 2023 – Aug 2024",
    years: "2023–24",
    kind: "role",
    chapter: "dubai",
    line: "Etihad Credit Insurance · Aug 2023 – Aug 2024",
    note: "The UAE's federal trade credit insurer, run like a startup.",
    detail:
      "A federal company that operated like a startup, so the scope stayed wide: Power BI dashboards for finance, risk and HR reporting, data pipelines automated down to a fraction of the manual time they used to cost, and a custom SharePoint intranet for a company that had been running on email. Around the edges, a website revamp and the decks. This is the job I left to move to Eindhoven.",
    metrics: [{ label: "manual processing time", value: "−40%" }],
  },
  {
    id: "msc",
    org: "Eindhoven University of Technology",
    orgShort: "TU/e",
    role: "M.Sc. Data Science & Artificial Intelligence",
    city: "Eindhoven",
    span: "Sep 2024 – now",
    years: "2024–",
    kind: "degree",
    chapter: "eindhoven",
    line: "M.Sc. Data Science & AI · TU/e · Sep 2024 – now",
    note: "Machine learning and deep learning, GenAI, visual analytics, ethics in AI.",
    detail:
      "The first move I argued for rather than went along with. The thesis is the Prosus role, which means the degree and the job stopped being separate things somewhere in early 2026.",
  },
  {
    id: "idcaba",
    org: "IDC ABA Employment Services",
    orgShort: "IDC ABA",
    role: "Data & AI Intern",
    city: "[where]",
    span: "Jul – Aug 2025",
    years: "2025",
    kind: "internship",
    chapter: "eindhoven",
    line: "IDC ABA Employment Services · [where] · Jul – Aug 2025",
    note: "Copilot agents for the helpdesk and for insurance risk.",
    detail:
      "Built AI agents on Microsoft Copilot to take over internal workflows — IT helpdesk support and insurance risk analysis — and worked on the redesign of the company website. The first job where the deliverable was something that makes its own decisions.",
  },
  {
    id: "amana",
    org: "Amana Global Partners",
    role: "Research Intern",
    city: "[where]",
    span: "Aug 2025",
    years: "2025",
    kind: "internship",
    chapter: "eindhoven",
    line: "Amana Global Partners · [where] · Aug 2025",
    note: "Read a lot of AI startups on behalf of people writing cheques.",
    detail:
      "Scouted and evaluated over seventy AI startups across defence, automotive, aerospace and other sectors for future investment. The useful part was learning the criteria experts actually apply to an early-stage company, which are not the criteria the pitch deck assumes they will.",
    metrics: [{ label: "startups evaluated", value: "70+" }],
  },
  {
    id: "prosus",
    org: "Prosus",
    role: "AI Intern, master's thesis",
    city: "Amsterdam",
    span: "Apr 2026 – now",
    years: "2026–",
    kind: "internship",
    chapter: "eindhoven",
    line: "Prosus · Amsterdam · Apr 2026 – now",
    note: "Retrieval that builds its own structure, on demand.",
    detail:
      "An adaptive retrieval system that generates structure on demand for complex enterprise queries, rather than relying on an index built in advance for questions nobody had asked yet. It is both the thesis and the internship. Alongside it: a 3D designer-and-printer agent that lives in Slack, and a standing habit of evaluating models and agentic tooling in my own time.",
  },
];

/** The turn the list makes, stated once so neither surface has to imply it. */
export const WORK_ARC = {
  eyebrow: "2021 – NOW · SIX ROLES, TWO HALVES",
  title: "From making other people's work legible to building things that decide",
  body:
    "The first half of this list is infrastructure for humans: an employee management system, a learning platform, dashboards for finance and risk, an intranet for a company running on email. Useful, and all of it fundamentally a way of showing people what was already true about their own organisation. The second half stopped being about presenting information and started being about acting on it — Copilot agents taking over a helpdesk, a summer spent judging what seventy AI companies were actually capable of, and now a retrieval system that builds its own structure instead of waiting for someone to index the world in advance. The Gulf years taught me what a business needs before it can be automated. That is the part most people building agents skip.",
};

export function rolesIn(chapter: string): Role[] {
  return WORK.filter((r) => r.chapter === chapter);
}

/** The current role, for anything that needs to say what I am doing right now. */
export function currentRole(): Role | undefined {
  return [...WORK].reverse().find((r) => r.span.endsWith("now") && r.kind !== "degree");
}

/**
 * The homepage's CV strip, newest first.
 *
 * A projection rather than a second copy, so a role added here shows up on the live site
 * without anyone remembering to go and update a table.
 */
export function workLogEntries(): { year: string; org: string; role: string }[] {
  return [...WORK].reverse().map((r) => ({
    year: r.years,
    org: r.orgShort ?? r.org,
    role: r.role,
  }));
}
