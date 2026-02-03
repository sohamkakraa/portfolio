"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import GlassSurface from "@/components/GlassSurface";
import TextType from "@/components/TextType";

const links = [
  {
    href: "/work",
    label: "Work",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path
          d="M3 7h18v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7Z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/photography",
    label: "Photography",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <path
          d="M4 8h4l2-2h4l2 2h4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="13" r="3.2" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/about",
    label: "About",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
        <circle cx="12" cy="8" r="3.2" strokeWidth="1.6" />
        <path d="M5 20a7 7 0 0 1 14 0" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50">
      <div className="mx-auto flex max-w-5xl justify-center px-6 pt-4">
        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={999}
          borderWidth={0.04}
          brightness={55}
          opacity={0.9}
          blur={14}
          backgroundOpacity={0.08}
          saturation={1.1}
          distortionScale={-140}
          mixBlendMode="soft-light"
          className="w-full"
          contentClassName="flex w-full items-center justify-between px-6 py-3"
        >
        <Link
          href="/"
          className="flex items-center gap-3 text-sm font-medium tracking-tight text-[color:var(--foreground)] no-underline"
        >
          <span
            aria-hidden="true"
            className="h-10 w-10 shrink-0 text-[color:var(--foreground)]"
            style={{
              WebkitMaskImage: "url('/logo.svg')",
              maskImage: "url('/logo.svg')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              backgroundColor: "currentColor",
            }}
          />
          <TextType
            as="span"
            className="inline-block"
            text="Soham Kakra"
            typingSpeed={60}
            deletingSpeed={40}
            pauseDuration={1200}
            loop={false}
            showCursor
            cursorBlinkDuration={0.6}
            cursorClassName="text-[color:var(--foreground)]"
          />
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              aria-label={l.label}
              className={`flex h-9 w-9 items-center justify-center rounded-md no-underline transition ${
                isActive(l.href)
                  ? "text-[color:var(--accent)]"
                  : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              }`}
            >
              {l.icon}
              <span className="sr-only">{l.label}</span>
            </Link>
          ))}
          <ThemeToggle />
        </div>
        </GlassSurface>
      </div>
    </header>
  );
}
