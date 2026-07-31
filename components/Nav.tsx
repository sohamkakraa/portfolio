"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import type { NavItem } from "@/lib/portfolio-types";
import ThemeToggle from "@/components/ThemeToggle";
import LogoOrbit from "@/components/LogoOrbit";

type NavProps = {
  name: string;
  nav: NavItem[];
};

/**
 * Real destinations.
 *
 * These were anchors on a single long page, scrolled to by id and tracked with an
 * IntersectionObserver. Each section is its own URL now, so the nav can be links — which means the
 * browser's back button, opening one in a new tab, and sending someone straight to the photographs
 * all work, none of which they did before.
 */
const ROUTES: { href: string; label: string }[] = [
  { href: "/", label: "00 the road" },
  { href: "/work", label: "01 work" },
  { href: "/projects", label: "02 projects" },
  { href: "/photography", label: "03 photographs" },
  { href: "/about", label: "04 about" },
];

export default function Nav({ name }: NavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer on Escape
  useEffect(() => {
    if (!mobileOpen) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [mobileOpen]);

  // Trailing slashes and nested paths both count, so /journeys/climb keeps "the road" lit rather
  // than nothing at all.
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          backdropFilter: "blur(12px)",
          background: "color-mix(in oklab, var(--bg) 75%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div
          className="container"
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              color: "inherit",
              minWidth: 0,
              textDecoration: "none",
            }}
            aria-label="Home"
          >
            <LogoOrbit size={32} ink="var(--ink)" />
            <span
              className="mono nav-wordmark"
              style={{
                fontSize: 11,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--ink)",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {name}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="nav-desktop"
            style={{ alignItems: "center", gap: 4 }}
          >
            {ROUTES.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                aria-current={isActive(r.href) ? "page" : undefined}
                style={{
                  padding: "8px 14px",
                  borderRadius: 99,
                  fontFamily: "var(--font-jetbrains), monospace",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: isActive(r.href) ? "var(--ink)" : "var(--ink-3)",
                  background: isActive(r.href) ? "var(--bg-3)" : "transparent",
                  transition: "all 0.18s",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "none",
                }}
              >
                {r.label}
              </Link>
            ))}
            <ThemeToggle />
          </nav>

          {/* Mobile controls */}
          <div className="nav-mobile" style={{ alignItems: "center", gap: 8 }}>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((o) => !o)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: "1px solid var(--line-2)",
                background: "transparent",
                color: "var(--ink)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      <div
        className="nav-drawer"
        role="dialog"
        aria-modal="true"
        aria-hidden={!mobileOpen}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 49,
          background: "var(--bg)",
          paddingTop: 64,
          paddingBottom: "env(safe-area-inset-bottom)",
          transform: mobileOpen ? "translateY(0)" : "translateY(-100%)",
          transition: "transform 0.32s cubic-bezier(0.7,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
          pointerEvents: mobileOpen ? "auto" : "none",
        }}
      >
        <nav
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "24px clamp(1.25rem, 4vw, 2.5rem)",
            gap: 0,
          }}
        >
          {ROUTES.map((r, i) => {
            const [num, ...rest] = r.label.split(" ");
            const label = rest.join(" ");
            const current = isActive(r.href);
            return (
              <Link
                key={r.href}
                href={r.href}
                onClick={() => setMobileOpen(false)}
                aria-current={current ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 24,
                  padding: "20px 0",
                  borderTop: i === 0 ? "1px solid var(--line)" : "none",
                  borderBottom: "1px solid var(--line)",
                  background: "transparent",
                  border: "none",
                  borderTopWidth: i === 0 ? 1 : 0,
                  borderTopStyle: "solid",
                  borderTopColor: "var(--line)",
                  borderBottomWidth: 1,
                  borderBottomStyle: "solid",
                  borderBottomColor: "var(--line)",
                  cursor: "pointer",
                  textAlign: "left",
                  color: current ? "var(--accent)" : "var(--ink)",
                  width: "100%",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.3em",
                    color: "var(--ink-3)",
                    minWidth: 32,
                  }}
                >
                  {num}
                </span>
                <span
                  className="serif"
                  style={{
                    fontSize: "clamp(28px, 8vw, 44px)",
                    fontWeight: 300,
                    letterSpacing: "-0.02em",
                    textTransform: "lowercase",
                    flex: 1,
                  }}
                >
                  {label}
                </span>
                {current && (
                  <span
                    aria-hidden
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      alignSelf: "center",
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div
          className="mono"
          style={{
            padding: "20px clamp(1.25rem, 4vw, 2.5rem)",
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--ink-3)",
          }}
        >
          <span>{name}</span>
          <span>2026</span>
        </div>
      </div>
    </>
  );
}
