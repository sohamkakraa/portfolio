"use client";

import { Github, Linkedin, Mail, Instagram, Globe, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ContactSection, FooterContent, SocialLink } from "@/lib/portfolio-types";
import { renderEm } from "@/lib/render-em";

function iconFor(label: string, href: string): LucideIcon {
  const k = `${label} ${href}`.toLowerCase();
  if (k.includes("github")) return Github;
  if (k.includes("linkedin")) return Linkedin;
  if (k.includes("instagram")) return Instagram;
  if (k.includes("mail") || k.includes("@") || k.startsWith("mailto")) return Mail;
  return Globe;
}

type Props = {
  contact: ContactSection;
  footer: FooterContent;
  socials: SocialLink[];
};

const DEFAULT_HEADLINE: string[] = [
  "Let's {{em}}build{{/em}}",
  "something {{em}}quietly bold{{/em}}.",
];

export default function ContactFooter({ contact, footer, socials }: Props) {
  const allLinks = [...socials, ...(footer.links ?? [])];
  const headline = contact.headline?.length ? contact.headline : DEFAULT_HEADLINE;
  return (
    <>
      <section
        id="contact"
        style={{
          padding: "120px 0",
          borderTop: "1px solid var(--line)",
          background: "var(--bg-2)",
        }}
      >
        <div className="container">
          <div className="label">{"// 05 · contact"}</div>
          <h2
            className="serif"
            style={{
              marginTop: 16,
              fontSize: "clamp(48px, 9vw, 140px)",
              fontWeight: 300,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              textWrap: "balance",
              color: "var(--ink)",
            }}
          >
            {headline.map((line, i) => (
              <span key={i} style={{ display: "block" }}>
                {renderEm(line)}
              </span>
            ))}
          </h2>
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr",
              gap: 56,
              alignItems: "end",
            }}
            className="contact-2col"
          >
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.55,
                color: "var(--ink-2)",
                maxWidth: 540,
              }}
            >
              {contact.description}
            </p>
            <div>
              <a
                href={`mailto:${contact.email}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "16px 24px",
                  borderRadius: 99,
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 12,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                {contact.email} →
              </a>
              <div style={{ marginTop: 24, display: "flex", gap: 12, flexWrap: "wrap" }}>
                {allLinks.map((l) => {
                  const Icon = iconFor(l.label, l.href);
                  return (
                    <a
                      key={`${l.label}-${l.href}`}
                      href={l.href}
                      target={l.href.startsWith("http") ? "_blank" : undefined}
                      rel="noreferrer"
                      className="mono contact-social"
                      aria-label={l.label}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        border: "1px solid var(--line-2)",
                        borderRadius: 99,
                        color: "var(--ink-2)",
                        fontSize: 11,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        textDecoration: "none",
                        transition: "color 0.18s, border-color 0.18s",
                      }}
                    >
                      <Icon size={14} aria-hidden />
                      <span>{l.label}</span>
                      <ArrowUpRight size={12} aria-hidden style={{ opacity: 0.6 }} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
      <footer
        style={{ padding: "40px 0", borderTop: "1px solid var(--line)" }}
      >
        <div
          className="container mono"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span>{footer.note || "Designed & built · soham kakra · 2026"}</span>
          {footer.versionNote && <span>{footer.versionNote}</span>}
        </div>
      </footer>
    </>
  );
}
