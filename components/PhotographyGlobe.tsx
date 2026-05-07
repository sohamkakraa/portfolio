"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import LAND_PATHS from "@/data/land-paths.json";
import PHOTO_LOCATIONS from "@/data/photo-locations.json";
import type {
  PhotographySection as PhotographySectionType,
  PhotoItem,
} from "@/lib/portfolio-types";

type EnrichedLocation = {
  city: string;
  country: string;
  countryCode?: string;
  lat: number;
  lon: number;
};
const PHOTO_LOC_MAP = PHOTO_LOCATIONS as Record<string, EnrichedLocation>;

type Frame = {
  id: string;
  src: string;
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  city: string;
  country?: string;
  landmark?: string;
  lat?: number;
  lon?: number;
  date?: string;
  exif: { lens?: string; iso?: string; shutter?: string; aperture?: string };
};

type Location = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
};

// Pull manifest key from photo src. /photography-webp/wildlife/Lion.webp → wildlife/Lion.webp
function manifestKey(src: string): string {
  return src.replace(/^\/?photography-webp\//, "");
}

// City index built once from the geocoded photo-locations.json. Used to look
// up lat/lon when an admin overrides a photo's city via meta.city.
const CITY_INDEX = (() => {
  const idx = new Map<string, EnrichedLocation>();
  for (const v of Object.values(PHOTO_LOC_MAP)) {
    if (v.city && !idx.has(v.city)) idx.set(v.city, v);
  }
  return idx;
})();

function buildFrames(section: PhotographySectionType): { frames: Frame[]; locations: Location[] } {
  const frames: Frame[] = [];
  const locByName = new Map<string, Location>();

  for (const cat of section.categories) {
    if (cat.hidden) continue;
    for (const img of cat.images) {
      if (img.hidden) continue;

      // Resolve city/country/lat/lon. Admin overrides win; fall back to
      // the auto-enriched manifest entry; finally "Unmapped".
      const overrideCity = img.meta?.city?.trim();
      const overrideCountry = img.meta?.country?.trim();
      const enriched = PHOTO_LOC_MAP[manifestKey(img.src)];
      let city = overrideCity || enriched?.city || "Unmapped";
      let country = overrideCountry || enriched?.country;
      let lat: number | undefined = enriched?.lat;
      let lon: number | undefined = enriched?.lon;
      let countryCode: string | undefined = enriched?.countryCode;

      if (overrideCity && CITY_INDEX.has(overrideCity)) {
        const known = CITY_INDEX.get(overrideCity)!;
        lat = known.lat;
        lon = known.lon;
        country = country || known.country;
        countryCode = countryCode || known.countryCode;
      }

      if (lat !== undefined && lon !== undefined && city !== "Unmapped" && !locByName.has(city)) {
        locByName.set(city, {
          id: city.toLowerCase().replace(/\s+/g, "-"),
          name: city,
          country: countryCode || (country?.slice(0, 2).toUpperCase() ?? ""),
          lat,
          lon,
        });
      }

      frames.push({
        id: `${cat.slug}/${img.id}`,
        src: img.src,
        title: img.title || img.id,
        description: img.description || "",
        category: cat.slug,
        categoryTitle: cat.title,
        city,
        country,
        landmark: img.meta?.landmark,
        lat,
        lon,
        date: img.meta?.date,
        exif: {
          lens: img.meta?.lens,
          iso: img.meta?.iso,
          shutter: img.meta?.shutter,
          aperture: img.meta?.aperture,
        },
      });
    }
  }

  return { frames, locations: Array.from(locByName.values()) };
}

type Props = {
  section: PhotographySectionType;
};

export default function PhotographyGlobe({ section }: Props) {
  const { frames: allFrames, locations: LOCATIONS } = useMemo(() => buildFrames(section), [section]);

  const [category, setCategory] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [lightboxScope, setLightboxScope] = useState<"preview" | "all">("preview");
  const [viewAll, setViewAll] = useState(false);

  const filtered = useMemo(
    () =>
      allFrames.filter(
        (f) =>
          (!category || f.category === category) && (!city || f.city === city)
      ),
    [allFrames, category, city]
  );

  // Only cities/categories with frames
  const categoryOptions = useMemo(() => {
    const set = new Map<string, { count: number; title: string }>();
    for (const f of allFrames) {
      const key = f.category;
      if (!set.has(key)) set.set(key, { count: 0, title: f.categoryTitle });
      set.get(key)!.count += city ? (f.city === city ? 1 : 0) : 1;
    }
    return Array.from(set.entries())
      .filter(([, v]) => v.count > 0)
      .map(([slug, v]) => ({ slug, title: v.title, count: v.count }));
  }, [allFrames, city]);

  const cityOptions = useMemo(() => {
    const set = new Map<string, number>();
    for (const f of allFrames) {
      if (category && f.category !== category) continue;
      set.set(f.city, (set.get(f.city) ?? 0) + 1);
    }
    return Array.from(set.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [allFrames, category]);

  const previewFrames = filtered.slice(0, 12);
  const lightboxFrames = lightboxScope === "all" ? filtered : previewFrames;

  const ddStyle: React.CSSProperties = {
    appearance: "none",
    padding: "10px 36px 10px 14px",
    borderRadius: 99,
    border: "1px solid var(--line-2)",
    background: "var(--bg-2)",
    color: "var(--ink)",
    fontFamily: "var(--font-jetbrains), monospace",
    fontSize: 11,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    cursor: "pointer",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23999' stroke-width='1.2' fill='none'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
  };

  return (
    <section
      id="photography"
      style={{
        padding: "120px 0",
        borderTop: "1px solid var(--line)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <div>
            <div className="label">{"// 03 · field journal"}</div>
            <h2
              className="serif"
              style={{
                marginTop: 12,
                fontSize: "clamp(40px, 5.5vw, 72px)",
                fontWeight: 300,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Photographs</em>, mapped to memory.
            </h2>
            <p
              style={{
                marginTop: 16,
                fontSize: 15,
                color: "var(--ink-2)",
                maxWidth: 540,
              }}
            >
              Filter by category or city. The globe re-aims at the densest region of whatever you select.
            </p>
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {filtered.length} / {allFrames.length} frames
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 32,
            alignItems: "center",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--ink-3)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              marginRight: 4,
            }}
          >
            filters →
          </div>
          <select
            value={category || ""}
            onChange={(e) => setCategory(e.target.value || null)}
            style={{
              ...ddStyle,
              ...(category
                ? { borderColor: "var(--accent)", color: "var(--accent)" }
                : {}),
            }}
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title} · {c.count}
              </option>
            ))}
          </select>
          <select
            value={city || ""}
            onChange={(e) => setCity(e.target.value || null)}
            style={{
              ...ddStyle,
              ...(city
                ? { borderColor: "var(--accent)", color: "var(--accent)" }
                : {}),
            }}
          >
            <option value="">All cities</option>
            {cityOptions.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} · {c.count}
              </option>
            ))}
          </select>
          {(category || city) && (
            <button
              onClick={() => {
                setCategory(null);
                setCity(null);
              }}
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-2)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "10px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              clear ✕
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setViewAll(true)}
            className="mono"
            style={{
              padding: "10px 18px",
              borderRadius: 99,
              border: "1px solid var(--ink)",
              background: "var(--ink)",
              color: "var(--bg)",
              fontSize: 10,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            View all {filtered.length} →
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
            gap: 40,
            alignItems: "start",
            maxHeight: "calc(100vh - 120px)",
          }}
          className="globe-wall-grid"
        >
          <div>
            <div
              style={{
                aspectRatio: "1 / 1",
                maxHeight: "calc(100vh - 240px)",
                position: "relative",
                margin: "0 auto",
                maxWidth: "calc(100vh - 240px)",
              }}
            >
              <Globe
                frames={allFrames}
                locations={LOCATIONS}
                category={category}
                city={city}
                onPickCity={(name) => setCity((c) => (c === name ? null : name))}
              />
            </div>
            <div
              className="mono"
              style={{
                marginTop: 14,
                fontSize: 10,
                color: "var(--ink-3)",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>drag to rotate</span>
              <span>
                {LOCATIONS.length} cities · {allFrames.length} frames
              </span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "calc(100vh - 180px)",
              minHeight: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
                flexShrink: 0,
              }}
            >
              <h3
                className="serif"
                style={{
                  fontSize: 26,
                  fontWeight: 400,
                  letterSpacing: "-0.02em",
                  color: "var(--ink)",
                }}
              >
                {city ??
                  (category
                    ? section.categories.find((c) => c.slug === category)?.title
                    : "All work")}
              </h3>
              <span
                className="mono"
                style={{
                  fontSize: 10,
                  color: "var(--ink-3)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                preview · {Math.min(filtered.length, 12)} of {filtered.length}
              </span>
            </div>
            <div
              style={{
                overflow: "hidden",
                flex: 1,
                minHeight: 0,
                maskImage:
                  filtered.length > 12
                    ? "linear-gradient(to bottom, black 80%, transparent 100%)"
                    : "none",
                WebkitMaskImage:
                  filtered.length > 12
                    ? "linear-gradient(to bottom, black 80%, transparent 100%)"
                    : "none",
              }}
            >
              <Mosaic frames={previewFrames} onPick={(idx) => { setLightbox(idx); setLightboxScope("preview"); }} />
              {!filtered.length && (
                <div
                  className="mono"
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    border: "1px dashed var(--line-2)",
                    color: "var(--ink-3)",
                  }}
                >
                  no frames match this filter
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {viewAll && (
        <ViewAllOverlay
          frames={filtered}
          city={city}
          categoryTitle={category ? section.categories.find((c) => c.slug === category)?.title : null}
          onClose={() => setViewAll(false)}
          onPick={(idx) => { setLightbox(idx); setLightboxScope("all"); }}
          onClearCategory={() => setCategory(null)}
          onClearCity={() => setCity(null)}
        />
      )}

      {lightbox !== null && lightboxFrames[lightbox] && (
        <Lightbox
          frames={lightboxFrames}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onIndex={setLightbox}
        />
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Globe — orthographic SVG with land outlines + pins
// ─────────────────────────────────────────────────────────────────────
function Globe({
  frames,
  locations,
  category,
  city,
  onPickCity,
}: {
  frames: Frame[];
  locations: Location[];
  category: string | null;
  city: string | null;
  onPickCity: (name: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [rot, setRot] = useState({ lon: -10, lat: 18 });
  const [autoOn, setAutoOn] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hovered, setHovered] = useState<Location | null>(null);
  const targetRef = useRef<{ lat: number; lon: number } | null>(null);
  const flyRef = useRef<number | null>(null);

  const cityCounts = useMemo(() => {
    const m = new Map<string, Map<string, number>>();
    for (const f of frames) {
      if (!m.has(f.city)) m.set(f.city, new Map());
      const sub = m.get(f.city)!;
      sub.set(f.category, (sub.get(f.category) ?? 0) + 1);
    }
    return m;
  }, [frames]);

  // Auto-rotate
  useEffect(() => {
    if (!autoOn) return;
    let raf = 0;
    const tick = () => {
      setRot((p) => ({ ...p, lon: (p.lon + 0.04) % 360 }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoOn]);

  const pauseAndResume = useCallback(() => {
    setAutoOn(false);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setAutoOn(true), 4000);
  }, []);

  // Drag
  const dragRef = useRef<{ x: number; y: number; lon: number; lat: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    pauseAndResume();
    dragRef.current = { x: e.clientX, y: e.clientY, lon: rot.lon, lat: rot.lat };
    const move = (ev: PointerEvent) => {
      const d = dragRef.current!;
      const dx = ev.clientX - d.x;
      const dy = ev.clientY - d.y;
      setRot({
        lon: d.lon + dx * 0.45,
        lat: Math.max(-80, Math.min(80, d.lat - dy * 0.4)),
      });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      pauseAndResume();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // Fly-to centroid when filter changes
  const flyTo = useCallback((target: { lat: number; lon: number }) => {
    if (flyRef.current) cancelAnimationFrame(flyRef.current);
    setAutoOn(false);
    targetRef.current = target;
    const start = { ...rot };
    const t0 = performance.now();
    const dur = 1100;
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / dur);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // cubic-bezier ish
      let dl = target.lon - start.lon;
      while (dl > 180) dl -= 360;
      while (dl < -180) dl += 360;
      setRot({
        lon: start.lon + dl * e,
        lat: start.lat + (target.lat - start.lat) * e,
      });
      if (t < 1 && targetRef.current === target) flyRef.current = requestAnimationFrame(step);
      else if (idleRef.current) clearTimeout(idleRef.current);
    };
    flyRef.current = requestAnimationFrame(step);
    if (idleRef.current) clearTimeout(idleRef.current);
    idleRef.current = setTimeout(() => setAutoOn(true), 4000);
  }, [rot]);

  useEffect(() => {
    if (city) {
      const loc = locations.find((l) => l.name === city);
      if (loc) flyTo({ lat: loc.lat, lon: -loc.lon });
    } else if (category) {
      // Centroid of cities with this category
      const weighted = locations.map((l) => {
        const sub = cityCounts.get(l.name);
        const n = sub ? sub.get(category) ?? 0 : 0;
        return { l, n };
      }).filter((x) => x.n > 0);
      if (weighted.length) {
        let x = 0, y = 0, lat = 0, total = 0;
        for (const { l, n } of weighted) {
          const r = (l.lon * Math.PI) / 180;
          x += Math.cos(r) * n; y += Math.sin(r) * n; lat += l.lat * n; total += n;
        }
        const lon = (Math.atan2(y, x) * 180) / Math.PI;
        flyTo({ lat: lat / total, lon: -lon });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, category]);

  // Projection
  const cx = 300, cy = 300, R = 240;
  const project = (lat: number, lon: number) => {
    const phi = (lat * Math.PI) / 180;
    const lam = ((lon + rot.lon) * Math.PI) / 180;
    const phi0 = (rot.lat * Math.PI) / 180;
    const cosc = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lam);
    if (cosc < 0) return null;
    const x = R * Math.cos(phi) * Math.sin(lam);
    const y = R * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lam));
    return { x: cx + x, y: cy - y, depth: cosc };
  };

  // Graticule
  const lines: React.ReactElement[] = [];
  for (let lon = -180; lon <= 180; lon += 30) {
    const pts: string[] = [];
    for (let lat = -80; lat <= 80; lat += 5) {
      const p = project(lat, lon);
      if (p) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    if (pts.length > 1) {
      lines.push(<polyline key={`v${lon}`} points={pts.join(" ")} stroke="var(--line)" strokeWidth="0.5" fill="none" opacity="0.5" />);
    }
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const pts: string[] = [];
    for (let lon = -180; lon <= 180; lon += 5) {
      const p = project(lat, lon);
      if (p) pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
    if (pts.length > 1) {
      lines.push(<polyline key={`h${lat}`} points={pts.join(" ")} stroke="var(--line)" strokeWidth="0.5" fill="none" opacity="0.5" />);
    }
  }

  // Land outlines
  const land: React.ReactElement[] = [];
  (LAND_PATHS as number[][][]).forEach((path, idx) => {
    let cur: string[] = [];
    const flushSegments: string[][] = [];
    path.forEach(([lat, lon]) => {
      const p = project(lat, lon);
      if (p) cur.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
      else if (cur.length > 1) { flushSegments.push(cur); cur = []; }
      else cur = [];
    });
    if (cur.length > 1) flushSegments.push(cur);
    flushSegments.forEach((seg, i) => {
      land.push(
        <polyline
          key={`L${idx}-${i}`}
          points={seg.join(" ")}
          fill="none"
          stroke="var(--ink-2)"
          strokeOpacity="0.45"
          strokeWidth="0.6"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      );
    });
  });

  if (!mounted) {
    return (
      <svg viewBox="0 0 600 600" className="globe-svg">
        <circle cx={cx} cy={cy} r={R} fill="var(--bg-2)" stroke="var(--line-2)" strokeWidth="1" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 600 600"
      onPointerDown={onPointerDown}
      className="globe-svg"
    >
      <defs>
        <radialGradient id="globe-glow" cx="40%" cy="40%">
          <stop offset="0%" stopColor="var(--bg-3)" stopOpacity="1" />
          <stop offset="80%" stopColor="var(--bg-2)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--bg)" stopOpacity="1" />
        </radialGradient>
        <radialGradient id="globe-atmos" cx="50%" cy="50%">
          <stop offset="92%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R + 8} fill="url(#globe-atmos)" />
      <circle cx={cx} cy={cy} r={R} fill="url(#globe-glow)" stroke="var(--line-2)" strokeWidth="1" />
      {lines}
      {land}
      {locations.map((loc) => {
        const p = project(loc.lat, loc.lon);
        if (!p) return null;
        const sub = cityCounts.get(loc.name);
        const total = sub ? Array.from(sub.values()).reduce((a, b) => a + b, 0) : 0;
        const cnt = category ? (sub?.get(category) ?? 0) : total;
        const dim = (category && cnt === 0) || total === 0;
        const size = 4 + Math.sqrt(Math.max(cnt, 1)) * 1.5;
        const isH = hovered?.id === loc.id;
        return (
          <g
            key={loc.id}
            onPointerEnter={() => setHovered(loc)}
            onPointerLeave={() => setHovered((h) => (h?.id === loc.id ? null : h))}
            onClick={(e) => {
              e.stopPropagation();
              if (!dim) onPickCity(loc.name);
            }}
            style={{ cursor: dim ? "default" : "pointer", opacity: dim ? 0.2 : 1 }}
          >
            <circle cx={p.x} cy={p.y} r={size + (isH ? 6 : 0)} fill="var(--accent)" opacity={isH ? 0.22 : 0.1} />
            <circle cx={p.x} cy={p.y} r={size * 0.5} fill="var(--accent)" opacity={Number(p.depth.toFixed(3))} />
            {isH && (
              <g>
                <line x1={p.x} y1={p.y} x2={p.x + 24} y2={p.y - 18} stroke="var(--accent)" strokeWidth="0.6" />
                <text x={p.x + 28} y={p.y - 18} fontFamily="var(--font-jetbrains), monospace" fontSize="11" fill="var(--ink)">{loc.name}</text>
                <text x={p.x + 28} y={p.y - 6} fontFamily="var(--font-jetbrains), monospace" fontSize="9" fill="var(--ink-3)" letterSpacing="2">{cnt} FRAMES · {loc.country}</text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Curator wall mosaic — 8-position size pattern from prototype
// ─────────────────────────────────────────────────────────────────────
const SIZES: { c: string; r: string }[] = [
  { c: "span 2", r: "span 2" },
  { c: "span 1", r: "span 1" },
  { c: "span 1", r: "span 1" },
  { c: "span 2", r: "span 1" },
  { c: "span 1", r: "span 2" },
  { c: "span 1", r: "span 1" },
  { c: "span 1", r: "span 1" },
  { c: "span 1", r: "span 1" },
];

function Mosaic({
  frames,
  onPick,
}: {
  frames: Frame[];
  onPick: (idx: number) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "120px",
        gap: 8,
        gridAutoFlow: "dense",
      }}
    >
      {frames.slice(0, 24).map((f, i) => {
        const s = SIZES[i % SIZES.length];
        return (
          <button
            key={f.id}
            onClick={() => onPick(i)}
            className="photo-tile"
            style={{
              gridColumn: s.c,
              gridRow: s.r,
              minHeight: 0,
              padding: 0,
            }}
            aria-label={f.title}
          >
            <Image
              src={f.src}
              alt={f.title}
              width={800}
              height={1000}
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
            <div className="photo-tile-caption">
              {f.city}{f.date ? ` · ${f.date}` : ""}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Lightbox
// ─────────────────────────────────────────────────────────────────────
function Lightbox({
  frames,
  index,
  onClose,
  onIndex,
}: {
  frames: Frame[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const f = frames[index];
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
      if (e.key === "ArrowRight") onIndex(Math.min(frames.length - 1, index + 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [index, frames.length, onClose, onIndex]);

  if (!f) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 220,
        background: "rgba(8,8,9,0.96)",
        backdropFilter: "blur(8px)",
        display: "grid",
        gridTemplateColumns: "1fr 320px",
      }}
      className="lightbox"
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 56,
        }}
      >
        <div
          style={{
            width: "min(90%, 1000px)",
            height: "min(85vh, 800px)",
            position: "relative",
          }}
        >
          <Image src={f.src} alt={f.title} fill sizes="80vw" style={{ objectFit: "contain" }} />
        </div>
        <button
          onClick={onClose}
          className="mono"
          style={{
            position: "absolute",
            top: 24,
            right: 24,
            color: "var(--ink-2)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          ✕ Close
        </button>
        <button
          onClick={() => onIndex(Math.max(0, index - 1))}
          className="mono"
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-2)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
          aria-label="Previous"
          disabled={index === 0}
        >
          ← prev
        </button>
        <button
          onClick={() => onIndex(Math.min(frames.length - 1, index + 1))}
          className="mono"
          style={{
            position: "absolute",
            right: 56,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--ink-2)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
          aria-label="Next"
          disabled={index === frames.length - 1}
        >
          next →
        </button>
      </div>
      <aside style={{ borderLeft: "1px solid var(--line)", padding: "56px 32px", overflowY: "auto" }}>
        <div
          className="mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          {f.categoryTitle}
        </div>
        <h3
          className="serif"
          style={{
            marginTop: 8,
            fontSize: 28,
            fontWeight: 400,
            color: "var(--ink)",
            letterSpacing: "-0.02em",
          }}
        >
          {f.title}
        </h3>
        <p
          className="mono"
          style={{ marginTop: 12, fontSize: 12, color: "var(--ink-2)" }}
        >
          {f.landmark ? `${f.landmark} · ` : ""}
          {f.city}
          {f.country ? ` · ${f.country}` : ""}
          {f.date ? ` · ${f.date}` : ""}
        </p>
        {f.description && (
          <p style={{ marginTop: 14, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55 }}>
            {f.description}
          </p>
        )}
        <table
          className="mono"
          style={{
            marginTop: 32,
            width: "100%",
            fontSize: 12,
            borderCollapse: "collapse",
          }}
        >
          <tbody>
            {[
              ["Lens", f.exif.lens],
              ["ISO", f.exif.iso],
              ["Shutter", f.exif.shutter],
              ["Aperture", f.exif.aperture],
            ]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <tr key={k}>
                  <td style={{ color: "var(--ink-3)", padding: "8px 0", borderBottom: "1px dotted var(--line)" }}>
                    {k}
                  </td>
                  <td style={{ textAlign: "right", padding: "8px 0", borderBottom: "1px dotted var(--line)" }}>
                    {v}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </aside>
    </div>
  );
}

function ViewAllOverlay({
  frames,
  city,
  categoryTitle,
  onClose,
  onPick,
  onClearCity,
  onClearCategory,
}: {
  frames: Frame[];
  city: string | null;
  categoryTitle: string | null | undefined;
  onClose: () => void;
  onPick: (idx: number) => void;
  onClearCity: () => void;
  onClearCategory: () => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 210,
        background: "var(--bg)",
        overflowY: "auto",
        animation: "fade-in 0.3s ease-out",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--line)",
          background: "color-mix(in oklab, var(--bg) 90%, transparent)",
          backdropFilter: "blur(12px)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div className="flex items-center gap-3">
          <span className="mono-label" style={{ color: "var(--ink-3)" }}>field journal · full archive</span>
          {categoryTitle && (
            <FilterChip label={categoryTitle} onClear={onClearCategory} />
          )}
          {city && (
            <FilterChip label={city} onClear={onClearCity} />
          )}
          <span className="mono-label" style={{ color: "var(--ink-3)" }}>{frames.length} frames</span>
        </div>
        <button
          onClick={onClose}
          className="mono-label"
          style={{
            padding: "8px 14px",
            border: "1px solid var(--line-2)",
            borderRadius: 99,
            color: "var(--ink-2)",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ← close
        </button>
      </div>
      <div style={{ padding: "32px", maxWidth: 1400, margin: "0 auto" }}>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(min(260px, 100%), 1fr))",
            gridAutoRows: "200px",
            gridAutoFlow: "dense",
          }}
        >
          {frames.map((f, i) => {
            const big = i % 7 === 0;
            return (
              <button
                key={f.id}
                onClick={() => onPick(i)}
                className="photo-tile"
                style={{
                  gridColumn: big ? "span 2" : "span 1",
                  gridRow: big ? "span 2" : "span 1",
                  minHeight: 0,
                }}
                aria-label={f.title}
              >
                <Image
                  src={f.src}
                  alt={f.title}
                  width={800}
                  height={1000}
                  loading="lazy"
                  sizes="(max-width: 640px) 50vw, 25vw"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
                <div className="photo-tile-caption">
                  {f.city}{f.date ? ` · ${f.date}` : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span
      className="mono-label inline-flex items-center gap-2"
      style={{
        padding: "6px 10px",
        border: "1px solid var(--line-2)",
        borderRadius: 99,
        color: "var(--ink)",
      }}
    >
      {label}
      <button
        onClick={onClear}
        aria-label={`Remove ${label}`}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--ink-3)",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        ✕
      </button>
    </span>
  );
}

// Re-export type for compat with PortfolioPage
export type { PhotoItem };
