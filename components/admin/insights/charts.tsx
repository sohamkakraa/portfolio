import type { DayTotals, Ranked, VitalSummary } from "@/lib/analytics/store";

/**
 * Hand-drawn SVG rather than a charting library: three visuals, all server-rendered, so the admin
 * surface adds nothing to the bundle and needs no script allowance in the CSP.
 */

export function Figure({
  value,
  label,
  note,
}: {
  value: string | number;
  label: string;
  note?: string;
}) {
  return (
    <div className="ins-figure">
      <div className="ins-figure-value">{value}</div>
      <div className="ins-figure-label">{label}</div>
      {note ? <div className="ins-figure-note">{note}</div> : null}
    </div>
  );
}

/** Visitors as a filled area, pageviews as a dashed line above it. */
export function TrafficChart({ days }: { days: DayTotals[] }) {
  const w = 720;
  const h = 180;
  const pad = { top: 14, right: 8, bottom: 22, left: 30 };
  const iw = w - pad.left - pad.right;
  const ih = h - pad.top - pad.bottom;

  const peak = Math.max(1, ...days.map((d) => Math.max(d.pageviews, d.visitors)));
  const x = (i: number) => pad.left + (days.length <= 1 ? iw / 2 : (i / (days.length - 1)) * iw);
  const y = (v: number) => pad.top + ih - (v / peak) * ih;

  const line = (key: "visitors" | "pageviews") =>
    days.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join(" ");
  const area = `${line("visitors")} L${x(days.length - 1).toFixed(1)},${(pad.top + ih).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + ih).toFixed(1)} Z`;

  const ticks = [0, Math.round(peak / 2), peak];
  const every = Math.max(1, Math.floor(days.length / 7));

  return (
    <svg className="ins-chart" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Traffic over time">
      {ticks.map((t) => (
        <g key={t}>
          <line className="ins-chart-grid" x1={pad.left} x2={w - pad.right} y1={y(t)} y2={y(t)} />
          <text className="ins-chart-label" x={0} y={y(t) + 3}>
            {t}
          </text>
        </g>
      ))}
      <path className="ins-chart-area" d={area} />
      <path className="ins-chart-line ins-chart-line--second" d={line("pageviews")} />
      <path className="ins-chart-line" d={line("visitors")} />
      {days.map((d, i) =>
        d.visitors > 0 ? <circle key={d.day} className="ins-chart-dot" cx={x(i)} cy={y(d.visitors)} r={2} /> : null
      )}
      {days.map((d, i) =>
        i % every === 0 || i === days.length - 1 ? (
          <text key={d.day} className="ins-chart-label" x={x(i)} y={h - 6} textAnchor="middle">
            {d.day.slice(5)}
          </text>
        ) : null
      )}
    </svg>
  );
}

export type RoadStop = { id: string; label: string; t: number; reached: number };

/**
 * The road, drawn as a band whose width is how many visitors were still walking. The gap between
 * the band and the full height is the drop-off, which is the number worth acting on: it says which
 * chapter loses people, not merely that some leave.
 */
export function RoadFunnel({ stops, starts }: { stops: RoadStop[]; starts: number }) {
  const w = 760;
  const h = 240;
  const left = 16;
  const right = w - 16;
  const mid = 108;
  const maxHalf = 46;
  const base = Math.max(1, starts);

  const px = (t: number) => left + t * (right - left);
  const half = (n: number) => Math.max(0.6, (n / base) * maxHalf);

  const nodes = [{ t: 0, n: starts, label: "arrived", id: "arrive" }, ...stops.map((s) => ({ t: s.t, n: s.reached, label: s.label, id: s.id }))];

  const top = nodes.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.t).toFixed(1)},${(mid - half(p.n)).toFixed(1)}`).join(" ");
  const bottom = [...nodes].reverse().map((p) => `L${px(p.t).toFixed(1)},${(mid + half(p.n)).toFixed(1)}`).join(" ");

  return (
    <svg className="ins-road" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="How far visitors walk the road">
      <rect className="ins-road-band" x={left} y={mid - 1} width={right - left} height={2} />
      <path className="ins-road-reached" d={`${top} ${bottom} Z`} />
      <path className="ins-road-edge" d={top} />
      <path className="ins-road-edge" d={`M${px(0).toFixed(1)},${(mid + half(starts)).toFixed(1)} ${bottom.slice(1)}`} />

      {nodes.map((p, i) => {
        const prev = i > 0 ? nodes[i - 1]!.n : p.n;
        const lost = prev - p.n;
        const share = base ? Math.round((p.n / base) * 100) : 0;
        const above = i % 2 === 0;
        const anchor = i === 0 ? "start" : i === nodes.length - 1 ? "end" : "middle";
        // Labels stack away from the band in a fixed order — name, then count, then loss — so the
        // three lines cannot land on each other the way they did when each had its own offset.
        const rows = above
          ? [mid - maxHalf - 46, mid - maxHalf - 32, mid - maxHalf - 18]
          : [mid + maxHalf + 30, mid + maxHalf + 44, mid + maxHalf + 58];
        return (
          <g key={p.id}>
            <line className="ins-road-stop" x1={px(p.t)} x2={px(p.t)} y1={mid - maxHalf - 8} y2={mid + maxHalf + 8} />
            <text className="ins-road-name" x={px(p.t)} y={above ? rows[2] : rows[0]} textAnchor={anchor}>
              {p.label}
            </text>
            <text className="ins-road-figure" x={px(p.t)} y={above ? rows[1] : rows[1]} textAnchor={anchor}>
              {p.n} · {share}%
            </text>
            {lost > 0 ? (
              <text className="ins-road-drop" x={px(p.t)} y={above ? rows[0] : rows[2]} textAnchor={anchor}>
                −{lost} here
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

export function Bars({ rows, warn = false }: { rows: Ranked[]; warn?: boolean }) {
  if (!rows.length) return <p className="ins-empty">Nothing recorded yet.</p>;
  const peak = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="ins-bars">
      {rows.map((r) => (
        <li
          key={r.label}
          className={`ins-bar${warn ? " ins-bar--warn" : ""}`}
          style={{ ["--w" as string]: `${(r.count / peak) * 100}%` }}
        >
          <span className="ins-bar-label" title={r.label}>
            {r.label}
          </span>
          <span className="ins-bar-count">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

const GOOD = "#7fb069";
const OK = "#d6a85a";
const BAD = "#d98b6a";

export function Vitals({ vitals }: { vitals: VitalSummary[] }) {
  if (!vitals.length) {
    return <p className="ins-empty">No field measurements yet. These fill in as real visits arrive.</p>;
  }
  const unit = (name: string, v: number) =>
    name === "CLS" ? v.toFixed(3) : v >= 1000 ? `${(v / 1000).toFixed(2)}s` : `${Math.round(v)}ms`;

  return (
    <div className="ins-vitals">
      {vitals.map((v) => {
        const total = v.buckets.reduce((s, b) => s + b.count, 0) || 1;
        return (
          <div key={v.name}>
            <div className="ins-vital-name">
              {v.name} · {v.n} {v.n === 1 ? "sample" : "samples"}
            </div>
            <div className="ins-vital-value">{unit(v.name, v.mean)}</div>
            <div className="ins-vital-bar">
              {v.buckets.map((b, i) => (
                <span
                  key={b.label}
                  className="ins-vital-seg"
                  style={{
                    width: `${(b.count / total) * 100}%`,
                    background: i === 0 ? GOOD : i < v.buckets.length - 1 ? OK : BAD,
                  }}
                  title={`${b.label}: ${b.count}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The scroll track as a tiny profile, so a session's shape reads at a glance in the list. */
export function TrackSpark({ track }: { track: number[] }) {
  if (track.length < 2) return <span className="ins-mono">—</span>;
  const w = 130;
  const h = 22;
  const d = track
    .map((p, i) => `${i === 0 ? "M" : "L"}${((i / (track.length - 1)) * w).toFixed(1)},${(h - p * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg className="ins-track" viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <path className="ins-track-line" d={d} />
    </svg>
  );
}
