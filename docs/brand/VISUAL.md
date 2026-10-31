# Visual

How sohamkakra.com looks. The values here are the ones the site already uses in [`app/globals.css`](../../app/globals.css). If the two ever disagree, fix one of them the same day.

Status: **draft**. Last reviewed: **31 Oct 2026**. Sections marked ✍️ are waiting for Soham's own choices.

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
| Quiet text | `--ink-3` | `#8f99a8` | `#565d66` | Labels, captions |
| The headlamp | `--accent` | `#f2c14e` | `#7f5900` | The one loud thing: links, the pole star, "now" |
| Headlamp fill | `--accent-fill` | `#f2c14e` | `#f2c14e` | Filled buttons and dots |
| Water | `--glacier` | `#4cc3bb` | `#13665f` | Tags for water, lakes, sea |
| Trails | `--pine` | `#3f9a72` | `#0b4a33` | Tags for hikes and forests |
| Error | (none) | `#e8765a` | `#a33a1f` | Error messages only |

**Why yellow turns amber in snow mode:** yellow text vanishes on a pale background, so text accents darken to amber. Filled shapes stay yellow.

**Pairing rules:**
- Text on `--accent` uses `--on-accent`.
- Text on `--accent-fill` is always `#121314`, in both themes. White on yellow is unreadable (1.7:1).
- Yellow is the only loud colour on a screen. Glacier and pine are small tags, never large areas.

### Contrast

Measured on every surface a colour can sit on: the page (`--bg`), cards (`--bg-2`) and popovers (`--bg-3`). The target is 4.5:1 for normal text and 3:1 for large text and icons ([Open to everyone](./PHILOSOPHY.md#open-to-everyone)).

| Text | Night: page / card / popover | Snow: page / card / popover |
|---|---|---|
| Main text | 15.2 / 13.6 / 12.0 ✅ | 16.2 / 14.8 / 13.4 ✅ |
| Second text | 10.4 / 9.3 / 8.2 ✅ | 9.0 / 8.2 / 7.4 ✅ |
| Quiet text | 6.1 / 5.4 / 4.8 ✅ | 5.8 / 5.3 / 4.8 ✅ |
| Accent | 10.4 / 9.3 / 8.2 ✅ | 5.5 / 5.0 / 4.5 ✅ |
| Glacier | 8.2 / 7.3 / 6.4 ✅ | 5.9 / 5.4 / 4.9 ✅ |
| Pine | 5.1 / 4.5 / **4.0** ⚠️ | 9.0 / 8.2 / 7.4 ✅ |
| Error | 6.0 / 5.3 / 4.7 ✅ | 5.8 / 5.2 / 4.8 ✅ |
| Dark text on yellow fill | 11.1 ✅ | 11.1 ✅ |
| White on amber (`--on-accent`) | n/a | 6.3 ✅ |

**One known gap:** pine text on the popover surface at night (4.0). Pine tags live on the page and on cards, where they pass. Don't put pine text on `--bg-3`.

**Fixed on 31 Oct 2026:** snow-mode quiet text, amber and glacier were darkened slightly (`#5c636d` to `#565d66`, `#8a6100` to `#7f5900`, `#1a7f7a` to `#13665f`). Before, glacier tags, amber labels inside cards, and quiet text on popovers fell under 4.5:1.

**How to check a new colour:** run it against all three surfaces in both themes. A colour that passes only on the page is not done.

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
| **JetBrains Mono** | Technical facts | Camera settings, coordinates, code, the X-ray layer |
| **Doto** | Dot-matrix figures | Dates, altitudes, depths and counts. Never sentences. |

Small uppercase labels above headings ("eyebrows") are set in Bricolage, 12.8px, weight 600, 0.08em tracking, in quiet text. Older pages still use JetBrains Mono for these. Move them over when the page is next touched (see [`COMPONENTS.md`](./COMPONENTS.md#older-pieces-still-on-the-site)).

### Sizes

| Style | Size | Line height |
|---|---|---|
| Page title (`bc-h1`) | 40 to 76px, weight 750 | 1.02 |
| Section title (`bc-h2`) | 26 to 37px, weight 700 | 1.08 |
| Card title (`bc-h3`) | 19px, weight 650 | 1.2 |
| Reading (`bc-read`, serif) | 17.6px | 1.7 |
| Body large | 18px | 1.6 |
| Body | 16px | 1.55 |
| Small | 14px | 1.5 |
| Eyebrow label | 12.8px, uppercase | 1.5 |

- Reading text is at most 66 characters per line (`--bc-read`).
- Nothing a visitor needs to read is smaller than 11px. Fine print may go to 10px only for legal notes.

---

## Shape and space

| Token | Value | Used for |
|---|---|---|
| `--radius-chip` | 4px | Tags |
| `--radius-input` | 6px | Inputs and buttons |
| `--radius-card` | 8px | Photos and photo frames |
| `--radius-large` | 14px | Cards, panels, dialogs |

Page side margins scale from 16px on phones to 40px on large screens. The page is at most 1120px wide. Full layout rules are in [`COMPONENTS.md`](./COMPONENTS.md#layout). Corners stay soft but small. Nothing is fully round except dots and avatars.

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
