"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ExternalLink } from "lucide-react";
import type { NavItem } from "@/lib/portfolio-types";
import ThemeToggle from "@/components/ThemeToggle";

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
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? "nav-floating" : "bg-transparent"
        }`}
      >
        <div className="section-container">
          <div className="flex h-16 items-center justify-between md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="group relative text-sm font-bold tracking-[0.2em] uppercase text-[color:var(--fg)] no-underline"
            >
              <span className="relative z-10">{name}</span>
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-[color:var(--accent)] transition-all duration-300 group-hover:w-full" />
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="relative rounded-full px-4 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--fg-muted)] no-underline transition-colors hover:text-[color:var(--fg)]"
                >
                  {item.label}
                </Link>
              ))}

              {/* Viveka link */}
              <a
                href="https://viveka.sohamkakra.com"
                target="_blank"
                rel="noreferrer"
                className="btn-accent ml-2 !py-2 !px-4 !text-[10px]"
              >
                <span>Viveka</span>
                <ExternalLink size={12} />
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg)]"
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
        <div className="fixed inset-0 z-[100] flex flex-col bg-[color:var(--bg)]/95 pt-[max(0px,env(safe-area-inset-top))] pb-[max(0px,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
          <div className="flex h-16 items-center justify-end px-6">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border)] text-[color:var(--fg)]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-6">
            {nav.map((item, i) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="text-2xl font-semibold tracking-tight text-[color:var(--fg)] no-underline"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="https://viveka.sohamkakra.com"
              target="_blank"
              rel="noreferrer"
              className="btn-accent mt-4"
              onClick={() => setMobileOpen(false)}
            >
              <span>Viveka</span>
              <ExternalLink size={14} />
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
