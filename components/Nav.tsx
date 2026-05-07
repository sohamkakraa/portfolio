"use client";

import { useEffect, useState } from "react";
import type { NavItem } from "@/lib/portfolio-types";
import ThemeToggle from "@/components/ThemeToggle";
import LogoOrbit from "@/components/LogoOrbit";

type NavProps = {
  name: string;
  nav: NavItem[];
};

const SECTIONS: { id: string; label: string }[] = [
  { id: "top", label: "00" },
  { id: "about", label: "01 about" },
  { id: "projects", label: "02 work" },
  { id: "photography", label: "03 photo" },
  { id: "life", label: "04 life" },
  { id: "contact", label: "05 contact" },
];

export default function Nav({ name }: NavProps) {
  const [active, setActive] = useState("top");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        }),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    if (id === "top") return window.scrollTo({ top: 0, behavior: "smooth" });
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
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
        <button
          onClick={() => scrollTo("top")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: "inherit",
          }}
          aria-label="Home"
        >
          <LogoOrbit size={32} ink="var(--ink)" />
          <span
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--ink)",
              fontWeight: 600,
            }}
          >
            {name}
          </span>
        </button>
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexWrap: "wrap",
          }}
        >
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 99,
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: 10,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: active === s.id ? "var(--ink)" : "var(--ink-3)",
                background: active === s.id ? "var(--bg-3)" : "transparent",
                transition: "all 0.18s",
                border: "none",
                cursor: "pointer",
              }}
            >
              {s.label}
            </button>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
