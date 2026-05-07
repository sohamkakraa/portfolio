"use client";

import BookCoverTile from "@/components/BookCoverTile";
import type { LifeSection as LifeData } from "@/lib/portfolio-types";
import { renderEm } from "@/lib/render-em";

type Props = {
  life: LifeData;
};

const DEFAULT_TITLE = "Books, places, films — {{em}}signals I return to{{/em}}.";

export default function LifeSection({ life }: Props) {
  const title = life.title?.includes("{{em}}") ? life.title : life.title ? life.title : DEFAULT_TITLE;
  const eyebrow = life.eyebrow || "beyond work";
  const readingLabel = life.readingLabel || "Reading library";
  const placesLabel = life.placesLabel || "Places";
  return (
    <section
      id="life"
      style={{ padding: "120px 0", borderTop: "1px solid var(--line)" }}
    >
      <div className="container">
        <div className="label">{`// 04 · ${eyebrow.toLowerCase()}`}</div>
        <h2
          className="serif"
          style={{
            marginTop: 12,
            fontSize: "clamp(40px, 5.5vw, 72px)",
            fontWeight: 300,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            maxWidth: 900,
            color: "var(--ink)",
          }}
        >
          {renderEm(title)}
        </h2>

        <div
          style={{
            marginTop: 60,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
            gap: 56,
          }}
          className="life-2col"
        >
          {/* Reading */}
          <div>
            <div className="label" style={{ marginBottom: 16 }}>
              {readingLabel}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: 12,
              }}
              className="books-grid"
            >
              {life.books.map((book) => (
                <div key={book.title}>
                  <BookCoverTile book={book} />
                  <div
                    className="mono"
                    style={{
                      marginTop: 8,
                      fontSize: 9,
                      color: "var(--accent)",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    {book.theme}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Places */}
          <div>
            <div className="label" style={{ marginBottom: 16 }}>
              {placesLabel}
            </div>
            <ol
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                position: "relative",
                borderLeft: "1px solid var(--line-2)",
                paddingLeft: 24,
              }}
            >
              {life.places.map((entry, i) => (
                <li
                  key={entry.place}
                  style={{ paddingBottom: 24, position: "relative" }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: -29,
                      top: 6,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: i === 0 ? "var(--accent)" : "var(--ink-3)",
                      border: "2px solid var(--bg)",
                      boxShadow:
                        i === 0 ? "0 0 0 4px rgba(214, 168, 90, 0.18)" : "none",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 12,
                    }}
                  >
                    <span
                      className="serif"
                      style={{
                        fontSize: 22,
                        fontWeight: 400,
                        letterSpacing: "-0.02em",
                        color: "var(--ink)",
                      }}
                    >
                      {entry.place}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: "var(--ink-3)",
                        letterSpacing: "0.18em",
                      }}
                    >
                      {entry.context}
                    </span>
                  </div>
                  <p style={{ marginTop: 4, fontSize: 13, color: "var(--ink-2)" }}>
                    {entry.note}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div
          style={{
            marginTop: 80,
            borderTop: "1px solid var(--line-2)",
            paddingTop: 40,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 32,
            }}
            className="entertainment-3col"
          >
            {life.entertainment.map((c) => (
              <div key={c.title}>
                <div
                  className="serif"
                  style={{
                    fontSize: 26,
                    fontWeight: 400,
                    letterSpacing: "-0.02em",
                    color: "var(--ink)",
                  }}
                >
                  {c.title}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0" }}>
                  {c.picks.map((p) => (
                    <li
                      key={p}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 0",
                        borderBottom: "1px dotted var(--line-2)",
                        fontSize: 13,
                        color: "var(--ink-2)",
                      }}
                    >
                      <span>{p}</span>
                      <span
                        className="mono"
                        style={{ fontSize: 10, color: "var(--ink-3)" }}
                      >
                        ↗
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
