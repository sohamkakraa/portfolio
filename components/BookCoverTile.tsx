"use client";

import { useState } from "react";
import type { LifeBook } from "@/lib/portfolio-types";
import { isbnHasOpenLibraryCover } from "@/lib/book-cover";

export default function BookCoverTile({ book }: { book: LifeBook }) {
  const [failed, setFailed] = useState(false);
  const uploaded = book.coverSrc?.trim();
  const rawIsbn = book.isbn?.trim() ?? "";
  const fromIsbn =
    !uploaded && rawIsbn && isbnHasOpenLibraryCover(rawIsbn)
      ? `/api/book-cover?isbn=${encodeURIComponent(rawIsbn)}`
      : null;
  const src = uploaded || fromIsbn;
  const showImage = Boolean(src) && !failed;
  const isRemote = Boolean(src && (src.startsWith("http") || src.startsWith("/api/book-cover")));

  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] shadow-lg transition-transform group-hover:-translate-y-1">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- Open Library + uploads + same-origin cover API
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          referrerPolicy={isRemote ? "no-referrer" : undefined}
          onError={() => setFailed(true)}
        />
      ) : (
        <>
          <div className={`absolute inset-0 bg-gradient-to-br ${book.palette}`} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.15),transparent_45%)]" />
        </>
      )}
    </div>
  );
}
