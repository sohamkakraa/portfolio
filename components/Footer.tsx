import Link from "next/link";
import GlassSurface from "@/components/GlassSurface";

export default function Footer() {
  return (
    <footer className="mt-20">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={0}
        borderWidth={0.04}
        brightness={55}
        opacity={0.9}
        blur={14}
        backgroundOpacity={0.08}
        saturation={1.1}
        distortionScale={-140}
        mixBlendMode="soft-light"
        className="w-full"
        contentClassName="mx-auto max-w-5xl px-6 py-10"
      >
        <div className="flex items-center gap-4 text-sm font-medium text-[color:var(--foreground)]">
          <span
            aria-hidden="true"
            className="h-10 w-10 text-[color:var(--foreground)]"
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
          Soham Kakra
        </div>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[color:var(--muted)]">
          I don’t have everything figured out. This site is a snapshot—notes,
          work, and small honest moments.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <Link
              className="text-[color:var(--accent)] hover:text-[color:var(--foreground)]"
              href="/about"
            >
              About
            </Link>
            <a
              className="text-[color:var(--accent)] hover:text-[color:var(--foreground)]"
              href="mailto:you@example.com"
            >
              Contact
            </a>
          </div>

          <div className="flex items-center gap-3 text-[color:var(--accent)]">
            <a
              href="https://www.linkedin.com/in/yourname"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
              className="transition hover:text-[color:var(--foreground)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M6.94 8.5H4V20h2.94V8.5ZM5.47 7.1a1.7 1.7 0 1 0 0-3.4 1.7 1.7 0 0 0 0 3.4ZM20 20h-2.94v-5.76c0-1.44-.03-3.3-2.01-3.3-2.02 0-2.33 1.58-2.33 3.2V20H9.78V8.5h2.82v1.58h.04c.39-.75 1.36-1.54 2.8-1.54 3 0 3.56 1.98 3.56 4.56V20Z" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/yourname"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="transition hover:text-[color:var(--foreground)]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm10 2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Zm-5 3.5A4.5 4.5 0 1 1 7.5 13 4.51 4.51 0 0 1 12 8.5Zm0 2A2.5 2.5 0 1 0 14.5 13 2.5 2.5 0 0 0 12 10.5ZM17.5 7.25a1.25 1.25 0 1 1-1.25 1.25 1.25 1.25 0 0 1 1.25-1.25Z" />
              </svg>
            </a>
            <a
              href="mailto:you@example.com"
              aria-label="Email"
              className="transition hover:text-[color:var(--foreground)]"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
              >
                <path d="M4 6h16v12H4z" />
                <path d="m4 7 8 6 8-6" />
              </svg>
            </a>
          </div>
        </div>

        <p className="mt-8 text-xs text-[color:var(--muted)]">
          © {new Date().getFullYear()} Soham Kakra
        </p>
      </GlassSurface>
    </footer>
  );
}
