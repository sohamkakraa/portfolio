"use client";

import { useState } from "react";
import type { LifeBook } from "@/lib/portfolio-types";
import { openLibraryIsbnCoverUrl } from "@/lib/book-cover";

export default function BookCoverTile({ book }: { book: LifeBook }) {
  const [failed, setFailed] = useState(false);
  const uploaded = book.coverSrc?.trim();
  const fromIsbn = !uploaded && book.isbn?.trim() ? openLibraryIsbnCoverUrl(book.isbn) : null;
  const src = uploaded || fromIsbn;
  const showImage = Boolean(src) && !failed;

  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--bg-elevated)] shadow-lg transition-transform group-hover:-translate-y-1">
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote Open Library + uploaded paths
        <img
          src={src!}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
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
