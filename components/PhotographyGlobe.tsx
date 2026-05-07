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
import type {
  PhotographySection as PhotographySectionType,
  PhotoItem,
} from "@/lib/portfolio-types";

type Frame = {
  id: string;
  src: string;
  title: string;
  description: string;
  category: string;
  categoryTitle: string;
  city: string;
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

const LOCATIONS: Location[] = [
  { id: "eindhoven", name: "Eindhoven", country: "NL", lat: 51.44, lon: 5.48 },
  { id: "amsterdam", name: "Amsterdam", country: "NL", lat: 52.37, lon: 4.90 },
  { id: "dubai", name: "Dubai", country: "AE", lat: 25.20, lon: 55.27 },
  { id: "abudhabi", name: "Abu Dhabi", country: "AE", lat: 24.45, lon: 54.38 },
  { id: "hyderabad", name: "Hyderabad", country: "IN", lat: 17.39, lon: 78.49 },
  { id: "mumbai", name: "Mumbai", country: "IN", lat: 19.08, lon: 72.88 },
  { id: "ladakh", name: "Ladakh", country: "IN", lat: 34.15, lon: 77.58 },
  { id: "london", name: "London", country: "UK", lat: 51.51, lon: -0.13 },
  { id: "reykjavik", name: "Reykjavik", country: "IS", lat: 64.13, lon: -21.94 },
  { id: "tokyo", name: "Tokyo", country: "JP", lat: 35.68, lon: 139.69 },
];

// Hash a string deterministically to choose a city.
function hashTo(loc: Location[], key: string): Location {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return loc[Math.abs(h) % loc.length];
}

function buildFrames(section: PhotographySectionType): Frame[] {
  const out: Frame[] = [];
  for (const cat of section.categories) {
    if (cat.hidden) continue;
    for (const img of cat.images) {
      if (img.hidden) continue;
      const city = hashTo(LOCATIONS, `${cat.slug}/${img.id}`).name;
      out.push({
        id: `${cat.slug}/${img.id}`,
        src: img.src,
        title: img.title || img.id,
        description: img.description || "",
        category: cat.slug,
        categoryTitle: cat.title,
        city,
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
  return out;
}

type Props = {
  section: PhotographySectionType;
};

export default function PhotographyGlobe({ section }: Props) {
  const allFrames = useMemo(() => buildFrames(section), [section]);

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

  return (
    <section
      id="photography"
      className="scroll-mt-24"
      style={{ paddingTop: "clamp(5rem, 10vw, 8rem)", paddingBottom: "clamp(5rem, 10vw, 8rem)" }}
    >
      <div className="section-container">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div>
            <p className="section-label">{"// 03 · field journal"}</p>
            <h2 className="section-title mt-3">
              <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Photographs</em>, mapped to memory.
            </h2>
            <p className="body mt-4 max-w-xl" style={{ color: "var(--ink-2)" }}>
              Filter by category or city. The globe re-aims at the densest region of whatever you select.
            </p>
          </div>
          <div className="mono-label" style={{ color: "var(--ink-3)" }}>
            {filtered.length} / {allFrames.length} frames
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="mono-label" style={{ color: "var(--ink-3)" }}>filters →</span>
          <FilterDropdown
            label="All categories"
            value={category}
            onChange={(v) => setCategory(v)}
            options={categoryOptions.map((c) => ({ value: c.slug, label: `${c.title} · ${c.count}` }))}
          />
          <FilterDropdown
            label="All cities"
            value={city}
            onChange={(v) => setCity(v)}
            options={cityOptions.map((c) => ({ value: c.name, label: `${c.name} · ${c.count}` }))}
          />
          {(category || city) && (
            <button
              onClick={() => { setCategory(null); setCity(null); }}
              className="mono-label"
              style={{
                padding: "8px 12px",
                color: "var(--ink-2)",
                border: "1px solid var(--line-2)",
                borderRadius: 99,
                background: "transparent",
                cursor: "pointer",
              }}
            >
              clear ✕
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={() => setViewAll(true)}
            className="btn-primary"
            style={{ padding: "10px 16px" }}
          >
            View all {filtered.length} →
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-start">
          {/* Globe */}
          <div className="lg:sticky lg:top-24">
            <div style={{ aspectRatio: "1 / 1", maxWidth: "min(560px, 50vw)", margin: "0 auto", position: "relative" }}>
              <Globe
                frames={allFrames}
                category={category}
                city={city}
                onPickCity={(name) => setCity((c) => (c === name ? null : name))}
              />
            </div>
            <div className="mono-label flex justify-between mt-3" style={{ color: "var(--ink-3)" }}>
              <span>drag to rotate</span>
              <span>{LOCATIONS.length} cities · {allFrames.length} frames</span>
            </div>
          </div>

          {/* Curator wall */}
          <div>
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="display-md font-display" style={{ color: "var(--ink)" }}>
                {city ?? (category ? section.categories.find((c) => c.slug === category)?.title : "All work")}
              </h3>
              <span className="mono-label" style={{ color: "var(--ink-3)" }}>
                preview · {Math.min(filtered.length, 12)} of {filtered.length}
              </span>
            </div>
            <div
              style={{
                position: "relative",
                maskImage: filtered.length > 12 ? "linear-gradient(to bottom, black 84%, transparent 100%)" : "none",
                WebkitMaskImage: filtered.length > 12 ? "linear-gradient(to bottom, black 84%, transparent 100%)" : "none",
              }}
            >
              <Mosaic
                frames={previewFrames}
                onPick={(idx) => { setLightbox(idx); setLightboxScope("preview"); }}
              />
              {!filtered.length && (
                <div
                  className="mono-label"
                  style={{
                    padding: "60px 20px",
                    textAlign: "center",
                    border: "1px dashed var(--line-2)",
                    color: "var(--ink-3)",
                    borderRadius: 8,
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
// Filter dropdown — pill button + panel
// ─────────────────────────────────────────────────────────────────────
function FilterDropdown({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", handler);
    return () => window.removeEventListener("pointerdown", handler);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const display = selected ? selected.label : label;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mono-label"
        style={{
          padding: "10px 14px",
          paddingRight: 30,
          background: "var(--bg-2)",
          border: `1px solid ${value ? "var(--accent)" : "var(--line-2)"}`,
          borderRadius: 99,
          color: value ? "var(--accent)" : "var(--ink)",
          cursor: "pointer",
          position: "relative",
        }}
      >
        {display}
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 30,
            minWidth: 200,
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
          }}
        >
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className="mono-label"
            style={{
              display: "block",
              width: "100%",
              textAlign: "left",
              padding: "8px 12px",
              border: "none",
              background: !value ? "var(--bg-3)" : "transparent",
              color: "var(--ink-2)",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false); }}
              className="mono-label"
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                border: "none",
                background: value === o.value ? "var(--bg-3)" : "transparent",
                color: value === o.value ? "var(--accent)" : "var(--ink)",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Globe — orthographic SVG with land outlines + pins
// ─────────────────────────────────────────────────────────────────────
function Globe({
  frames,
  category,
  city,
  onPickCity,
}: {
  frames: Frame[];
  category: string | null;
  city: string | null;
  onPickCity: (name: string) => void;
}) {
  const [rot, setRot] = useState({ lon: -10, lat: 18 });
  const [autoOn, setAutoOn] = useState(true);
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
      const loc = LOCATIONS.find((l) => l.name === city);
      if (loc) flyTo({ lat: loc.lat, lon: -loc.lon });
    } else if (category) {
      // Centroid of cities with this category
      const weighted = LOCATIONS.map((l) => {
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
      {LOCATIONS.map((loc) => {
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
            <circle cx={p.x} cy={p.y} r={size * 0.5} fill="var(--accent)" opacity={p.depth} />
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
// Curator wall mosaic — every 7th tile is 2x2
// ─────────────────────────────────────────────────────────────────────
function Mosaic({
  frames,
  onPick,
}: {
  frames: Frame[];
  onPick: (idx: number) => void;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: "repeat(4, 1fr)",
        gridAutoRows: "120px",
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
        background: "color-mix(in oklab, var(--bg) 92%, transparent)",
        backdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        padding: "32px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          minHeight: 0,
        }}
      >
        <button
          onClick={() => onIndex(Math.max(0, index - 1))}
          className="mono-label"
          style={{ color: "var(--ink-2)", padding: 12, background: "transparent", border: "none", cursor: "pointer" }}
          aria-label="Previous"
          disabled={index === 0}
        >
          ← prev
        </button>
        <div
          style={{
            width: "min(80vw, 1200px)",
            height: "min(80vh, 800px)",
            position: "relative",
          }}
        >
          <Image
            src={f.src}
            alt={f.title}
            fill
            sizes="80vw"
            style={{ objectFit: "contain" }}
          />
        </div>
        <button
          onClick={() => onIndex(Math.min(frames.length - 1, index + 1))}
          className="mono-label"
          style={{ color: "var(--ink-2)", padding: 12, background: "transparent", border: "none", cursor: "pointer" }}
          aria-label="Next"
          disabled={index === frames.length - 1}
        >
          next →
        </button>
      </div>
      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mono-label"
        style={{ color: "var(--ink-3)" }}
      >
        <span style={{ color: "var(--ink-2)" }}>{f.title}</span>
        <span>·</span>
        <span>{f.city}</span>
        {f.date && <><span>·</span><span>{f.date}</span></>}
        {f.exif.lens && <><span>·</span><span>lens {f.exif.lens}</span></>}
        {f.exif.iso && <><span>·</span><span>iso {f.exif.iso}</span></>}
        {f.exif.shutter && <><span>·</span><span>{f.exif.shutter}</span></>}
        {f.exif.aperture && <><span>·</span><span>f/{String(f.exif.aperture).replace(/^f\//, "")}</span></>}
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="mono-label"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          color: "var(--ink-2)",
          background: "transparent",
          border: "1px solid var(--line-2)",
          borderRadius: 99,
          padding: "8px 14px",
          cursor: "pointer",
        }}
      >
        ✕ close
      </button>
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
