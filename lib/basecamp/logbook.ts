/**
 * The logbook: every trip, in the order it happened.
 *
 * The notes are Soham's own words. Nobody else on these trips is named, by choice. Heights are the
 * commonly published figures for each pass or hut and are labelled "approx." where they are shown.
 * A stop with no frames is a real stop that has no photographs on the site yet.
 */

export type Tag = "trail" | "water" | "city" | "night" | "wildlife";

export type Frame = { src: string; w: number; h: number; place: string };

export type Stop = { place: string; note?: string; frames: Frame[] };

export type Entry = {
  no: string;
  slug: string;
  title: string;
  /** As printed, e.g. "Sep 2026". */
  when: string;
  /** Year-month, for sorting. */
  date: string;
  region: string;
  /** Who came along. Empty when it is nobody's business. */
  company: string;
  note: string;
  figure: { value: string; label: string };
  tags: Tag[];
  story?: { href: string; title: string };
  /** Overrides the automatic cover. */
  cover?: string;
  stops: Stop[];
};

export const TAG_LABEL: Record<Tag, string> = {
  trail: "trail",
  water: "water",
  city: "city",
  night: "night sky",
  wildlife: "wildlife",
};

export const LOGBOOK: Entry[] = [
  {
    no: "001",
    slug: "001-kenya",
    title: "Kenya",
    when: "Jul 2021",
    date: "2021-07",
    region: "Kenya",
    company: "with my brother",
    note: "First trip with just my brother and me, no parents. Also the first trip with a camera.",
    figure: { value: "2", label: "national parks" },
    tags: ["wildlife"],
    stops: [
    {
      place: "Maasai Mara",
      frames: [
      { src: "/photography-webp/landscape/Masi Fields.webp", w: 900, h: 1600, place: "Maasai Mara" },
      { src: "/photography-webp/landscape/Masi 2.webp", w: 1067, h: 1600, place: "Maasai Mara" },
      { src: "/photography-webp/landscape/Masi Airspace.webp", w: 1600, h: 1067, place: "Maasai Mara" },
      ],
    },
    {
      place: "Amboseli",
      frames: [
      { src: "/photography-webp/landscape/Mt. Kilimanjero.webp", w: 1600, h: 1067, place: "Amboseli" },
      { src: "/photography-webp/landscape/Amboseli 1.webp", w: 1200, h: 1600, place: "Amboseli" },
      { src: "/photography-webp/landscape/Amboseli 2.webp", w: 1600, h: 1268, place: "Amboseli" },
      { src: "/photography-webp/landscape/Amboseli 3.webp", w: 1600, h: 1067, place: "Amboseli" },
      { src: "/photography-webp/wildlife/Eye of the Lion.webp", w: 1600, h: 1200, place: "Amboseli" },
      { src: "/photography-webp/wildlife/Herd of Elephants 1.webp", w: 1600, h: 1268, place: "Amboseli" },
      ],
    },
    {
      place: "On safari",
      frames: [
      { src: "/photography-webp/wildlife/Lion.webp", w: 1600, h: 1067, place: "Kenya" },
      { src: "/photography-webp/wildlife/Lionness.webp", w: 1067, h: 1600, place: "Kenya" },
      { src: "/photography-webp/wildlife/Giraffe 1.webp", w: 1200, h: 1600, place: "Kenya" },
      { src: "/photography-webp/wildlife/Giraffe 2.webp", w: 1600, h: 1066, place: "Kenya" },
      { src: "/photography-webp/wildlife/Elephants quenching their thirst.webp", w: 1200, h: 1600, place: "Kenya" },
      { src: "/photography-webp/wildlife/Great Egret riding atop Elephant.webp", w: 1600, h: 1067, place: "Kenya" },
      { src: "/photography-webp/wildlife/Greater Flamingo.webp", w: 1600, h: 1067, place: "Kenya" },
      { src: "/photography-webp/wildlife/Elephant.webp", w: 1200, h: 1600, place: "Kenya" },
      ],
    },
    ],
  },
  {
    no: "002",
    slug: "002-hampta-pass",
    title: "Hampta Pass",
    when: "Jun 2022",
    date: "2022-06",
    region: "Himachal Pradesh, India",
    company: "with my brother and a few of his friends",
    note: "Second trip with my brother, this time with a few of his friends.",
    figure: { value: "4,270 m", label: "the pass, approx." },
    tags: ["trail"],
    stops: [
    {
      place: "Manali",
      frames: [],
    },
    {
      place: "Kasol",
      frames: [],
    },
    {
      place: "Hampta Pass",
      frames: [
      { src: "/photography-webp/landscape/Humpta Pass 1.webp", w: 1067, h: 1600, place: "Hampta Pass" },
      { src: "/photography-webp/landscape/Humpta Pass 2.webp", w: 1600, h: 1067, place: "Hampta Pass" },
      { src: "/photography-webp/astrophotography/Humpta Pass.webp", w: 1067, h: 1600, place: "Hampta Pass" },
      ],
    },
    {
      place: "Chandratal",
      frames: [
      { src: "/photography-webp/landscape/Chandartal Lake.webp", w: 1600, h: 1067, place: "Chandratal" },
      ],
    },
    ],
  },
  {
    no: "003",
    slug: "003-kheerganga",
    title: "Kheerganga",
    when: "May 2023",
    date: "2023-05",
    region: "Himachal Pradesh, India",
    company: "with friends from uni in Dubai",
    note: "First trip away with my own friends from uni in Dubai.",
    figure: { value: "2,960 m", label: "the top, approx." },
    tags: ["trail"],
    stops: [
    {
      place: "Manali",
      frames: [],
    },
    {
      place: "Kasol",
      frames: [],
    },
    {
      place: "Kheerganga",
      frames: [],
    },
    ],
  },
  {
    no: "004",
    slug: "004-sar-pass",
    title: "Sar Pass",
    when: "May 2023",
    date: "2023-05",
    region: "Himachal Pradesh, India",
    company: "solo, with a trekking company",
    note: "My first solo trek. I went with a trekking company and didn't know anyone.",
    figure: { value: "4,220 m", label: "the pass, approx." },
    tags: ["trail", "night"],
    stops: [
    {
      place: "Kasol",
      frames: [],
    },
    {
      place: "Grahan",
      frames: [
      { src: "/photography-webp/astrophotography/Grahan Village.webp", w: 1600, h: 1067, place: "Grahan" },
      ],
    },
    {
      place: "Nagaru",
      frames: [
      { src: "/photography-webp/astrophotography/Nagaru Night Sky.webp", w: 1067, h: 1600, place: "Nagaru" },
      ],
    },
    {
      place: "Sar Pass",
      frames: [
      { src: "/photography-webp/astrophotography/Sar Pass 1.webp", w: 1600, h: 1067, place: "Sar Pass trek" },
      { src: "/photography-webp/astrophotography/Sar Pass 2.webp", w: 1600, h: 1067, place: "Sar Pass trek" },
      { src: "/photography-webp/astrophotography/Sar Pass 4.webp", w: 1600, h: 1067, place: "Sar Pass trek" },
      { src: "/photography-webp/astrophotography/Sar Pass 5.webp", w: 1600, h: 1067, place: "Sar Pass trek" },
      { src: "/photography-webp/astrophotography/Sar Pass 6.webp", w: 1600, h: 1067, place: "Sar Pass trek" },
      ],
    },
    ],
  },
  {
    no: "005",
    slug: "005-south-india",
    title: "South India",
    when: "Feb 2024",
    date: "2024-02",
    region: "Kerala and Karnataka, India",
    company: "solo",
    note: "Longest solo trip yet. No plans, just the destinations. I'd reach the hostel and then figure out what to do, and I met so many new people.",
    figure: { value: "4", label: "places, no plan" },
    tags: ["trail"],
    stops: [
    {
      place: "Munnar",
      frames: [],
    },
    {
      place: "Wayanad",
      frames: [],
    },
    {
      place: "Hampi",
      frames: [
      { src: "/photography-webp/astrophotography/Humpi.webp", w: 1600, h: 1067, place: "Hampi" },
      ],
    },
    {
      place: "Bengaluru",
      frames: [],
    },
    ],
  },
  {
    no: "006",
    slug: "006-amsterdam-prague",
    title: "Amsterdam & Prague",
    when: "Oct 2024",
    date: "2024-10",
    region: "Netherlands and Czechia",
    company: "",
    note: "First trip after I'd just started my M.Sc. in Eindhoven.",
    figure: { value: "2", label: "cities" },
    tags: ["city"],
    stops: [
    {
      place: "Amsterdam",
      frames: [
      { src: "/photography-webp/cityscapes/Amsterdam 1.webp", w: 1067, h: 1600, place: "Amsterdam" },
      { src: "/photography-webp/cityscapes/Amsterdam 2.webp", w: 1600, h: 1067, place: "Amsterdam" },
      { src: "/photography-webp/cityscapes/Amsterdam 3.webp", w: 1067, h: 1600, place: "Amsterdam" },
      { src: "/photography-webp/cityscapes/Amsterdam 4.webp", w: 1067, h: 1600, place: "Amsterdam" },
      { src: "/photography-webp/cityscapes/Amsterdam 5.webp", w: 1067, h: 1600, place: "Amsterdam" },
      ],
    },
    {
      place: "Prague",
      frames: [],
    },
    ],
  },
  {
    no: "007",
    slug: "007-antwerp",
    title: "Antwerp",
    when: "Nov 2024",
    date: "2024-11",
    region: "Belgium",
    company: "with new uni friends",
    note: "First trip with my new uni friends. One night, and a Ben B\u00f6hmer concert. I'd never heard of him before and fell in love with his music.",
    figure: { value: "1", label: "night" },
    tags: ["city"],
    stops: [
    {
      place: "Antwerp",
      frames: [],
    },
    ],
  },
  {
    no: "008",
    slug: "008-europe-with-family",
    title: "Europe with family",
    when: "May 2025",
    date: "2025-05",
    region: "Netherlands, Belgium, Germany, Austria, Italy",
    company: "with Mom, Dad and my brother",
    note: "Best trip with my family. We travelled so much and made such beautiful memories.",
    figure: { value: "13", label: "places" },
    tags: ["city", "trail"],
    stops: [
    {
      place: "Keukenhof",
      frames: [],
    },
    {
      place: "Zaandam",
      frames: [],
    },
    {
      place: "Brussels",
      frames: [],
    },
    {
      place: "Antwerp",
      frames: [],
    },
    {
      place: "Munich",
      frames: [],
    },
    {
      place: "Salzburg",
      frames: [],
    },
    {
      place: "Neuschwanstein and the German Alps",
      frames: [],
    },
    {
      place: "Hallstatt",
      note: "The salt mine.",
      frames: [],
    },
    {
      place: "Naples",
      frames: [
      { src: "/photography-webp/cityscapes/Naples.webp", w: 1600, h: 900, place: "Naples" },
      ],
    },
    {
      place: "Capri",
      frames: [
      { src: "/photography-webp/landscape/Capri 1.webp", w: 900, h: 1600, place: "Capri" },
      { src: "/photography-webp/landscape/Capri 2.webp", w: 1200, h: 1600, place: "Capri" },
      ],
    },
    {
      place: "Florence",
      frames: [
      { src: "/photography-webp/cityscapes/Florence.webp", w: 1200, h: 1600, place: "Florence" },
      ],
    },
    {
      place: "Rome",
      frames: [
      { src: "/photography-webp/cityscapes/Rome.webp", w: 1600, h: 1200, place: "Rome" },
      { src: "/photography-webp/cityscapes/Rome 2.webp", w: 1200, h: 1600, place: "Rome" },
      { src: "/photography-webp/cityscapes/Rome 3.webp", w: 1600, h: 1200, place: "Rome" },
      { src: "/photography-webp/cityscapes/Rome 4.webp", w: 1600, h: 1200, place: "Rome" },
      ],
    },
    {
      place: "Venice",
      frames: [],
    },
    ],
  },
  {
    no: "009",
    slug: "009-swiss-alps",
    title: "Swiss Alps",
    when: "May 2026",
    date: "2026-05",
    region: "Switzerland",
    company: "solo",
    note: "First trip after my mom passed away, in the middle of my internship at Prosus. My first solo wild camp, at about 2,300 m near Bachalpsee. Night train from Eindhoven to Grindelwald, day train back home, using up the Eurail pass.",
    figure: { value: "~2,300 m", label: "wild camp" },
    tags: ["trail", "night"],
    stops: [
    {
      place: "Night train from Eindhoven",
      frames: [],
    },
    {
      place: "Grindelwald",
      frames: [],
    },
    {
      place: "Bachalpsee",
      note: "Wild camp, about 2,300 m.",
      frames: [],
    },
    {
      place: "Geneva",
      frames: [],
    },
    ],
  },
  {
    no: "010",
    slug: "010-berlin",
    title: "Berlin",
    when: "Jun 2026",
    date: "2026-06",
    region: "Germany",
    company: "solo",
    note: "Second solo weekend of the year, again using up the last days on my Eurail pass. Met people through Hostelworld, went to LIQUIDROM, an indoor pool for relaxing, and ended the night with a pub crawl and a club until 7am.",
    figure: { value: "7 am", label: "home time" },
    tags: ["city"],
    stops: [
    {
      place: "Berlin",
      frames: [],
    },
    ],
  },
  {
    no: "011",
    slug: "011-spain",
    title: "Spain",
    when: "Sep 2026",
    date: "2026-09",
    region: "Catalonia, Spain",
    company: "solo",
    note: "Best solo trip yet. Learnt scuba diving, learnt to live, and did a lot of self-reflection.",
    figure: { value: "\u221215 m", label: "deepest dive" },
    tags: ["water", "trail", "night"],
    story: { href: "/blog/day-1", title: "There Has to Be a DAY 1" },
    cover: "/blog/day-1/cliffs.webp",
    stops: [
    {
      place: "Luxembourg",
      note: "Somewhere inside the thirty hours of bus.",
      frames: [
      { src: "/blog/day-1/luxembourg-road.webp", w: 2400, h: 1600, place: "Luxembourg" },
      ],
    },
    {
      place: "Barcelona",
      frames: [
      { src: "/blog/day-1/barcelona-cathedral.webp", w: 2400, h: 1600, place: "Barcelona" },
      ],
    },
    {
      place: "Montserrat",
      frames: [
      { src: "/blog/day-1/montserrat-rocks.webp", w: 2400, h: 1600, place: "Montserrat" },
      { src: "/blog/day-1/montserrat-stairs.webp", w: 1600, h: 2400, place: "Montserrat" },
      ],
    },
    {
      place: "L'Estartit",
      note: "Four days of the scuba course.",
      frames: [
      { src: "/blog/day-1/estartit-harbour.webp", w: 2400, h: 1601, place: "L'Estartit" },
      { src: "/blog/day-1/underwater-blue.webp", w: 2048, h: 1365, place: "L'Estartit" },
      ],
    },
    {
      place: "Medes Islands",
      note: "The last dive, 15 m down.",
      frames: [
      { src: "/blog/day-1/medes-island.webp", w: 2400, h: 1600, place: "Medes Islands" },
      ],
    },
    {
      place: "Costa Brava",
      frames: [
      { src: "/blog/day-1/trail-overlook.webp", w: 2400, h: 1600, place: "Costa Brava" },
      { src: "/blog/day-1/cliffs.webp", w: 2400, h: 1600, place: "Costa Brava" },
      { src: "/blog/day-1/cliff-edge.webp", w: 2400, h: 1600, place: "Costa Brava" },
      { src: "/blog/day-1/sea-rock.webp", w: 1600, h: 2400, place: "Costa Brava" },
      { src: "/blog/day-1/cove-night.webp", w: 2400, h: 3600, place: "Costa Brava" },
      ],
    },
    {
      place: "Girona",
      frames: [],
    },
    ],
  },
  {
    no: "012",
    slug: "012-istanbul",
    title: "Istanbul",
    when: "Sep 2026",
    date: "2026-09",
    region: "T\u00fcrkiye",
    company: "visiting my dad",
    note: "Right after Spain. My dad was there on a business trip, so I went to see him for a day.",
    figure: { value: "1", label: "day" },
    tags: ["city"],
    stops: [
    {
      place: "Istanbul",
      frames: [],
    },
    ],
  },
  {
    no: "013",
    slug: "013-gotzenalm",
    title: "Gotzenalm",
    when: "Sep 2026",
    date: "2026-09",
    region: "Germany and Austria",
    company: "",
    note: "Munich, Salzburg, and the trek up from K\u00f6nigssee to the Berggastst\u00e4tte Gotzenalm.",
    figure: { value: "1,685 m", label: "the hut, approx." },
    tags: ["trail"],
    stops: [
    {
      place: "Munich",
      frames: [],
    },
    {
      place: "Salzburg",
      frames: [],
    },
    {
      place: "K\u00f6nigssee",
      frames: [],
    },
    {
      place: "Gotzenalm",
      frames: [],
    },
    ],
  },
];

export function entryBySlug(slug: string): Entry | undefined {
  return LOGBOOK.find((e) => e.slug === slug);
}

export function framesOf(entry: Entry): Frame[] {
  return entry.stops.flatMap((s) => s.frames);
}

/** The first frame, preferring a landscape one, used as the entry's cover. */
export function coverOf(entry: Entry): Frame | undefined {
  const frames = framesOf(entry);
  return frames.find((f) => f.src === entry.cover) ?? frames.find((f) => f.w > f.h) ?? frames[0];
}

/** Newest first, the way the logbook is read. */
export function newestFirst(): Entry[] {
  return [...LOGBOOK].reverse();
}
