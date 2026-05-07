"use client";

import type { ContactSection, FooterContent, SocialLink } from "@/lib/portfolio-types";

type Props = {
  contact: ContactSection;
  footer: FooterContent;
  socials: SocialLink[];
};

export default function ContactFooter({ contact, footer, socials }: Props) {
  const allLinks = [...socials, ...(footer.links ?? [])];
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
            Let&rsquo;s{" "}
            <em style={{ color: "var(--accent)", fontStyle: "italic" }}>build</em>
            <br />
            something{" "}
            <em style={{ fontStyle: "italic", color: "var(--ink-2)" }}>
              quietly bold
            </em>
            .
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
              <div style={{ marginTop: 24, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {allLinks.map((l) => (
                  <a
                    key={`${l.label}-${l.href}`}
                    href={l.href}
                    target={l.href.startsWith("http") ? "_blank" : undefined}
                    rel="noreferrer"
                    className="mono"
                    style={{
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "var(--ink-2)",
                      borderBottom: "1px solid var(--line-2)",
                      paddingBottom: 4,
                      textDecoration: "none",
                    }}
                  >
                    {l.label} ↗
                  </a>
                ))}
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
          <span>v3.0 · last edit: today</span>
        </div>
      </footer>
    </>
  );
}
