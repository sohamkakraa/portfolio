# Building blocks

The pieces every page is made from. [`VISUAL.md`](./VISUAL.md) sets the colours, type and motion. This page says how they come together into buttons, cards, forms and the rest.

The values come from [`app/(site)/basecamp.css`](<../../app/(site)/basecamp.css>), the shared style for every public page. Class names start with `bc-`. If this page and the CSS disagree, fix one of them the same day.

Status: **draft**. Last reviewed: **31 Oct 2026**.

---

## Before you build something new

1. **Use what exists.** Check this page first. A new page should be about 80% building blocks and 20% chapter (see [How strict is each rule](./PHILOSOPHY.md#how-strict-is-each-rule)).
2. **Try it in `/lab` first.** New ideas never go straight onto a real page.
3. **If it works, add it here.** A pattern used on two pages belongs in this book.

---

## Layout

| Part | Value | Label |
|---|---|---|
| Page width | 1120px at most (`--bc-max`) | Fixed |
| Side margins | 16px on phones, up to 40px on large screens (`--bc-gutter`) | Fixed |
| Reading width | 66 characters at most (`--bc-read`) | Fixed |
| Space between sections | 48px on phones, up to 96px, with a thin line on top | Fixed |
| Menu height | 64px, stays at the top while scrolling | Fixed |

- One wide column. Text that people read for a while sits inside it at reading width, never stretched to the full page.
- Grids use `auto-fill` with a minimum card width, so they fold to one column on a phone without extra rules.
- Every layout works from 320px wide. Nothing scrolls sideways.

---

## The menu

- Wordmark (the small mark plus the name) on the left, plain page names on the right.
- The current page is marked with a soft background and `aria-current="page"`, not with colour alone.
- Below 760px the links fold into a "Menu" button that opens a drawer with larger links.
- Labels follow [Finding your way](./PHILOSOPHY.md#finding-your-way). Plain words only.
- A **Skip to content** link is the first thing the keyboard reaches. It appears in yellow when focused.

---

## Buttons and links

There are four kinds. Pick by what the action does, not by how loud you want it to be.

| Kind | Class | Looks like | Use for | Per screen |
|---|---|---|---|---|
| **Main button** | `bc-btn` | Yellow fill, dark text | The one action that matters most here: "Send", "Join the trip" | One |
| **Quiet button** | `bc-btn--ghost` | Thin outline, text colour | A second choice next to the main one | Any |
| **Arrow link** | `bc-arrow` | Amber text with → | Going to another page: "All journeys →" | Any |
| **Text button** | `bc-link-btn` | Underlined amber text | A small action that stays on the page: "Show more" | Any |

Rules (fixed):

- **One yellow button per screen.** It is the "one loud thing". If two actions both feel important, one of them is wrong.
- **Text on the yellow fill is always `#121314`**, in both themes. Never white.
- **Labels say what happens:** "Send", "Save", "Join". Never "Submit", "Click here" or "Read more" ([`VOICE.md`](./VOICE.md#words)).
- **Sentence case:** "Write to me", not "Write To Me".
- **Links go somewhere, buttons do something.** A link that changes the page is a link. A control that sends, opens or toggles is a `<button>`.
- **Touch targets** are at least 44 by 44px on phones, including padding.
- While a button is working it shows the wait cursor at 60% opacity and cannot be pressed twice.

---

## Focus

Every element that can be clicked shows a **2px amber outline, 3px away from the element**, when reached with the keyboard (`:focus-visible`). Inputs use the same outline with no gap. This is fixed and never removed for looks.

---

## Forms

The site has a few small forms: write to me, join a trip, guess an answer.

| Part | Rule |
|---|---|
| Labels | Always visible above the field. Never a placeholder instead of a label. |
| Fields | Serif type (people are writing, so it reads like writing), 1px line, 6px corners |
| Width | 520px at most |
| Required | Ask only for what is used. Email is the only thing usually needed. |
| Consent box | Unticked by default, and says in plain words what happens if ticked |
| Spam trap | A hidden field (`bc-hp`), never a puzzle for people to solve |

**After sending:**

| State | Example | Rule |
|---|---|---|
| Sent | "You're on the list for (place). You'll hear from me when it's happening." | Says what happens next |
| Error | "That didn't send. Check your connection and try again." | Says what happened and what to do. Error red, never only colour (the words carry the meaning). |
| Field problem | "That email is missing an @." | Next to the field, linked with `aria-describedby` |

Error red is `#e8765a` at night and `#a33a1f` in snow. It is used only for errors, never for decoration.

---

## Tags

Small labels that say what kind of thing something is.

| Tag | Colour | Use for |
|---|---|---|
| Default | Quiet text, thin line | Anything general: "Solo", "2026" |
| Water | Glacier | Lakes, sea, diving |
| Trail | Pine | Hikes, forests, mountains |
| Night | Amber | Night skies, stars |

- 12.5px, bold, 3px corners, outline only. Never filled.
- At most four tags on one item.
- Colour is a hint, not the message. The word on the tag always says what it means.

---

## Cards

Cards hold one thing each: a trip, a project, a question.

| Part | Value |
|---|---|
| Background | `--bg-2` (one step up from the page) |
| Edge | 1px line in `--line` |
| Corners | 14px (`--radius-large`) |
| Inside space | 18px on phones, up to 28px |

- **A card is about one thing.** If it needs a heading inside a heading, split it.
- **The whole card is not a link** unless it has only one place to go. Then the title is the link, and a stretched area makes the rest clickable.
- **Photos inside cards** touch the card edges and lose their own corners.
- **Hover** only brightens the edge line. Cards do not jump, tilt or glow.

The home page uses a six-column board where cards span 2, 3, 4 or 6 columns. Below 980px every card takes the full width.

---

## Photos and captions

- Photos sit in a frame with 8px corners and the raised surface colour behind them while loading.
- The **lead photo** keeps its own shape (3:2 or 2:3). The rest flow in columns.
- **Captions** sit under the photo in quiet text, 13.5px: place on the left, date on the right in Doto.
- Camera settings and coordinates go in the X-ray layer, never in the caption ([Perspective](./PHILOSOPHY.md#perspective-the-three-eyes)).
- Every photo has alt text. See [`VOICE.md`](./VOICE.md).

---

## Figures

Numbers that matter (altitudes, depths, days, counts) are set in **Doto**, large and amber, with a small plain label underneath.

> **4,270 m**
> the pass, approx.

- One big figure per card at most.
- The label says what the number means in plain words. The number alone is not enough.
- Figures that are not measured by Soham say "approx." in the label.
- Screen readers get the full sentence ("4,270 metres, the pass"), not the dots.

---

## The trail

Journey pages show stops along a vertical line, with a marker for each stop. The line fills in as you scroll.

- Each stop has a place name, a short note in serif, and its photos.
- A stop without photos says so plainly: "No photos from here on the site yet."
- With reduced motion on, the line is already full and the markers do not animate.

---

## Empty and loading states

| State | Rule | Example |
|---|---|---|
| Loading | A still or gently shimmering block the shape of what is coming. Never a spinner over the whole page. | Photo frames in `--bg-2` |
| Empty | Say what will be here and, if possible, what to do meanwhile | "No essays yet. The first one is on its way." |
| Missing page | Plain words and a way home. (The site has no custom one yet.) | "This page isn't here. Back to basecamp." |

---

## The consent banner

- Appears once, at the bottom, and never covers the main content on a phone.
- "Yes" and "No" are the same size, same style and next to each other. Neither is pre-selected.
- The text follows the shortened version in [`VOICE.md`](./VOICE.md#4-shorter-with-nothing-left-out).
- Nothing is recorded until "Yes" is pressed ([Open to everyone](./PHILOSOPHY.md#open-to-everyone)).

---

## The footer

Every page ends the same way: a short note, the email address in large type, the main links, and the mark. This is the "open door" ([absolute 5](./PHILOSOPHY.md#the-absolutes)). It never becomes a sitemap of every page.

---

## Older pieces still on the site

Some pages were built before Basecamp and still use the older style from `app/globals.css`. Move them over when the page is next touched. Do not use them for anything new.

| Old piece | Where | Replace with |
|---|---|---|
| `btn-primary` (dark fill, mono uppercase) | About, admin | `bc-btn` or `bc-btn--ghost` |
| `btn-accent`, `btn-secondary` | About | `bc-arrow` or `bc-link-btn` |
| `mono-label`, `.label` (JetBrains Mono uppercase) | About, Photography | `bc-eyebrow` |
| `editorial-card`, `glass-card` | About | `bc-card` |
| No global focus outline | Pages outside `bc-shell` | The focus rule above |

The admin area is private and may keep its own style, but it still follows the focus and contrast rules.
