"use client";

import { useId } from "react";

type Props = {
  size?: number;
  ink?: string;
  animated?: boolean;
  className?: string;
};

// Faithful port of logos.jsx → LogoOrbit (40x40 viewBox, italic s+k anchor,
// outer tilted orbit + inner counter-tilted orbit, animated moon + particle).
export default function LogoOrbit({
  size = 44,
  ink = "currentColor",
  animated = true,
  className,
}: Props) {
  const gid = useId().replace(/[^a-z0-9]/gi, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-label="Soham Kakra mark"
      className={className}
    >
      <defs>
        <radialGradient id={`og-${gid}`} cx="50%" cy="50%">
          <stop offset="0%" stopColor={ink} stopOpacity="0.12" />
          <stop offset="70%" stopColor={ink} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* gravitational halo */}
      <circle cx="20" cy="20" r="18" fill={`url(#og-${gid})`} />

      {/* outer tilted orbit */}
      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="7"
        stroke={ink}
        strokeOpacity="0.28"
        strokeWidth="0.5"
        fill="none"
        transform="rotate(-22 20 20)"
      />
      {/* inner counter-tilted orbit */}
      <ellipse
        cx="20"
        cy="20"
        rx="11"
        ry="13"
        stroke={ink}
        strokeOpacity="0.18"
        strokeWidth="0.4"
        fill="none"
        transform="rotate(34 20 20)"
      />

      {/* central s — italic */}
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), Fraunces, serif"
        fontSize="22"
        fontWeight="400"
        fontStyle="italic"
        fill={ink}
        letterSpacing="-1"
      >
        s
      </text>
      {/* k — italic, sits beside s */}
      <text
        x="28"
        y="25"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), Fraunces, serif"
        fontSize="22"
        fontWeight="400"
        fontStyle="italic"
        fill={ink}
        letterSpacing="-1"
      >
        k
      </text>

      {/* outer moon — orbits along inner plane (counter-clockwise, period 5.5s) */}
      <g transform="rotate(34 20 20)">
        <g>
          <circle cx="20" cy="7" r="1.4" fill={ink} opacity="0.9" />
          {animated && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 20 20"
              to="-360 20 20"
              dur="5.5s"
              repeatCount="indefinite"
            />
          )}
        </g>
      </g>

      {/* tiny inner particle (clockwise, period 3s) */}
      <g>
        <circle cx="20" cy="13" r="0.7" fill={ink} opacity="0.7" />
        {animated && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 20 20"
            to="360 20 20"
            dur="3s"
            repeatCount="indefinite"
          />
        )}
      </g>
    </svg>
  );
}
