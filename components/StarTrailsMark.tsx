type Props = {
  size?: number;
  /** "full" for anything 40px and up; "small" drops the finest trails so the mark survives 16–32px. */
  detail?: "full" | "small";
  title?: string;
  className?: string;
};

/**
 * The mark: contour ridges below, star trails circling the pole star above.
 *
 * Drawn on a 120 grid. The ridges and trails take the current text colour, so the mark follows the
 * theme; only the pole star carries the accent.
 */
export default function StarTrailsMark({ size = 32, detail = "full", title, className }: Props) {
  const small = detail === "small";
  const stroke = small ? 6 : 2.6;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      className={className}
    >
      <g fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">
        {small ? (
          <>
            <path d="M39.6 46.6A22 22 0 0 1 80.4 29.4" />
            <path d="M8 100 L42 64 L58 80 L80 54 L112 100" />
          </>
        ) : (
          <>
            <path d="M50.5 43.5A11 11 0 0 1 69.5 32.5" />
            <path d="M41.3 34.7A19 19 0 0 1 78.7 34.7" />
            <path d="M78.4 42.9A19 19 0 0 1 69.5 54.5" />
            <path d="M33.9 45.0A27 27 0 0 1 73.5 14.6" />
            <path d="M80.7 20.6A27 27 0 0 1 86.1 45.0" />
            <path d="M8 98 L40 66 L56 80 L78 56 L112 98" />
            <path d="M30 98 L44 84 L56 92 L76 74 L94 98" />
          </>
        )}
      </g>
      <circle cx="60" cy="38" r={small ? 8 : 4.2} fill="var(--accent-fill, #f2c14e)" />
    </svg>
  );
}
