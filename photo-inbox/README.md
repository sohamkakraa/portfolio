# photo-inbox

Drop new photographs here and forget about naming them.

The archive on disk is organised by **subject**, not by trip, and the sync pipeline only
looks one level deep inside `public/photography/`. So a trip cannot have its own folder
there — but you shouldn't have to think about which subject folder each frame belongs to,
or what number to give it, at upload time. That is what this inbox is for.

## How to use it

1. Find (or create) a folder here named `<category>--<Prefix>`.
2. Drop the originals in. Any format the pipeline reads: JPG, PNG, HEIC, TIFF, NEF, DNG, CR2, ARW.
   Filenames don't matter — they get renamed.
3. Run:

```bash
npm run photos:file
```

Every file is moved into `public/photography/<category>/` as `<Prefix> 1`, `<Prefix> 2`, …
continuing from the highest number already there, and a WebP is generated alongside it in
`public/photography-webp/`. The inbox folder is left empty, ready for the next trip.

4. When you want them live:

```bash
npm run photos:sync   # uploads to R2 and regenerates the manifest
```

Add `--dry-run` to `photos:file` to see the plan without moving anything.

## Category names

The part before `--` must be an existing folder in `public/photography/`:

`Startrails` · `astrophotography` · `automobile` · `cityscapes` · `events` · `landscape` · `wildlife`

Note `Startrails` is the folder name on disk; the site shows it as *light-trails*.

## Waiting on

These two folders are the two trips the route's last chapter is missing — the two you took
alone, which is exactly why the gap is worth closing:

| Folder | What goes in it |
| --- | --- |
| `landscape--Grindelwald` | The May 2026 solo hike: the frozen lake, the camp, the walk up |
| `cityscapes--Berlin` | Berlin, the trip after Grindelwald and the newest thing on the route |

If the Grindelwald night produced any star frames, put those in a
`Startrails--Grindelwald` or `astrophotography--Grindelwald` folder instead — the prefix
can repeat across categories, the numbering is per category.
