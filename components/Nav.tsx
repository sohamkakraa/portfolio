"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StarTrailsMark from "@/components/StarTrailsMark";
import type { NavItem } from "@/lib/portfolio-types";

type NavProps = {
  name: string;
  nav?: NavItem[];
};

const ROUTES: { href: string; label: string }[] = [
  { href: "/logbook", label: "Logbook" },
  { href: "/lists", label: "Lists" },
  { href: "/places", label: "Places" },
  { href: "/photography", label: "Photos" },
  { href: "/work", label: "Work" },
];

export default function Nav({ name }: NavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="bc-nav">
      <div className="bc-nav-inner">
        <Link href="/" className="bc-wordmark" aria-label={`${name}, basecamp`}>
          <StarTrailsMark size={30} />
          <span>{name}</span>
        </Link>

        <nav className="bc-nav-links" aria-label="Main">
          {ROUTES.map((r) => (
            <Link key={r.href} href={r.href} aria-current={isActive(r.href) ? "page" : undefined}>
              {r.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="bc-nav-toggle"
          aria-expanded={open}
          aria-controls="bc-nav-drawer"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open ? (
        <nav id="bc-nav-drawer" className="bc-nav-drawer" aria-label="Main">
          <Link href="/" onClick={() => setOpen(false)}>Basecamp</Link>
          {ROUTES.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              aria-current={isActive(r.href) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
