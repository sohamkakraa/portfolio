"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

export type Row = {
  key: string;
  category: string;
  file: string;
  url: string;
  /** What the geocoder guessed. Shown only so you can see how wrong it is. */
  guess: string;
  label: string;
  country: string;
  confirmed: boolean;
  used: boolean;
};

type Edit = { label: string; country: string };
type Filter = "used" | "unconfirmed" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "used", label: "used in prototypes" },
  { id: "unconfirmed", label: "not yet confirmed" },
  { id: "all", label: "everything" },
];

export default function LocationReview({ rows }: { rows: Row[] }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [filter, setFilter] = useState<Filter>("used");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dirty = Object.keys(edits).length;

  const visible = useMemo(
    () =>
      rows.filter((r) => {
        if (filter === "used") return r.used;
        if (filter === "unconfirmed") return !r.confirmed && !edits[r.key];
        return true;
      }),
    [rows, filter, edits]
  );

  const confirmedCount = rows.filter((r) => r.confirmed).length;

  const set = (key: string, patch: Partial<Edit>, row: Row) =>
    setEdits((prev) => ({
      ...prev,
      [key]: {
        label: patch.label ?? prev[key]?.label ?? row.label,
        country: patch.country ?? prev[key]?.country ?? row.country,
      },
    }));

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/lab/places", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entries: edits }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { written: number; total: number };
      setStatus(`saved ${json.written} — ${json.total} confirmed in total`);
      setEdits({});
    } catch (err) {
      setStatus(`failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="lab" style={{ minHeight: "100vh" }}>
      <div className="lab-content" style={{ paddingBottom: "8rem" }}>
        <div style={{ maxWidth: "62rem", margin: "0 auto", padding: "var(--l-5) var(--l-gutter)" }}>
          <div className="lab-eyebrow lab-eyebrow--accent">AUTHORING TOOL · DEVELOPMENT ONLY</div>
          <h1 className="lab-display lab-h2" style={{ marginTop: "var(--l-2)" }}>
            Where was this actually taken?
          </h1>
          <p className="lab-body" style={{ marginTop: "var(--l-3)", maxWidth: "46ch" }}>
            The old file was geocoded from filenames and is wrong often enough to be unusable.
            Anything you leave blank prints no location at all, which is the correct behaviour —
            a missing label is honest, a wrong one is not.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--l-2)",
              alignItems: "center",
              marginTop: "var(--l-4)",
            }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className="lab-eyebrow"
                style={{
                  background: "none",
                  border: "1px solid var(--l-line)",
                  borderRadius: 999,
                  padding: "6px 12px",
                  cursor: "pointer",
                  color: filter === f.id ? "var(--l-ink)" : "var(--l-ink-3)",
                  borderColor: filter === f.id ? "var(--l-accent)" : "var(--l-line)",
                }}
              >
                {f.label}
              </button>
            ))}
            <span className="lab-eyebrow" style={{ marginLeft: "auto" }}>
              {confirmedCount} of {rows.length} confirmed
            </span>
          </div>

          <div style={{ display: "grid", gap: "var(--l-2)", marginTop: "var(--l-4)" }}>
            {visible.map((row) => {
              const edit = edits[row.key];
              const label = edit?.label ?? row.label;
              const country = edit?.country ?? row.country;
              return (
                <div
                  key={row.key}
                  className="lab-panel"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr",
                    gap: "var(--l-3)",
                    alignItems: "start",
                  }}
                >
                  <div style={{ position: "relative", aspectRatio: "3 / 2", borderRadius: 4, overflow: "hidden" }}>
                    <Image src={row.url} alt={row.file} fill sizes="120px" style={{ objectFit: "cover" }} />
                  </div>
                  <div>
                    <div className="lab-mono" style={{ fontSize: "0.8125rem", color: "var(--l-ink)" }}>
                      {row.category}/{row.file}
                    </div>
                    <div className="lab-eyebrow" style={{ marginTop: 4 }}>
                      {row.used ? "used in prototypes · " : ""}
                      {row.guess ? (
                        <>
                          geocoder guessed{" "}
                          <span style={{ textDecoration: "line-through" }}>{row.guess}</span>
                        </>
                      ) : (
                        "no guess on file"
                      )}
                      {row.confirmed ? " · confirmed" : ""}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: "var(--l-2)",
                        marginTop: "var(--l-2)",
                      }}
                    >
                      <input
                        value={label}
                        placeholder="printed label, e.g. Nagaru, Himachal Pradesh"
                        onChange={(e) => set(row.key, { label: e.target.value }, row)}
                        className="lab-input"
                      />
                      <input
                        value={country}
                        placeholder="country"
                        onChange={(e) => set(row.key, { country: e.target.value }, row)}
                        className="lab-input"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {visible.length === 0 ? (
            <p className="lab-italic" style={{ marginTop: "var(--l-4)" }}>
              Nothing left in this filter.
            </p>
          ) : null}
        </div>
      </div>

      <div className="lab-savebar">
        <span className="lab-eyebrow">
          {dirty ? `${dirty} unsaved` : "no changes"}
          {status ? ` · ${status}` : ""}
        </span>
        <button type="button" onClick={save} disabled={!dirty || saving} className="lab-exit">
          {saving ? "saving…" : "save to data/photo-places.json"}
        </button>
      </div>
    </div>
  );
}
