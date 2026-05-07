"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import type { NavItem } from "@/lib/portfolio-types";
import ThemeToggle from "@/components/ThemeToggle";
import LogoOrbit from "@/components/LogoOrbit";

type NavProps = {
  name: string;
  nav: NavItem[];
};

export default function Nav({ name, nav }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 60);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "nav-floating" : ""}`}
      >
        <div className="section-container">
          <div className="flex h-20 items-center justify-between md:h-[80px]">
            {/* Mark + wordmark */}
            <Link
              href="/#top"
              className="group relative inline-flex items-center gap-3 no-underline"
              aria-label={`${name} — home`}
            >
              <LogoOrbit size={48} ink="var(--ink)" />
              <span
                className="hidden sm:inline relative font-mono text-[11px] font-semibold uppercase"
                style={{ letterSpacing: "0.2em", color: "var(--ink)" }}
              >
                {name}
                <span
                  className="absolute -bottom-1 left-0 h-[2px] w-0 transition-all duration-300 group-hover:w-full"
                  style={{ background: "var(--accent)" }}
                />
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="mono-label relative rounded-full px-3 py-2 no-underline transition-colors"
                  style={{ color: "var(--ink-2)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-2)")}
                >
                  {item.label}
                </Link>
              ))}

              <a
                href="https://viveka.sohamkakra.com"
                target="_blank"
                rel="noreferrer"
                className="ml-3 inline-flex items-center gap-2 mono-label"
                style={{
                  padding: "8px 12px",
                  background: "var(--accent)",
                  color: "var(--bg)",
                  borderRadius: 4,
                }}
              >
                <span>Viveka</span>
                <ArrowUpRight size={12} />
              </a>

              <div className="ml-3">
                <ThemeToggle />
              </div>
            </nav>

            {/* Mobile controls */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="inline-flex h-10 w-10 items-center justify-center"
                style={{
                  border: "1px solid var(--line-2)",
                  borderRadius: 99,
                  color: "var(--ink)",
                  background: "transparent",
                }}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col md:hidden"
          style={{
            background: "color-mix(in oklab, var(--bg) 96%, transparent)",
            backdropFilter: "blur(20px)",
            paddingTop: "max(0px, env(safe-area-inset-top))",
            paddingBottom: "max(0px, env(safe-area-inset-bottom))",
          }}
        >
          <div className="flex h-16 items-center justify-between px-6">
            <LogoOrbit size={40} ink="var(--ink)" />
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center"
              style={{
                border: "1px solid var(--line-2)",
                borderRadius: 99,
                color: "var(--ink)",
                background: "transparent",
              }}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-8">
            {nav.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="display-md font-display no-underline"
                style={{ color: "var(--ink)" }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://viveka.sohamkakra.com"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 mono-label"
              style={{
                padding: "12px 18px",
                background: "var(--accent)",
                color: "var(--bg)",
                borderRadius: 4,
              }}
              onClick={() => setMobileOpen(false)}
            >
              <span>Viveka</span>
              <ArrowUpRight size={14} />
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
