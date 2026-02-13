"use client";

import { useMemo, useState } from "react";
import DomeGallery from "@/components/DomeGallery";
import InfiniteMenu, { InfiniteMenuItem } from "@/components/InfiniteMenu";

type PhotographyShowcaseProps = {
  items: InfiniteMenuItem[];
  imagesBySlug: Record<string, string[]>;
};

function getSlugFromLink(link: string) {
  const cleaned = link.replace(/^#/, "");
  const parts = cleaned.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}

export default function PhotographyShowcase({ items, imagesBySlug }: PhotographyShowcaseProps) {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const selectedImages = useMemo(() => {
    if (!selectedSlug) return [] as string[];
    return imagesBySlug[selectedSlug] ?? [];
  }, [imagesBySlug, selectedSlug]);

  const isDomeOpen = selectedSlug !== null;

  return (
    <div className="relative mt-6 h-[72vh] min-h-[520px] w-full overflow-hidden rounded-[32px] border border-white/15 bg-[color:var(--surface)]">
      <div
        className={`absolute inset-0 transition-all duration-500 ease-out ${
          isDomeOpen ? "pointer-events-none scale-[0.98] opacity-0" : "pointer-events-auto scale-100 opacity-100"
        }`}
      >
        <InfiniteMenu
          items={items}
          scale={1}
          onOpenItem={(item) => {
            const slug = getSlugFromLink(item.link);
            if (!slug) return;
            setSelectedSlug(slug);
          }}
        />
      </div>

      <div
        className={`absolute inset-0 transition-all duration-500 ease-out ${
          isDomeOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
          <button
            type="button"
            onClick={() => setSelectedSlug(null)}
            className="rounded-full border border-white/40 bg-black/35 px-4 py-1.5 text-xs uppercase tracking-wide text-white transition hover:border-white hover:bg-black/55"
          >
            Back to menu
          </button>
        </div>

        <div className="h-full w-full">
          <DomeGallery images={selectedImages.length ? selectedImages : ["/Me.jpg"]} grayscale={false} />
        </div>
      </div>
    </div>
  );
}
