"use client";

import { useId } from "react";

type Props = {
  size?: number;
  ink?: string;
  animated?: boolean;
  className?: string;
};

/**
 * LogoOrbit — italic "sk" anchor centered, with a moon and a particle that
 * actually trace their elliptical orbit paths via SMIL <animateMotion>.
 *
 * Geometry (40x40 viewBox):
 *   - Plane A (outer): rx=17, ry=7,  rotated -22°
 *   - Plane B (inner): rx=11, ry=13, rotated  34°
 *   - sk pair sits centered around (20,20): s at x=16, k at x=24.
 */
export default function LogoOrbit({
  size = 44,
  ink = "currentColor",
  animated = true,
  className,
}: Props) {
  const gid = useId().replace(/[^a-z0-9]/gi, "");
  const planeAId = `oa-${gid}`;
  const planeBId = `ob-${gid}`;
  const haloId = `og-${gid}`;

  // Closed ellipse paths (unrotated; parent <g> applies rotation).
  // M (cx-rx) cy A rx ry 0 1 1 (cx+rx) cy A rx ry 0 1 1 (cx-rx) cy
  const planeAPath = "M 3 20 A 17 7 0 1 1 37 20 A 17 7 0 1 1 3 20";
  const planeBPath = "M 9 20 A 11 13 0 1 1 31 20 A 11 13 0 1 1 9 20";

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
        <radialGradient id={haloId} cx="50%" cy="50%">
          <stop offset="0%" stopColor={ink} stopOpacity="0.12" />
          <stop offset="70%" stopColor={ink} stopOpacity="0" />
        </radialGradient>
        {/* Motion paths — referenced by both visible orbit lines and animateMotion. */}
        <path id={planeAId} d={planeAPath} />
        <path id={planeBId} d={planeBPath} />
      </defs>

      {/* Halo */}
      <circle cx="20" cy="20" r="18" fill={`url(#${haloId})`} />

      {/* Visible orbit lines, each rotated about the canvas center. */}
      <g transform="rotate(-22 20 20)">
        <use
          href={`#${planeAId}`}
          stroke={ink}
          strokeOpacity="0.28"
          strokeWidth="0.5"
          fill="none"
        />
      </g>
      <g transform="rotate(34 20 20)">
        <use
          href={`#${planeBId}`}
          stroke={ink}
          strokeOpacity="0.18"
          strokeWidth="0.4"
          fill="none"
        />
      </g>

      {/* Centered "sk" anchor — both letters middle-anchored so the pair
          straddles canvas center (16 / 24 → midpoint 20). */}
      <text
        x="16"
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
      <text
        x="24"
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

      {/* Outer moon — follows Plane A path exactly. */}
      <g transform="rotate(-22 20 20)">
        <circle r="1.4" fill={ink} opacity="0.9">
          {animated && (
            <animateMotion dur="5.5s" repeatCount="indefinite" rotate="auto">
              <mpath href={`#${planeAId}`} />
            </animateMotion>
          )}
        </circle>
      </g>

      {/* Inner particle — follows Plane B path exactly, opposite direction. */}
      <g transform="rotate(34 20 20)">
        <circle r="0.7" fill={ink} opacity="0.7">
          {animated && (
            <animateMotion
              dur="3s"
              repeatCount="indefinite"
              rotate="auto"
              keyPoints="1;0"
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#${planeBId}`} />
            </animateMotion>
          )}
        </circle>
      </g>
    </svg>
  );
}
