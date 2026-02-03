import Link from "next/link";
import { notFound } from "next/navigation";
import SectionTitle from "@/components/SectionTitle";
import MarkdownContent from "@/components/MarkdownContent";
import { workProjects } from "@/data/work";
import { getMarkdownContentByPath } from "@/lib/content";
import type { Metadata } from "next";

type WorkPageProps = {
  params: { slug: string };
};

export default async function WorkProjectPage({ params }: WorkPageProps) {
  const { slug } = params;
  const project = workProjects.find((item) => item.slug === slug);

  if (!project) {
    notFound();
  }

  const content = await getMarkdownContentByPath(["work", slug]);

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-14 sm:pt-20 min-h-screen">
      <Link
        href="/work"
        className="text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
      >
        ← Back to work
      </Link>

      <div className="mt-6">
        <SectionTitle eyebrow="Work" title={project.title} />
        <p className="text-sm text-[color:var(--muted)]">
          {project.meta}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
          {project.description}
        </p>
      </div>

      <div className="mt-10">
        <MarkdownContent content={content} />
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: WorkPageProps): Promise<Metadata> {
  const project = workProjects.find((item) => item.slug === params.slug);

  if (!project) {
    return {
      title: "Project",
      description: "Project details and case study.",
    };
  }

  return {
    title: project.title,
    description: project.description,
  };
}
