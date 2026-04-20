"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { GalleryImage } from "@/lib/gallery-data";

type Props = {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
};

export default function Lightbox({ images, index, onClose, onNavigate }: Props) {
  const image = images[index];

  const goPrev = useCallback(() => {
    onNavigate(index > 0 ? index - 1 : images.length - 1);
  }, [index, images.length, onNavigate]);

  const goNext = useCallback(() => {
    onNavigate(index < images.length - 1 ? index + 1 : 0);
  }, [index, images.length, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  if (!image) return null;

  return (
    <div className="lightbox-backdrop flex items-center justify-center p-2 sm:p-4">
      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20"
        aria-label="Close"
      >
        <X size={18} />
      </button>

      {/* Prev */}
      <button
        type="button"
        onClick={goPrev}
        className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20 sm:left-4"
        aria-label="Previous image"
      >
        <ChevronLeft size={20} />
      </button>

      {/* Image */}
      <img
        src={image.src}
        alt={image.alt || ""}
        className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain animate-fade-in"
        draggable={false}
      />

      {/* Next */}
      <button
        type="button"
        onClick={goNext}
        className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20 sm:right-4"
        aria-label="Next image"
      >
        <ChevronRight size={20} />
      </button>

      {/* Counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1.5 font-mono text-xs text-white/60 backdrop-blur-sm">
        {index + 1} / {images.length}
      </div>
    </div>
  );
}
