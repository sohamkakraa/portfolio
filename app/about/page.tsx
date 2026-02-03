import Image from "next/image";
import SectionTitle from "@/components/SectionTitle";
import MarkdownContent from "@/components/MarkdownContent";
import { getMarkdownContent } from "@/lib/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "About Soham and a collection of life and notes.",
};

export default async function AboutPage() {
  const [aboutContent, lifeContent, notesContent] = await Promise.all([
    getMarkdownContent("about"),
    getMarkdownContent("life"),
    getMarkdownContent("notes"),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 pb-20 pt-14 sm:pt-20">
      <section className="min-h-screen grid gap-10 sm:grid-cols-[220px_1fr] sm:items-start">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-black/10 bg-[color:var(--surface)] dark:border-white/10">
          <Image
            src="/me.jpg"
            alt="Portrait photograph"
            fill
            sizes="(min-width: 640px) 220px, 60vw"
            className="object-cover"
            priority
          />
        </div>

        <div>
          <SectionTitle eyebrow="About" title="A short introduction" />
          <MarkdownContent content={aboutContent} />
        </div>
      </section>

      <section id="life" className="mt-14 min-h-screen">
        <SectionTitle eyebrow="Life" title="The pieces outside of work" />
        <MarkdownContent content={lifeContent} />
      </section>

      <section id="notes" className="mt-14 min-h-screen">
        <SectionTitle eyebrow="Notes" title="Loose threads and observations" />
        <MarkdownContent content={notesContent} />
      </section>

      <section id="contact" className="mt-14 min-h-screen">
        <SectionTitle eyebrow="Contact" title="Say hello" />
        <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
          If something here resonates, I would love to hear from you. You can
          reach me through any of the links below.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <a
            className="rounded-full border border-[color:var(--accent)] px-4 py-1.5 text-[color:var(--accent)] transition hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)]"
            href="https://www.linkedin.com/in/yourname"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn
          </a>
          <a
            className="rounded-full border border-[color:var(--accent)] px-4 py-1.5 text-[color:var(--accent)] transition hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)]"
            href="https://www.instagram.com/yourname"
            target="_blank"
            rel="noreferrer"
          >
            Instagram
          </a>
          <a
            className="rounded-full border border-[color:var(--accent)] px-4 py-1.5 text-[color:var(--accent)] transition hover:border-[color:var(--foreground)] hover:text-[color:var(--foreground)]"
            href="mailto:you@example.com"
          >
            Email
          </a>
        </div>
      </section>
    </div>
  );
}
