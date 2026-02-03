import SectionTitle from "@/components/SectionTitle";
import Card from "@/components/Card";
import { photographyCategories } from "@/data/photography";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photography",
  description: "Photography series, categories, and experiments.",
};

export default function PhotographyPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-14 sm:pt-20 min-h-screen">
      <SectionTitle
        eyebrow="Photography"
        title="Series, studies, and slow experiments"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {photographyCategories.map((category) => (
          <Card
            key={category.slug}
            title={category.title}
            meta="Category"
            description={category.description}
            href={`/photography#${category.slug}`}
            cta="Open"
          />
        ))}
      </div>

      <div className="mt-12 grid gap-10">
        {photographyCategories.map((category) => (
          <section key={category.slug} id={category.slug}>
            <SectionTitle eyebrow="Category" title={category.title} />
            <p className="text-sm leading-relaxed text-[color:var(--muted)]">
              {category.description}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
