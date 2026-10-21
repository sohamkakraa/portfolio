# Visual

How sohamkakra.com looks. The values here are the ones the site already uses in [`app/globals.css`](../../app/globals.css). If the two ever disagree, fix one of them the same day.

Status: **draft**. Last reviewed: **21 Oct 2026**. Sections marked ✍️ are waiting for Soham's own choices.

The idea in one line: **a summit at night.** Midnight sky, snow, and one warm headlamp.

---

## Colour

### The shared palette (fixed)

The site follows the visitor's system setting. Dark is "night", light is "snow". There is no toggle.

| Role | Token | Night (dark) | Snow (light) | Used for |
|---|---|---|---|---|
| Background | `--bg` | `#0f1a2b` | `#eef0ec` | The page |
| Raised surface | `--bg-2` | `#15243a` | `#e3e6e0` | Cards |
| Higher surface | `--bg-3` | `#1c2e48` | `#d8dcd5` | Popovers, hover |
| Main text | `--ink` | `#eef0ec` | `#121314` | Headings, body |
| Second text | `--ink-2` | `#c3c8cf` | `#3c4148` | Reading text, notes |
| Quiet text | `--ink-3` | `#8f99a8` | `#5c636d` | Labels, captions |
| The headlamp | `--accent` | `#f2c14e` | `#8a6100` | The one loud thing: links, the pole star, "now" |
| Headlamp fill | `--accent-fill` | `#f2c14e` | `#f2c14e` | Filled buttons and dots |
| Water | `--glacier` | `#4cc3bb` | `#1a7f7a` | Tags for water, lakes, sea |
| Trails | `--pine` | `#3f9a72` | `#0b4a33` | Tags for hikes and forests |

**Why yellow turns amber in snow mode:** yellow text vanishes on a pale background, so text accents darken to amber. Filled shapes stay yellow.

**Pairing rules:**
- Text on `--accent` uses `--on-accent`.
- Text on `--accent-fill` is always `#121314`, in both themes. White on yellow is unreadable (1.7:1).
- Yellow is the only loud colour on a screen. Glacier and pine are small tags, never large areas.

### Contrast

Measured against `--bg` unless noted. The target is 4.5:1 for normal text and 3:1 for large text and icons ([Open to everyone](./PHILOSOPHY.md#open-to-everyone)).

| Pair | Night | Snow |
|---|---|---|
| Main text | 15.2 ✅ | 16.2 ✅ |
| Second text | 10.4 ✅ | 9.0 ✅ |
| Quiet text | 6.1 ✅ | 5.3 ✅ |
| Quiet text on `--bg-3` | 4.8 ✅ | **4.4** ⚠️ |
| Accent | 10.4 ✅ | 4.8 ✅ |
| Glacier | 8.2 ✅ | **4.2** ⚠️ |
| Pine | 5.1 ✅ | 9.0 ✅ |
| Dark text on yellow fill | 11.1 ✅ | 11.1 ✅ |

**Two known gaps in snow mode:** glacier text and quiet text on the highest surface fall just under 4.5:1. They pass for large text and icons. Use them only at 18px and up (or 14px bold) until the colours are darkened slightly.

### Chapter palettes (flexible)

Each chapter takes two or three colours from its own photos, like a star whose colour tells its temperature. Rules:

- The chapter palette replaces the accent only *inside* that chapter. The headlamp yellow stays in the menu and the mark.
- Chapter colours must pass the same contrast checks as above, in both themes.
- Photos of events and cities carry warm reds that the shared palette doesn't have. They stay chapter colours and never enter the shared palette.

---

## Type

Four fonts, each with one job (fixed). Changing a role changes the whole site's character.

| Font | Role | Where |
|---|---|---|
| **Bricolage Grotesque** | Display and interface | Headings, menu, buttons. Weight 300 for large display lines. |
| **Source Serif 4** | Reading | Essays, notes, learnings, anything longer than two lines |
| **JetBrains Mono** | Labels and facts | Small uppercase labels (11px, 0.2em tracking), dates, camera settings, the X-ray layer |
| **Doto** | Dot-matrix numbers | Counters and small numeric accents only. Never sentences. |

### Sizes

| Style | Size | Line height |
|---|---|---|
| Display XL | 56 to 112px (scales with screen) | 0.95 |
| Display L | 40 to 72px | 1.0 |
| Display M | 28 to 40px | 1.1 |
| Body large | 18px | 1.6 |
| Body | 16px | 1.55 |
| Small | 14px | 1.5 |
| Label | 11px mono, uppercase | 1.5 |

- Reading text stays between 60 and 64 characters per line.
- Nothing a visitor needs to read is smaller than 11px. Fine print may go to 10px only for legal notes.

---

## Shape and space

| Token | Value | Used for |
|---|---|---|
| `--radius-chip` | 4px | Tags |
| `--radius-input` | 6px | Inputs and buttons |
| `--radius-card` | 8px | Cards and photos |
| `--radius-large` | 14px | Large panels, dialogs |

Page side margins scale from 20px on phones to 40px on large screens. Corners stay soft but small. Nothing is fully round except dots and avatars.

---

## Motion

Motion should feel like the night sky: slow, smooth, and never in a hurry.

| Token | Curve | Used for |
|---|---|---|
| `--ease-page` | `cubic-bezier(0.4, 0, 0.2, 1)` | Page changes, fades |
| `--ease-card` | `cubic-bezier(0.22, 1, 0.36, 1)` | Cards and photos arriving |
| `--ease-fly` | `cubic-bezier(0.65, 0, 0.35, 1)` | Camera moves, the sky on scroll |

- Planets and comets move slowly enough to read the words they carry.
- Only one thing moves fast at a time, if anything does. That is the "one loud thing" rule, for motion.
- **Reduced motion (fixed):** every animation has a still version. See [Open to everyone](./PHILOSOPHY.md#open-to-everyone).

---

## The mark

Star trails circling the pole star, above a mountain ridge. Wandering and stillness in one picture: the sky turns, the pole star stays.

| Rule | Value | Label |
|---|---|---|
| Full version | 40px and up (all trails) | Fixed |
| Small version | 16 to 32px (one trail, thicker lines) | Fixed |
| Smallest size | 16px | Fixed |
| Colour | Lines in the text colour, pole star in headlamp yellow | Fixed |
| Clear space | At least a quarter of the mark's width on every side | Flexible |
| Source | `components/StarTrailsMark.tsx` and `app/icon.svg` | |

**Don't:**
- Recolour the trails or ridge. Only the pole star carries colour.
- Add a glow, shadow, outline or gradient.
- Stretch, tilt or rotate it.
- Put the full version below 40px. The thin trails blur into a smudge.
- Place it on a busy photo without a quiet patch of sky behind it.

---

## Photography

Most of the photos are taken at night. Of the 139 on the site, 67 are dark. That is where the midnight palette comes from, and the reason it suits the work.

### The look ✍️

A look must be specific enough that someone else could repeat it. "Moody" is not specific. To fill in:

- **Editing preset:** name and where it is saved. ✍️
- **Three reference photos** that show the look at its best. ✍️
- **White balance:** cool night skies, warm only where there is real light (fires, windows, headlamps)? ✍️
- **Shadows:** how dark is too dark? ✍️

### Rules (flexible unless marked)

- **Made, not borrowed** (fixed). Only Soham's own photos. No stock.
- **Crops:** 3:2 landscape by default, 2:3 for a portrait lead photo, 4:3 for thumbnails. Never crop a photo to an odd ratio just to fill a gap.
- **Orientation:** the site is about half landscape and half portrait. Every layout must work with both.
- **Per chapter:** one lead photo, then up to about 12 more. Fewer, better photos beat a full roll.
- **Good enough to publish:** sharp where it matters, horizon level unless tilted on purpose, and it shows something the other photos in the chapter don't.
- **Alt text on every photo** (fixed). See [`VOICE.md`](./VOICE.md).
- **Metadata:** camera settings, place and date go in the X-ray layer, not in the caption.

---

## This, not that

| This | Not that |
|---|---|
| One yellow thing on the screen, everything else quiet | Yellow buttons, yellow headings and yellow tags together |
| Plain menu words, cosmic visuals | A menu that says "Nebulae" |
| A chapter tinted from its own photos | Every chapter forced into the same blue |
| Serif for reading, Bricolage for signposts | Long essays set in the mono font |
| The sky stands still when reduced motion is on | Animations that ignore the setting |
| Dark text on the yellow button | White text on the yellow button |
| Our own photo of the Alps | A stock photo of "mountains" |
