/**
 * Page copy for Photos and Projects, owned by the code rather than the CMS.
 *
 * The CMS still holds the photos, links and project metadata, but older saved payloads carried
 * headings and descriptions in a voice that is no longer the site's. These win over anything
 * stored, the same way work facts do.
 */

export const PHOTOS_COPY = {
  eyebrow: "Photos",
  title: "Photos",
  intro: "Mountains, animals, cities and a lot of night sky. Pick a place on the globe or a category, or just scroll.",
  archive: "All photos",
};

/** Shown when a category is picked, in my own voice. Keyed by category slug. */
export const PHOTO_CATEGORY_COPY: Record<string, string> = {
  wildlife:
    "One week in Kenya with my brother and a camera I didn't know how to use yet. Basically taught myself on lions, elephants and giraffes, mostly by getting it wrong first.",
  landscape:
    "Valleys, passes, cliffs and lakes. Most of these are from treks where I carried way too much camera gear up a mountain, and yes, I'd do it again.",
  astrophotography:
    "Staying up when everyone at camp is asleep, freezing, waiting 20 seconds for one frame. Worth it every single time.",
  "light-trails":
    "Leaving the shutter open and letting the stars, or the traffic, do the drawing. Mostly patience, and hoping nobody walks in front of the tripod.",
  automobile: "Mustangs, mostly. I can't walk past a nice car without taking at least one photo, sorry.",
  events:
    "Concerts, where I'm half watching the show and half fighting the stage lights. Coldplay and Amit Trivedi, among others.",
  cityscapes:
    "Dubai's skyline, Amsterdam's canals and the Italian cities from the family trip. I walk a lot in cities, and I stop a lot.",
};

export const PROJECTS_COPY = {
  eyebrow: "Work · Projects",
  title: "Projects",
  intro: "I build things end to end because I want to see the whole thing work, from the model to the screen someone uses.",
};

export type ProjectCopy = { why: string; what: string; now: string };

/** Why / What / Now for each project, calm voice. Keyed by project id. */
export const PROJECT_COPY: Record<string, ProjectCopy> = {
  uma: {
    why: "Medical records end up scattered across PDFs, scans and discharge letters, and nobody has the full picture at an appointment.",
    what: "Reads those documents, pulls out what matters and builds one timeline you can search, kept on your own device.",
    now: "A working prototype at uma.sohamkakra.com.",
  },
  robotrader: {
    why: "Researching a trading signal, testing it on history and running it live usually means three different tools.",
    what: "One platform for live market dashboards, a backtesting engine that replays history, and execution you run yourself or let run on its own.",
    now: "A prototype at latent.alpha.sohamkakra.com.",
  },
  tabscape: {
    why: "Most budgeting apps tell you what you already spent. I wanted one that shows what's coming.",
    what: "Detects recurring expenses, forecasts each category with Bayesian bands, and re-plans as new spending comes in.",
    now: "In progress. The code is on GitHub.",
  },
  forme: {
    why: "Clothes bought online rarely fit, and bespoke tailoring doesn't scale.",
    what: "Builds a digital avatar from your measurements, lets you design a garment visually or in plain language, then matches it to retailers and local tailors.",
    now: "A prototype, not public yet.",
  },
  "sage-advisory": {
    why: "A tax advisory firm in Dubai needed a site that explained its services clearly, not one that read like a directory listing.",
    what: "Structure, copy and build: plain-language service pages, an FAQ for clients in the UAE, and a quick route to booking a consultation.",
    now: "Live, and the firm uses it as its front door.",
  },
};
