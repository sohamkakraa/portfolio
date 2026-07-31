/**
 * Content for the three spine prototypes.
 *
 * Everything in `caption` is machine-generated from the image itself and is marked as a
 * placeholder in the UI. Place names, categories and file paths are real. Dates, altitudes
 * and anything first-person is intentionally left as a visible blank for the interview,
 * because a journey narrated by invented memories is the one failure mode worth avoiding.
 */

import { WORK, WORK_ARC, rolesIn, type Role } from "@/lib/work";

const FOLDER: Record<string, string> = {
  "light-trails": "Startrails",
};

export function photo(category: string, file: string): string {
  return `/photography-webp/${FOLDER[category] ?? category}/${encodeURIComponent(file)}`;
}

export type Frame = {
  src: string;
  /** Machine-generated description of the actual image. Shown tagged as a placeholder. */
  caption: string;
  /** Real, from data/photo-locations.json or the filename. */
  place: string;
};

export type Stop = {
  id: string;
  /** The tracked micro-label. Bracketed parts are blanks for you to fill. */
  eyebrow: string;
  title: string;
  /** Placeholder body copy. */
  caption: string;
  frames: Frame[];
};

/* Re-exported so the lab pages can keep importing work from one place, even though the array
   itself now lives outside the lab for the live homepage to share. */
export { WORK, WORK_ARC, rolesIn, type Role };

/* ─────────────────────────────────────────────────────────────
   SPINE A — The Route. Place is the axis.
   ───────────────────────────────────────────────────────────── */

export type RouteChapter = Stop & {
  /** Where the camera is, 0–1 along the route. */
  t: number;
  region: string;
  /** Short form for the route rail. */
  short: string;
  years: string;
  /**
   * A leg is somewhere I lived. A detour is somewhere I went and came back from.
   * The archive lives almost entirely in the detours, so the distinction is load-bearing.
   */
  kind: "leg" | "detour";
  /** True for the India summers, which are one detour taken many times. */
  recurring?: boolean;
  /**
   * The spine of the whole route: every move until Eindhoven was decided by someone else.
   * This drives the camera handover, not just a label.
   */
  decidedBy: "family" | "me" | "mixed";
  /**
   * What this place was the first of.
   *
   * This turned out to be the real axis. The camera was bought for the first trip taken
   * without our parents, and every trip after it is measurably more alone: brother, then
   * brother's friends, then a trek group, then nobody. The archive tracks that progression
   * far more closely than it tracks geography, so it gets its own field.
   */
  firstOf?: string;
  /**
   * A stated hole in the archive for this chapter. Printed rather than papered over, so a
   * neighbouring photograph is never left to quietly impersonate a missing one.
   */
  gap?: string;
  /**
   * Roles and degrees sit at the place they happened, so the CV rides along the route.
   *
   * Derived from WORK rather than restated, because the same facts appearing twice in one
   * file is the shape every stale résumé starts as. The panel prints `line` only and links
   * out to the full entry — rendering the descriptions inline made this taller than the
   * viewport, and a panel that overflows in both directions loses its own heading.
   */
  work: Role[];
  /** A journey that can be walked in full from this chapter. */
  journey?: { href: string; label: string };
  /** Drives terrain, palette and weather in the 3D scene. */
  mood: "dust" | "alpine" | "glass" | "savanna" | "drizzle" | "snow";
};

/** Where the route technically begins, and why it isn't a chapter. */
export const ROUTE_ORIGIN = {
  place: "Hyderabad",
  line: "The route starts in Hyderabad, but only technically. I was born there and left before I could keep any of it.",
};

export const ROUTE_CHAPTERS: RouteChapter[] = [
  {
    id: "sharjah",
    t: 0.08,
    region: "Sharjah",
    short: "Sharjah",
    years: "age 6 to 18",
    kind: "leg",
    decidedBy: "family",
    eyebrow: "SHARJAH · AGE 6 TO 18 · DPS SHARJAH",
    title: "The longest chapter has no pictures in it",
    caption:
      "Twelve years. One school, one city, the whole of growing up. Not a single frame of it survives — and the reason turns out to be a date rather than a feeling: I left in 2020 and did not own a camera until July 2021. The archive begins a year after this chapter ends.",
    mood: "dust",
    work: [],
    // Deliberately empty. Nothing to show is the accurate thing to show.
    frames: [],
  },
  {
    id: "india",
    t: 0.26,
    region: "India",
    short: "India",
    years: "summers as a child, then Mays as an adult",
    kind: "detour",
    recurring: true,
    decidedBy: "mixed",
    eyebrow: "INDIA · SUMMERS, THEN MAYS · GRANDPARENTS, THEN PASSES",
    title: "A country I returned to and never lived in",
    caption:
      "Two different sets of trips wearing one country's name. First the school summers at my grandparents', none of which are photographed because there was nothing to photograph them with. Then May 2022 and May 2023, when I came back to the same valleys carrying equipment and a reason.",
    firstOf: "first trip planned entirely alone — Wayanad, Munnar, Bangalore, Hampi, Feb 2024",
    mood: "alpine",
    work: [],
    journey: { href: "/journeys/climb", label: "walk the climb" },
    frames: [
      { src: photo("astrophotography", "Humpi.webp"), caption: "Granite temple ruins under a hard sun. Shot on the first trip I planned by myself, end to end.", place: "Hampi, Karnataka · Feb 2024" },
      { src: photo("landscape", "Manali.webp"), caption: "Towering pines frame a rushing river beneath dramatic cumulus clouds.", place: "Kullu Valley, Himachal Pradesh" },
      { src: photo("landscape", "Tosh 2.webp"), caption: "Coniferous forest dissolves into mist beneath a brooding alpine slope.", place: "Tosh, Himachal Pradesh" },
    ],
  },
  {
    id: "dubai",
    t: 0.45,
    region: "Dubai",
    short: "Dubai",
    years: "2020 – 2024",
    kind: "leg",
    decidedBy: "family",
    eyebrow: "DUBAI · 2020 – 2024 · HERIOT-WATT",
    title: "The move that was only an hour down the coast",
    caption:
      "We moved so I could go to university. Same coast, same heat, a different city. Twenty frames of it survive and almost every one is the skyline — the Burj, the Expo, an Emirates tail. The parts a visitor photographs.",
    mood: "glass",
    work: rolesIn("dubai"),
    frames: [
      { src: photo("cityscapes", "Burj Khalifa 1.webp"), caption: "Full moon hovers behind Burj Khalifa's silhouette, bathing Dubai in amber stillness.", place: "Downtown Dubai" },
      { src: photo("cityscapes", "Expo2020 1.webp"), caption: "Geometric bronze petals frame sky, casting intricate shadows downward.", place: "Expo 2020, Dubai" },
      { src: photo("cityscapes", "Creek Harbour.webp"), caption: "Towers rise from reclaimed water at the city's new edge.", place: "Dubai Creek Harbour" },
      { src: photo("cityscapes", "Burj Al Arab.webp"), caption: "A sail-shaped hotel against flat Gulf haze.", place: "Jumeirah, Dubai" },
    ],
  },
  {
    id: "kenya",
    t: 0.63,
    region: "Kenya",
    short: "Kenya",
    years: "one week, July 2021",
    kind: "detour",
    decidedBy: "me",
    eyebrow: "KENYA · ONE WEEK · JULY 2021",
    title: "Where the archive actually starts",
    caption:
      "The first trip without our parents: my brother, me, a week of national parks, and a Nikon D5600 I had bought just before leaving and could not yet use. I taught myself manual photography on those animals, in a park that covid had emptied of people. Everything else here is downstream of that week.",
    firstOf: "first trip without our parents, and the first camera",
    mood: "savanna",
    work: [],
    frames: [
      { src: photo("landscape", "Mt. Kilimanjero.webp"), caption: "Elephants graze beneath Kilimanjaro's snow-capped summit, mirrored in still water. The mountain is in Tanzania; the camera was in Kenya.", place: "Amboseli National Park, Kenya" },
      { src: photo("wildlife", "Eye of the Lion.webp"), caption: "Intense amber gaze pierces through thorns, raw predatory focus unguarded.", place: "Amboseli, Kenya" },
      { src: photo("landscape", "Masi Fields.webp"), caption: "Solitary acacia stands sentinel across golden savanna beneath cerulean sky.", place: "Maasai Mara, Kenya" },
      { src: photo("wildlife", "Herd of Elephants 1.webp"), caption: "A distant elephant herd grazes across vast savanna beneath brooding skies.", place: "Amboseli, Kenya" },
    ],
  },
  {
    id: "eindhoven",
    t: 0.8,
    region: "Netherlands",
    short: "Eindhoven",
    years: "Aug 2024 – now",
    kind: "leg",
    decidedBy: "me",
    eyebrow: "EINDHOVEN · AUG 2024 – NOW · TU/e",
    title: "The first one I chose",
    caption:
      "Every move before this was decided for me. This one I argued for, and it is the only chapter where the road stops being something I was carried along. Two frames of the city itself in two years, which is the honest count.",
    mood: "drizzle",
    work: rolesIn("eindhoven"),
    frames: [
      { src: photo("cityscapes", "Eindhoven.webp"), caption: "Moon rises over Eindhoven's Art Deco towers in rose-tinted twilight.", place: "Eindhoven, Netherlands" },
      { src: photo("cityscapes", "Amsterdam 1.webp"), caption: "Autumn gilds a canal-side street where stone bridges frame unhurried European life.", place: "Amsterdam, Netherlands" },
    ],
  },
  {
    id: "europe",
    t: 0.94,
    region: "Europe",
    short: "Europe",
    years: "2024 – now, still going",
    kind: "detour",
    recurring: true,
    decidedBy: "me",
    eyebrow: "EUROPE · 2024 – NOW · SIX COUNTRIES SO FAR",
    title: "The road stops being a line",
    caption:
      "Belgium, Italy, Germany, Austria, Switzerland, and the country I actually live in. Most of it with family or friends. Two of them were not: above Grindelwald in May 2026 I did my first solo hike and spent a night wild-camping beside a frozen lake, and Berlin came after that, also alone. Berlin is the newest thing here, and the last two are the two I did by myself.",
    firstOf: "first solo hike, and the first night spent outside alone — Grindelwald, May 2026",
    mood: "snow",
    work: [],
    // The two solo trips that close the chapter are the two with nothing in the archive.
    // Austria and Italy are standing in below, which is exactly the quiet substitution worth
    // refusing, so the hole is printed instead of covered over.
    gap: "[Grindelwald and Berlin are both still missing — the two trips I took alone are the two with no frames here. Drop them in photo-inbox/ and this becomes the strongest chapter on the route.]",
    frames: [
      { src: photo("landscape", "Austria.webp"), caption: "Alpine valley under weather that arrives without asking.", place: "Austria" },
      { src: photo("cityscapes", "Naples.webp"), caption: "Vesuvius through an archway, with the whole city stacked up in between.", place: "Naples, Italy" },
      { src: photo("cityscapes", "Florence.webp"), caption: "Terracotta roofs stacked toward a dome.", place: "Florence, Italy" },
      { src: photo("landscape", "Germany.webp"), caption: "Neuschwanstein in flat Bavarian overcast, from across the gorge.", place: "Schwangau, Bavaria" },
      { src: photo("landscape", "Capri 2.webp"), caption: "Limestone falling straight into the Tyrrhenian.", place: "Capri, Italy" },
      { src: photo("cityscapes", "Rome.webp"), caption: "Stone that has been photographed for two thousand years, photographed again.", place: "Rome, Italy" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   SPINE B — One Day. Time is the axis.
   ───────────────────────────────────────────────────────────── */

export type Hour = Stop & {
  t: number;
  clock: string;
  /** Sky colour at this hour. Drives the whole page background. */
  sky: string;
  kind: "photo" | "work" | "contact";
  work?: { title: string; note: string; metrics: { label: string; value: string }[] };
};

export const HOURS: Hour[] = [
  {
    id: "predawn",
    t: 0.0,
    clock: "03:40",
    sky: "#07070d",
    kind: "photo",
    eyebrow: "STILL DARK · [WHERE YOU WERE]",
    title: "The hours nobody asks you to be awake for",
    caption:
      "Twelve star trails and nineteen astro frames. Every one of them cost you a night of sleep, on purpose.",
    frames: [
      { src: photo("light-trails", "Startrail 1.webp"), caption: "Celestial streaks arc across darkness, Earth's rotation painted in white fire.", place: "[where]" },
      { src: photo("astrophotography", "First Milky Way.webp"), caption: "The Milky Way's dusty core stretches diagonally across a star-studded void.", place: "[where — and it says 'first', so when?]" },
      { src: photo("astrophotography", "Nagaru Night Sky.webp"), caption: "Milky Way arcs above shadowed peaks, a solitary light glimmers below.", place: "Nagaru, Himachal Pradesh" },
    ],
  },
  {
    id: "firstlight",
    t: 0.17,
    clock: "05:58",
    sky: "#2f3550",
    kind: "photo",
    eyebrow: "FIRST LIGHT · SAR PASS, HIMACHAL PRADESH",
    title: "Colour comes back before warmth does",
    caption: "Snow-capped peaks silhouette against deepening twilight's fading blue gradient.",
    frames: [
      { src: photo("astrophotography", "Sar Pass 1.webp"), caption: "Snow-capped peaks silhouette against twilight's fading blue.", place: "Sar Pass, Himachal Pradesh" },
      { src: photo("landscape", "Snow Desert.webp"), caption: "Wind-sculpted snow undulates beneath towering peaks and roiling clouds.", place: "[which pass]" },
      { src: photo("landscape", "Himalayas 5.webp"), caption: "Snow-crowned peaks pierce clouds in austere, layered majesty.", place: "[which range — the machine guessed Karakoram]" },
    ],
  },
  {
    id: "morning",
    t: 0.36,
    clock: "09:30",
    sky: "#8fa8c0",
    kind: "work",
    eyebrow: "WORKING HOURS · EINDHOVEN",
    title: "Systems where data, models and people meet",
    caption: "The part of the day that pays for the rest of it.",
    work: {
      title: "UMA — privacy-first medical record workspace",
      note: "Local-first ingestion and on-device parsing. No record leaves the patient's device unless they say so.",
      metrics: [
        { label: "local docs", value: "200+" },
        { label: "search p95", value: "180ms" },
        { label: "PII leaks", value: "0" },
      ],
    },
    frames: [],
  },
  {
    id: "midday",
    t: 0.55,
    clock: "13:20",
    sky: "#b9cbd8",
    kind: "photo",
    eyebrow: "FLAT LIGHT · DUBAI",
    title: "The hour photographers are told to avoid",
    caption: "Geometric bronze petals frame sky, casting intricate shadows downward.",
    frames: [
      { src: photo("cityscapes", "Expo2020 1.webp"), caption: "Geometric bronze petals frame sky, casting intricate shadows downward.", place: "Expo 2020, Dubai" },
      { src: photo("automobile", "Mustang 1.webp"), caption: "Hard noon reflections across a lacquered flank.", place: "[where]" },
      { src: photo("cityscapes", "Emirates.webp"), caption: "Livery against a bleached Gulf sky.", place: "Dubai" },
    ],
  },
  {
    id: "golden",
    t: 0.73,
    clock: "17:45",
    sky: "#d9a05e",
    kind: "photo",
    eyebrow: "GOLDEN HOUR · AMBOSELI, KENYA",
    title: "Twenty minutes, once a day",
    caption: "Elephants graze beneath Kilimanjaro's snow-capped summit, mirrored in still water.",
    frames: [
      { src: photo("landscape", "Mt. Kilimanjero.webp"), caption: "Elephants graze beneath Kilimanjaro's summit, mirrored in still water.", place: "Amboseli National Park, Kenya" },
      { src: photo("landscape", "Masi Fields.webp"), caption: "Solitary acacia stands sentinel across golden savanna.", place: "Maasai land" },
      { src: photo("wildlife", "Giraffe 1.webp"), caption: "Long shadows across open ground.", place: "Amboseli, Kenya" },
    ],
  },
  {
    id: "dusk",
    t: 0.88,
    clock: "21:10",
    sky: "#3b2b3f",
    kind: "photo",
    eyebrow: "AFTER DARK · [WHICH CITY, WHICH TOUR]",
    title: "Borrowed light, thirty thousand people",
    caption: "Warm stage lights and smoke envelop musicians amid a sea of phone-wielding spectators.",
    frames: [
      { src: photo("events", "Coldplay 1.webp"), caption: "Warm stage lights and smoke envelop musicians.", place: "[which city]" },
      { src: photo("events", "SEL 1.webp"), caption: "Bearded performer commands darkened stage with microphone and gestured intensity.", place: "[which venue]" },
      { src: photo("events", "Amit Trivedi 1.webp"), caption: "Stage wash across a raised crowd.", place: "[which venue]" },
    ],
  },
  {
    id: "night",
    t: 1.0,
    clock: "23:52",
    sky: "#07070d",
    kind: "contact",
    eyebrow: "BACK WHERE WE STARTED",
    title: "Still up, still looking",
    caption: "The day closes on the same sky it opened on.",
    frames: [
      { src: photo("astrophotography", "Starry Night.webp"), caption: "Power lines pierce the twilight horizon beneath an awakening star field.", place: "[where]" },
    ],
  },
];

/* ─────────────────────────────────────────────────────────────
   SPINE C — The Ascent. Effort is the axis.
   ───────────────────────────────────────────────────────────── */

/**
 * The Climb is a composite, by your choice: not one trek but the shape all of them had.
 * That decision is what makes it honest — a single named trek would need exact altitudes,
 * dates and a day-by-day sequence, and inventing those to decorate real photographs is the
 * one thing worth avoiding. So the instrument is an elevation *band*, and every number is
 * marked approximate. Frames are assigned by what the photograph actually shows.
 */
export type ClimbStop = Stop & {
  /** Authored position along the climb, 0–1. Drives both the scene and the text placement. */
  t: number;
  band: string;
  /** Approximate, and labelled as such wherever it is printed. */
  approxAlt: string;
};

const L = (file: string, caption: string, place = "[where]"): Frame => ({
  src: photo("landscape", file),
  caption,
  place,
});
const A = (file: string, caption: string, place = "[where]"): Frame => ({
  src: photo("astrophotography", file),
  caption,
  place,
});

export const CLIMB_STOPS: ClimbStop[] = [
  {
    id: "valley",
    t: 0.06,
    band: "VALLEY FLOOR",
    approxAlt: "~2,000 m",
    eyebrow: "VALLEY FLOOR · APPROX 2,000 M",
    title: "It always starts beside water",
    caption:
      "Every one of these walks began the same way: a river on the left, pines closing overhead, a village that thins out behind you within the hour. Both trips spent their first days down here, around Manali and Tosh, before either of them went up.",
    frames: [
      L("Manali.webp", "Towering pines frame a rushing river beneath dramatic cumulus clouds.", "Kullu Valley, Himachal Pradesh"),
      L("Tosh 3.webp", "Mountain village nestled in misty valley beneath snow-capped peaks.", "Tosh, Himachal Pradesh"),
      L("DSC_0289.webp", "Cascading water tumbles over weathered stone in soft, misty motion."),
      L("Cricular Rainbow.webp", "A luminous halo crowns the sun, framed by towering forest sentinels."),
    ],
  },
  {
    id: "forest",
    t: 0.2,
    band: "THE FOREST",
    approxAlt: "~2,400 m",
    eyebrow: "THE FOREST · APPROX 2,400 M",
    title: "Where the mist gets in",
    caption:
      "Deodar closes over the trail and the weather stops being something you can see coming. Six frames from this band, and in most of them the mountain is only implied.",
    frames: [
      L("Himalayas 15.webp", "Mist-veiled conifer slopes reveal layered mountain wilderness in ethereal stillness."),
      L("Himalayas 16.webp", "Mist cascades down sheer cliffs while ancient forests cradle a mountain stream below."),
      L("Tosh 2.webp", "Coniferous forest dissolves into mist beneath a brooding alpine slope.", "Tosh, Himachal Pradesh"),
      L("Himalayas 2.webp", "Snow-crowned peak emerges through coniferous mist and foreground blur."),
      L("Himalayas 17.webp", "Silhouetted conifers pierce azure sky with sculptural, windswept grace."),
      L("Himalayas 7.webp", "Solitary raptor glides above forested Himalayan slopes under clouded sky."),
    ],
  },
  {
    id: "crossing",
    t: 0.34,
    band: "THE CROSSING",
    approxAlt: "~3,000 m",
    eyebrow: "THE CROSSING · APPROX 3,000 M",
    title: "Cold enough to hurt",
    caption:
      "Meltwater, moss-covered boulders, and the part of the day everyone remembers because of how cold their feet were. This band is Hampta Pass, May 2022, walked with my brother and a few of his friends.",
    frames: [
      L("Humpta Pass 1.webp", "Mountain stream cascades through moss-draped boulders in pristine alpine solitude.", "Hampta Pass, Himachal Pradesh"),
      L("Humpta Pass 2.webp", "Trekkers traverse mist-shrouded alpine meadow beneath towering limestone cliffs.", "Hampta Pass, Himachal Pradesh"),
      L("Himalayas 4.webp", "Trekkers navigate a verdant alpine valley toward a dramatic cliff-face peak."),
      L("Flowers 1.webp", "Alpine flowers frame a glacial river cutting through austere mountain stone."),
    ],
  },
  {
    id: "treeline",
    t: 0.48,
    band: "TREE LINE",
    approxAlt: "~3,400 m",
    eyebrow: "TREE LINE · APPROX 3,400 M",
    title: "Rock begins to outnumber root",
    caption:
      "The last trees are always the most interesting ones — bent, thinned out, standing further apart than they want to.",
    frames: [
      L("Himalayas 12.webp", "Snow-capped peaks pierce clouds above a forested valley ravine."),
      L("Himalayas 3.webp", "Snow-capped peaks emerge from coniferous forests beneath crystalline alpine sky."),
      L("Himalayas 1.webp", "Coniferous forests embrace a snow-capped peak beneath gathering clouds."),
      L("Himalayas 9.webp", "Layered canopy silhouettes create depth against overcast alpine sky."),
    ],
  },
  {
    id: "camp",
    t: 0.62,
    band: "CAMP, AFTER DARK",
    approxAlt: "~3,800 m",
    eyebrow: "CAMP, AFTER DARK · APPROX 3,800 M",
    title: "The reason to be this cold",
    caption:
      "This is the band the whole archive is really about. Two of these were lit by someone's red headlamp, which is the only light you get at that hour. Nagaru is on the Sar Pass route — May 2023, the trip I started with friends in the valley and finished with a trek group after they went home.",
    frames: [
      A("IMG_7033.webp", "Milky Way's luminous spine rises above silhouetted peaks, anchored by red headlamp glow."),
      A("Humpta Pass.webp", "Milky Way emerges above a canyon, crimson headlamp illuminating the vast darkness below.", "Hampta Pass, Himachal Pradesh"),
      A("Nagaru Night Sky.webp", "Milky Way arcs above shadowed peaks, a solitary light glimmers below.", "Nagaru, Himachal Pradesh"),
      A("Tosh Village.webp", "Distant village lights pierce the darkness beneath a star-scattered mountain sky.", "Tosh, Himachal Pradesh"),
    ],
  },
  {
    id: "lake",
    t: 0.74,
    band: "THE LAKE",
    approxAlt: "~4,300 m",
    eyebrow: "THE LAKE · APPROX 4,300 M",
    title: "Water at the top of everything",
    caption:
      "Nothing grows here and there is still a lake. [why this one stayed with you]",
    frames: [
      L("Chandartal Lake.webp", "Barren peaks frame a glacial lake nestled in austere mountain solitude.", "Chandratal, Himachal Pradesh"),
      L("Himalayas 13.webp", "Snow-capped peak pierces scattered clouds above distant foothills."),
      L("DSC_0091 2.webp", "Molten sun sinks between silhouetted ridges in amber stillness."),
    ],
  },
  {
    id: "snowfield",
    t: 0.84,
    band: "SNOWFIELD",
    approxAlt: "~4,900 m",
    eyebrow: "SNOWFIELD · APPROX 4,900 M",
    title: "The path erases itself",
    caption:
      "Above the snow line there is no trail, only the line the person in front of you chose.",
    frames: [
      L("Snow Desert.webp", "Wind-sculpted snow undulates beneath towering peaks and roiling clouds."),
      L("Himalayas 11.webp", "Jagged Himalayan peaks pierce through snow, rock dark against white silence."),
      A("Sar Pass 1.webp", "Snow-capped peaks silhouette against deepening twilight's fading blue gradient.", "Sar Pass, Himachal Pradesh"),
    ],
  },
  {
    id: "ridge",
    t: 0.93,
    band: "THE RIDGE",
    approxAlt: "~5,200 m",
    eyebrow: "THE RIDGE · APPROX 5,200 M",
    title: "Nowhere left to climb",
    caption:
      "Five frames, all taken within about an hour of each other, all of them trying and failing to record how much air there was.",
    frames: [
      L("Himalayas 6.webp", "Twin peaks pierce clouds with ethereal light and snow-laden majesty."),
      L("Himalayas 8.webp", "Snow-capped peaks pierce turquoise sky, wreathed in gossamer clouds."),
      L("Himalayas 14.webp", "Sharp peaks pierce clouds in a dance of snow and shadow."),
      L("Himalayas 10.webp", "Jagged peaks pierce cloud-laden sky, snow-carved ridges commanding wilderness vastness."),
      L("Himalayas 5.webp", "Snow-crowned peaks pierce clouds in austere, layered majesty."),
    ],
  },
];

export const HUB_JOURNEYS = [
  { id: "ascent", title: "The Climb", label: "01 — LANDSCAPE", count: 42, blurb: "A trek through the mountains, photograph by photograph.", cover: photo("landscape", "Himalayas 5.webp"), live: true },
  { id: "night", title: "Night Sky", label: "02 — ASTROPHOTOGRAPHY", count: 18, blurb: "The stars, and what opens when you look long enough.", cover: photo("astrophotography", "First Milky Way.webp"), live: false },
  { id: "rotation", title: "Rotation", label: "03 — STAR TRAILS", count: 12, blurb: "Proof, in one frame, that the ground is moving.", cover: photo("light-trails", "Startrail 1.webp"), live: false },
  { id: "cities", title: "End to End", label: "04 — CITYSCAPES", count: 19, blurb: "From glass towers to cobblestones — cities, walked through.", cover: photo("cityscapes", "Amsterdam 1.webp"), live: false },
  { id: "wild", title: "Held Breath", label: "05 — WILDLIFE", count: 19, blurb: "Amboseli, and the patience it asks for.", cover: photo("wildlife", "Eye of the Lion.webp"), live: false },
  { id: "loud", title: "Borrowed Light", label: "06 — EVENTS", count: 18, blurb: "Concerts, shot from wherever you could stand.", cover: photo("events", "Coldplay 1.webp"), live: false },
  { id: "metal", title: "Standing Still", label: "07 — AUTOMOBILE", count: 8, blurb: "Machines, photographed like portraits.", cover: photo("automobile", "Mustang 1.webp"), live: false },
];
