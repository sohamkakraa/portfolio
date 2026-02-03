import SectionTitle from "@/components/SectionTitle";
import Card from "@/components/Card";
import { workProjects } from "@/data/work";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies and ongoing projects.",
};

export default function WorkPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 pb-20 pt-14 sm:pt-20 min-h-screen">
      <SectionTitle eyebrow="Work" title="Case studies and ongoing projects" />

      <div className="grid gap-4">
        {workProjects.map((project) => (
          <Card
            key={project.slug}
            title={project.title}
            meta={project.meta}
            description={project.description}
            href={`/work/${project.slug}`}
            cta="Read case study"
          />
        ))}
      </div>
    </div>
  );
}
