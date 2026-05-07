"use client";

import type { SocialLink } from "@/lib/portfolio-types";

type FooterProps = {
  name: string;
  note: string;
  socials: SocialLink[];
  links?: SocialLink[];
};

export default function Footer({ name, note, socials, links = [] }: FooterProps) {
  const all = [...socials, ...links];
  return (
    <footer style={{ borderTop: "1px solid var(--line)" }}>
      <div className="section-container flex flex-col gap-4 py-10 md:flex-row md:items-center md:justify-between">
        <div className="mono-label" style={{ color: "var(--ink-3)" }}>
          {note || `Designed and built by ${name} · 2026`}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {all.map((item) => (
            <a
              key={`${item.href}-${item.label}`}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="mono-label relative no-underline"
              style={{ color: "var(--ink-2)", paddingBottom: 4 }}
            >
              <span className="footer-link-text">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
      <style jsx global>{`
        footer .footer-link-text {
          position: relative;
          display: inline-block;
        }
        footer .footer-link-text::after {
          content: "";
          position: absolute;
          left: 0; right: 100%;
          bottom: -4px;
          height: 1px;
          background: var(--accent);
          transition: right 0.22s var(--ease-page);
        }
        footer a:hover .footer-link-text { color: var(--ink); }
        footer a:hover .footer-link-text::after { right: 0; }
      `}</style>
    </footer>
  );
}
