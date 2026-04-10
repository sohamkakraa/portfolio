"use client";

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
    <footer className="border-t border-[color:var(--border)]">
      <div className="section-container py-16">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* Left: branding + note */}
          <div>
            <p className="text-lg font-bold tracking-tight text-[color:var(--fg)]">
              Soham Kakra
            </p>
            <p className="mt-2 text-xs tracking-[0.15em] uppercase text-[color:var(--fg-muted)]">
              {note}
            </p>
          </div>

          {/* Right: socials + admin */}
          <div className="flex flex-wrap items-center gap-3">
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
            {links.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg-muted)] transition-all hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
              >
                <Settings2 size={16} />
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-4 border-t border-[color:var(--border)] pt-8 md:flex-row md:justify-between">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--fg-subtle)]">
            &copy; {new Date().getFullYear()} Soham Kakra. All rights reserved.
          </p>
          <a
            href="https://viveka.sohamkakra.com"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] tracking-[0.2em] uppercase text-[color:var(--fg-subtle)] transition hover:text-[color:var(--accent)]"
          >
            viveka.sohamkakra.com
          </a>
        </div>
      </div>
    </footer>
  );
}
