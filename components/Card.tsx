import Link from "next/link";
import GlassSurface from "@/components/GlassSurface";

export default function Card({
  title,
  description,
  meta,
  href,
  cta = "Open",
}: {
  title: string;
  description: string;
  meta?: string;
  href: string;
  cta?: string;
}) {
  return (
    <Link href={href} className="group block rounded-2xl no-underline">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={24}
        borderWidth={0.08}
        brightness={60}
        opacity={0.9}
        blur={12}
        backgroundOpacity={0.06}
        saturation={1.1}
        distortionScale={-160}
        mixBlendMode="soft-light"
        className="w-full"
        contentClassName="w-full p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-medium text-[color:var(--foreground)]">
              {title}
            </h3>
            {meta ? (
              <p className="mt-1 text-xs text-[color:var(--muted)]">{meta}</p>
            ) : null}
          </div>

          <span className="shrink-0 rounded-full border border-[color:var(--accent)] px-3 py-1 text-xs text-[color:var(--accent)] transition group-hover:border-[color:var(--foreground)] group-hover:text-[color:var(--foreground)]">
            {cta}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[color:var(--muted)]">
          {description}
        </p>
      </GlassSurface>
    </Link>
  );
}
