"use client";

import Link from "next/link";
import { Github, Globe, Instagram, Linkedin, Mail, Settings2 } from "lucide-react";
import type { SocialLink } from "@/lib/portfolio-types";

type FooterProps = {
  name: string;
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

export default function Footer({ name, note, socials, links = [] }: FooterProps) {
  return (
    <footer className="border-t border-[color:var(--border)]">
      <div className="section-container flex min-h-[13rem] flex-col justify-center py-20 md:min-h-[11rem]">
        <div className="flex flex-col items-center justify-between gap-8 text-center md:flex-row md:items-center md:text-left">
          {/* Branding + note (note already carries attribution / year from content) */}
          <div className="max-w-md md:max-w-none">
            <p className="text-lg font-bold tracking-tight text-[color:var(--fg)]">
              {name}
            </p>
            <p className="mt-2 text-xs tracking-[0.15em] uppercase text-[color:var(--fg-muted)]">
              {note}
            </p>
          </div>

          {/* Socials, admin, Viveka */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
                >
                  <Icon size={16} />
                </a>
              );
            })}

            <a
              href="https://viveka.sohamkakra.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center rounded-full border border-[color:var(--border)] px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--fg-muted)] transition hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              Viveka
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
