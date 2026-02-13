"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/portfolio-types";
import ThemeToggle from "@/components/ThemeToggle";

type NavProps = {
  name: string;
  nav: NavItem[];
};

export default function Nav({ name, nav }: NavProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-6 py-4">
        <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--foreground)] no-underline"
        >
          {name}
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="text-xs uppercase tracking-[0.24em] text-[color:var(--muted)] no-underline transition hover:text-[color:var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center">
          <ThemeToggle />
        </div>
        </div>

        <nav className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1 md:hidden">
          {nav.map((item) => (
            <Link
              key={`mobile-${item.href}-${item.label}`}
              href={item.href}
              className="shrink-0 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
