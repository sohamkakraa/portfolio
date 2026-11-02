# Where the redesign stands

A note for the next working session. Delete it once the homepage work is done.

Last updated: **2 Nov 2026**. Branch: `claude/sohamkakra-visitor-activity-qxaaq1`.

## Done

- Brand book: [`PHILOSOPHY.md`](./PHILOSOPHY.md), [`VOICE.md`](./VOICE.md), [`VISUAL.md`](./VISUAL.md), [`COMPONENTS.md`](./COMPONENTS.md), [`CHAPTER_TEMPLATE.md`](./CHAPTER_TEMPLATE.md).
- Snow-mode colours fixed so every text colour passes 4.5:1 on every surface.
- Photography look chosen: no preset, cool sky with warm lights, deep shadows with detail, never add fake stars.

## Decided against

Three homepage layouts were mocked up (tidied Basecamp, a night sky of trips, a scroll-through star story). Soham's verdict: **too simple and generic**. Rearranging the same content is not enough. The site should be built from things only he has, even though he is still working out what those are.

## Ideas on the table

Each one comes from his own touchstones in `PHILOSOPHY.md`.

1. **The sky as it really was.** Each trip opens with the real night sky above him that night, computed from a star catalogue plus the photo's date, time and GPS.
2. **The record crate.** Each trip is a record: his photo as the sleeve, its own song, side A what happened, side B what he learned. Link out to music, no audio hosting.
3. **The bus window.** The site is a bus ride. Trips are stops, questions and factoids are scribbled in a notebook.
4. **Starry night from his star trails.** A van Gogh style flow field driven by his real star trail photos.
5. **Wall-E's collection.** One small kept thing per place, on a shelf.

Recommendation so far: **1 as the backbone, 2 as the personality.** Not yet chosen by Soham. He may prefer a short interview first to find what defines him.

## Next steps

1. Read the photo library on Mountain (`~/Desktop/Photographs`). Pull date, time, GPS, camera and lens for every photo, for example with `exiftool -r -csv -n`. The site's own location data is weak (guessed from place names), so the originals are the source of truth.
2. Use that to show Soham what he actually has: which trips, which nights, what the site is missing.
3. Prototype the chosen idea at `/lab/...` before touching real pages. Nothing goes live without Soham's review.

## Rules to keep in mind

- Plain words in menus and links. Creativity goes into what people see and feel, not into labels.
- No "AI" in site copy. No em dashes. British spelling.
- One loud thing per screen. Reduced motion gets a still version of everything.
- Only Soham's own photos. Never fake stars.
