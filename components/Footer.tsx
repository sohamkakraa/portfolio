import Link from "next/link";
import { Github, Globe, Instagram, Linkedin, Mail, Settings2 } from "lucide-react";
import type { SocialLink } from "@/lib/portfolio-types";

type FooterProps = {
  note: string;
  socials: SocialLink[];
  links?: SocialLink[];
};

const iconForSocial = (label: string, href: string) => {
  const lookup = `${label} ${href}`.toLowerCase();
  if (lookup.includes("github")) return Github;
  if (lookup.includes("linkedin")) return Linkedin;
  if (lookup.includes("instagram")) return Instagram;
  if (lookup.includes("mail") || lookup.includes("email")) return Mail;
  return Globe;
};

export default function Footer({ note, socials, links = [] }: FooterProps) {
  return (
    <footer className="border-t border-[color:var(--border)] pb-12 pt-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 md:flex-row md:items-center">
        <p className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)]">{note}</p>

        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em]">
          {socials.map((item) => {
            const Icon = iconForSocial(item.label, item.href);
            return (
              <a
                key={`${item.href}-${item.label}`}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:text-[color:var(--foreground)]"
              >
                <Icon size={15} />
                <span className="sr-only">{item.label}</span>
              </a>
            );
          })}
          {links.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--muted)] transition hover:-translate-y-0.5 hover:text-[color:var(--foreground)]"
            >
              <Settings2 size={15} />
              <span className="sr-only">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
