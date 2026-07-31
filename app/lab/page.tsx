import Image from "next/image";
import Link from "next/link";
import FilmOverlay from "@/lib/lab/FilmOverlay";
import { photo } from "@/lib/lab/lab-content";

const SPINES = [
  {
    href: "/lab/route",
    id: "A",
    name: "The Route",
    axis: "Place is the axis",
    cover: photo("cityscapes", "Burj Khalifa 1.webp"),
    idea:
      "Three cities you lived in — Sharjah, Dubai, Eindhoven — each with a detour hanging off it: India, Kenya, Europe. None of the moves were yours until Eindhoven, and the detours run the other way, from a family trip to a solo night in a tent. The camera is on rails until the chapter where that changes.",
    instrument: "Where you are, who decided it, and what each place was the first of",
    strength: "Fixes the real problem — work, photos and life stop being separate sections.",
    cost: "Leans entirely on real dates, so every wrong one is visible.",
  },
  {
    href: "/lab/day",
    id: "B",
    name: "One Day",
    axis: "Time is the axis",
    cover: photo("light-trails", "Startrail 1.webp"),
    idea:
      "You stand still and the day moves. 03:40 pre-dawn under the star trails, first light on Sar Pass, working hours, flat noon in Dubai, golden hour in Amboseli, a concert after dark, and back to the same sky. The sky behind the whole page is one uninterrupted interpolation.",
    instrument: "A clock that ticks continuously as you scroll",
    strength: "One continuous variable across the entire site, including the work sections.",
    cost: "Time-of-day is a metaphor, not a biography. Less personal than A.",
  },
  {
    href: "/lab/ascent",
    id: "C",
    name: "The Ascent",
    axis: "Effort is the axis",
    cover: photo("landscape", "Himalayas 5.webp"),
    idea:
      "Closest to the reference you found. A hub of journeys, each its own world. The flagship walks a real trail curve up through rain, a treeline and snow, camps under the Milky Way and reaches the ridge at sunrise. Elevation bands rather than invented altitudes, built from your Himachal frames.",
    instrument: "Elevation band, on a vertical rail from VALLEY to RIDGE",
    strength: "The deepest photography experience, and the format you already responded to.",
    cost: "Every journey is a separate build, and 780vh of scroll surfaces only seven photos.",
  },
];

export default function LabIndex() {
  return (
    <div className="lab lab-hub">
      <div className="lab-hub-glow" aria-hidden />
      <FilmOverlay vignette={0.5} grain={0.05} />

      <div className="lab-wrap">
        <div className="lab-eyebrow">PROTOTYPES · NOT LINKED FROM THE LIVE SITE</div>
        <h1 className="lab-display lab-h2" style={{ marginTop: "var(--l-3)", maxWidth: "26ch" }}>
          Three spines. Pick the one that feels like you.
        </h1>
        <p className="lab-body" style={{ marginTop: "var(--l-4)", maxWidth: "56ch" }}>
          All three use your real photographs and share one design system — the same type scale,
          spacing scale, film grain and colour ramps. What differs is the single continuous thing the
          whole site moves along. Everything marked{" "}
          <span className="lab-ph">like this</span> is copy I refuse to invent for you.
        </p>
        <p className="lab-small" style={{ marginTop: "var(--l-3)", maxWidth: "56ch" }}>
          Each prototype detects whether your device can hold 60fps, drops to a no-WebGL version
          when it cannot, and shows you which path it took in the pill at the bottom. You can force
          either mode from there or with <span className="lab-mono">?mode=lite</span>.
        </p>

        <div
          style={{
            marginTop: "var(--l-6)",
            display: "grid",
            gap: "var(--l-4)",
          }}
        >
          {SPINES.map((s) => (
            <Link
              key={s.id}
              href={s.href}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 200px) minmax(0, 1fr)",
                gap: "var(--l-4)",
                alignItems: "start",
                paddingTop: "var(--l-4)",
                borderTop: "1px solid var(--l-line)",
              }}
              className="lab-spine-row"
            >
              <div className="lab-card" style={{ aspectRatio: "4 / 3" }}>
                <Image src={s.cover} alt={s.name} fill sizes="200px" />
                <span className="lab-card-scrim" />
              </div>

              <div>
                <div className="lab-eyebrow lab-eyebrow--accent">
                  SPINE {s.id} · {s.axis}
                </div>
                <h2
                  className="lab-display lab-h3"
                  style={{ marginTop: 6, marginBottom: "var(--l-2)" }}
                >
                  {s.name}
                </h2>
                <p className="lab-small" style={{ maxWidth: "62ch" }}>
                  {s.idea}
                </p>
                <dl
                  style={{
                    // `margin` has to come first: as shorthand it resets every side, so
                    // declaring it after `marginTop` silently threw the top spacing away and
                    // let this list collide with the paragraph above it.
                    margin: 0,
                    marginTop: "var(--l-3)",
                    display: "grid",
                    gap: "var(--l-1)",
                  }}
                >
                  {[
                    ["persistent instrument", s.instrument],
                    ["why it works", s.strength],
                    ["what it costs", s.cost],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 150px) minmax(0, 1fr)",
                        gap: "var(--l-2)",
                        borderBottom: "1px dotted var(--l-line)",
                        paddingBottom: 7,
                      }}
                    >
                      <dt className="lab-eyebrow">{k}</dt>
                      <dd className="lab-small" style={{ margin: 0, fontSize: "0.875rem" }}>
                        {v}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="lab-eyebrow lab-eyebrow--accent" style={{ marginTop: "var(--l-3)" }}>
                  open spine {s.id} →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* The other door. Every spine above is the slow one; someone deciding whether to
            interview you should not have to scroll a journey to find out what you have done. */}
        <div style={{ marginTop: "var(--l-6)", paddingTop: "var(--l-4)", borderTop: "1px solid var(--l-line)" }}>
          <div className="lab-eyebrow lab-eyebrow--accent">THE FAST DOOR · NO SCROLLING REQUIRED</div>
          <h2 className="lab-display lab-h3" style={{ marginTop: 6, marginBottom: "var(--l-2)" }}>
            Work
          </h2>
          <p className="lab-small" style={{ maxWidth: "62ch" }}>
            The same roles the route carries inline, in full and in reverse order, on a page that
            arrives instantly with no WebGL at all. Six roles and two degrees, every date taken from
            your résumé. Each entry links back to the place on the route where it happened.
          </p>
          <Link href="/lab/work" className="lab-exit" style={{ marginTop: "var(--l-3)", display: "inline-block" }}>
            open work →
          </Link>
        </div>

        <p className="lab-italic" style={{ marginTop: "var(--l-7)", fontSize: "1.0625rem", maxWidth: "44ch" }}>
          These are not mutually exclusive. C can live inside A or B as the photography layer — but
          only one of them can be the thing the site is actually about.
        </p>
      </div>
    </div>
  );
}
