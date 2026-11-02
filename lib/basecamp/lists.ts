/**
 * The lists pinned up at basecamp, copied from the notes Soham keeps on bus journeys.
 *
 * Anything too personal (flirting, skin and hair, physique) stays off the site on purpose.
 * Ids are stable: guesses and trip signups are stored against them.
 */

export type BucketItem = { id: string; label: string; done?: boolean; entry?: string };

export const BUCKET: BucketItem[] = [
  { id: "climb-tree", label: "Climbing a tree", done: true },
  { id: "trekking", label: "Trekking and hiking", done: true, entry: "004-sar-pass" },
  { id: "cooking", label: "Cooking", done: true },
  { id: "scuba", label: "Scuba diving", done: true, entry: "011-spain" },
  { id: "cricket", label: "Cricket", done: true },
  { id: "backflip", label: "Backflip" },
  { id: "cliff-jump", label: "Jumping off a cliff higher than 5 m" },
  { id: "boxing", label: "Boxing" },
  { id: "bachata", label: "Bachata" },
  { id: "fly-plane", label: "Flying a plane" },
  { id: "skydiving", label: "Skydiving" },
  { id: "content", label: "Making content" },
  { id: "peak-8000", label: "Climbing a peak over 8 km" },
  { id: "clothing", label: "Understanding clothing choices" },
  { id: "run-10k", label: "Enough stamina to run a 10k comfortably" },
  { id: "calisthenics", label: "Calisthenics" },
  { id: "grooving", label: "Grooving to music and beats" },
  { id: "new-music", label: "Listening to new music" },
  { id: "more-books", label: "Reading more books" },
  { id: "surfing", label: "Surfing" },
  { id: "skiing", label: "Skiing" },
  { id: "snowboarding", label: "Snowboarding" },
  { id: "skateboarding", label: "Skateboarding" },
  { id: "rollerskating", label: "Rollerskating" },
  { id: "iceskating", label: "Ice skating" },
  { id: "tennis", label: "Tennis" },
  { id: "football", label: "Football" },
  { id: "badminton", label: "Badminton" },
  { id: "squash", label: "Squash" },
  { id: "front-flip", label: "Front flip" },
  { id: "side-flip", label: "Side flip" },
  { id: "brand", label: "Figure out my personal brand and design language" },
];

export const NEXT_UP = "backflip";

export type Question = { id: string; text: string };

/** Things left to figure out. Each one takes guesses from visitors. */
export const CURIOUS: Question[] = [
  { id: "plane-stall", text: "What actually happens to a plane in turbulence, and why does it stall?" },
  { id: "stars-nebulae", text: "How are stars and nebulae formed?" },
  { id: "camera-settings", text: "Which camera settings should I default to, and when should I break them?" },
  { id: "composition", text: "How do you learn to see a composition with your eyes before lifting the camera?" },
  { id: "read-faster", text: "How do you read a book faster without getting bored and sleepy?" },
  { id: "muscle-up", text: "How do you learn a muscle-up?" },
  { id: "pizza", text: "How do you make a proper pizza?" },
  { id: "curiosity", text: "Can you get better at being curious?" },
  { id: "objective", text: "How do you stay objective when explaining something?" },
  { id: "conversation", text: "What's the best way to start a conversation with a stranger?" },
  { id: "routine", text: "How do you fix eating, sleep and routine, and keep them fixed?" },
  { id: "posture", text: "How do you improve posture and balance?" },
  { id: "remember", text: "How do you stop forgetting things and living on autopilot?" },
  { id: "consistent", text: "How do you stay consistent?" },
  { id: "self-talk", text: "How do you keep the self-talk going when it matters?" },
  { id: "languages", text: "What's the fastest way to pick up a bit of Dutch, Spanish and German?" },
];

export type Factoid = { id: string; title: string; body: string; entry?: string };

/** Things figured out, usually on a bus. */
export const FACTOIDS: Factoid[] = [
  {
    id: "earthshine",
    title: "Why you can see the unlit part of the moon",
    body: "Earthshine. Sunlight bounces off Earth, lands on the moon's dark side, and some of it bounces back to us. That's the faint grey you see next to a thin crescent.",
  },
  {
    id: "water-pressure",
    title: "How water pressure changes with depth",
    body: "Every 10 m of seawater adds about one atmosphere. At 15 m on the Medes dive that's about 2.5 atmospheres in total, which is why you equalise your ears on the way down and why the air in your lungs takes up less space.",
    entry: "011-spain",
  },
  {
    id: "kilo",
    title: "The k in 10k",
    body: "It's kilo, from the Greek khilioi, a thousand. So 10k is ten thousand, whether it's metres or steps.",
  },
];

export type Place = { id: string; name: string; why: string };
export type PlaceGroup = { region: string; places: Place[] };

/** Where next. Each one has a "come along" signup. */
export const WISHLIST: PlaceGroup[] = [
  {
    region: "Northern lights",
    places: [
      { id: "nordics", name: "Norway, Sweden, Finland and Iceland", why: "Northern lights." },
      { id: "canada", name: "Canada", why: "Treks, northern lights, mountains and lakes." },
    ],
  },
  {
    region: "Mountains",
    places: [
      { id: "himalayas", name: "North-east India, Uttarakhand, Bhutan and Nepal", why: "The Himalayas." },
      { id: "peru", name: "Peru", why: "Climb Machu Picchu." },
      { id: "dolomites", name: "Italy", why: "Food, and the Dolomites." },
      { id: "swiss-lakes", name: "Switzerland", why: "Alpine lakes." },
      { id: "austria-ski", name: "Austria", why: "A ski trip." },
      { id: "france", name: "France", why: "The Alps, coastal roads and cliffs." },
      { id: "east-europe", name: "Poland, Budapest and Dubrovnik", why: "Hikes." },
      { id: "lithuania", name: "Lithuania", why: "Visit a friend, and hike." },
      { id: "kazakhstan", name: "Kazakhstan", why: "" },
    ],
  },
  {
    region: "Under and on the water",
    places: [
      { id: "mexico-brazil", name: "Mexico and Brazil", why: "Scuba diving, food and culture." },
      { id: "philippines-maldives", name: "The Philippines and the Maldives", why: "Scuba diving." },
      { id: "portugal", name: "Portugal", why: "Surfing and hiking." },
      { id: "bali", name: "Bali", why: "Fun, partying, surfing and hiking." },
      { id: "spain-coast", name: "Spain", why: "More coastal roads and cliffs." },
    ],
  },
  {
    region: "Far away",
    places: [
      { id: "antarctica", name: "Argentina", why: "A cruise to Antarctica." },
      { id: "namibia", name: "Namibia", why: "Dark skies." },
      { id: "east-africa", name: "Madagascar, Tanzania and Kenya", why: "" },
      { id: "egypt", name: "Egypt", why: "The Great Pyramids and Alexandria." },
      { id: "dubai-skydive", name: "Dubai", why: "Skydiving." },
      { id: "usa", name: "USA", why: "Gotta use up my visa." },
    ],
  },
  {
    region: "Closer to home",
    places: [
      { id: "black-forest", name: "Germany", why: "The Black Forest." },
      { id: "ghent", name: "Belgium", why: "Ghent." },
    ],
  },
];

export const ALL_PLACES: Place[] = WISHLIST.flatMap((g) => g.places);

export type Quote = { text: string; by: string; gloss?: string };

/** One per visit, in the footer. */
export const QUOTES: Quote[] = [
  {
    text: "Dream is not that which you see while sleeping, it is something that does not let you sleep.",
    by: "A. P. J. Abdul Kalam",
  },
  {
    text: "Rahiman dhaaga prem ka, mat todo chatkaay. Toote se phir na mile, mile gaanth pad jaay.",
    by: "Rahim",
    gloss: "Don't snap the thread of love. Once broken it won't join again, and if it does, there's a knot.",
  },
  {
    text: "Bada hua toh kya hua, jaise ped khajoor. Panthi ko chhaya nahi, phal laage ati door.",
    by: "Kabir",
    gloss: "So what if you're big, like a date palm. No shade for the traveller, and the fruit hangs far out of reach.",
  },
  {
    text: "The world ain't all sunshine and rainbows. It ain't about how hard you hit. It's about how hard you can get hit and keep moving forward.",
    by: "Rocky Balboa",
  },
];

/** In Soham's own words, from the brief. */
export const INTRO = {
  line: "AI engineer, traveller, photographer.",
  body: "Creative, a bit philosophical, trying to be empathetic rather than egoistic. Happy being average at a lot of things instead of chasing perfection in one, and always trying to step outside my comfort zone.",
};
