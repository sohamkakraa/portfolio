"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  size?: number;
  ink?: string;
  animated?: boolean;
  className?: string;
};

export default function LogoOrbit({
  size = 32,
  ink = "currentColor",
  animated = true,
  className,
}: Props) {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const enableAnim = animated && !reduced;

  // Comet trail — JS animates trailing arc opacity.
  const cometRef = useRef<SVGPathElement | null>(null);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-label="Soham Kakra mark"
      className={className}
    >
      <defs>
        <linearGradient id="orbit-comet" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
        </linearGradient>
        <radialGradient id="orbit-halo" cx="50%" cy="50%">
          <stop offset="0%" stopColor={ink} stopOpacity="0.06" />
          <stop offset="80%" stopColor={ink} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="32" r="28" fill="url(#orbit-halo)" />
      <circle
        cx="32"
        cy="32"
        r="26"
        stroke="var(--line)"
        strokeOpacity="0.35"
        strokeWidth="1"
        fill="none"
      />

      {/* Plane A */}
      <g transform="rotate(-18 32 32)">
        <ellipse
          cx="32"
          cy="32"
          rx="24"
          ry="10"
          stroke="var(--line-2)"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          fill="none"
        />
        <g>
          {enableAnim && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 32 32"
              to="-360 32 32"
              dur="7s"
              repeatCount="indefinite"
            />
          )}
          {/* moon body */}
          <circle cx="56" cy="32" r="2" fill="var(--accent)" />
          {/* trailing comet arc — 60deg trailing (clockwise, since moon goes ccw) */}
          <path
            ref={cometRef}
            d={trailArc(24, 10, 0, 60)}
            fill="none"
            stroke="url(#orbit-comet)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </g>
      </g>

      {/* Plane B */}
      <g transform="rotate(22 32 32)">
        <ellipse
          cx="32"
          cy="32"
          rx="22"
          ry="8"
          stroke="var(--line-2)"
          strokeWidth="0.8"
          strokeDasharray="2 4"
          fill="none"
        />
        <g>
          {enableAnim && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 32 32"
              to="360 32 32"
              dur="4.3s"
              repeatCount="indefinite"
            />
          )}
          <circle cx="54" cy="32" r="1.2" fill="var(--accent-2)" />
        </g>
      </g>

      {/* Central anchor: italic s + roman k */}
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontFamily="var(--font-fraunces), serif"
        fontSize="20"
        fontWeight="400"
        fontStyle="italic"
        fill={ink}
        letterSpacing="-0.04em"
      >
        <tspan>s</tspan>
        <tspan fontStyle="normal" dx="-2">k</tspan>
      </text>
    </svg>
  );
}

// Build an arc path on an ellipse (rx, ry) centered at (32,32), from angle a→b in degrees, counter-clockwise.
function trailArc(rx: number, ry: number, startDeg: number, endDeg: number): string {
  const cx = 32, cy = 32;
  const a0 = (startDeg * Math.PI) / 180;
  const a1 = (endDeg * Math.PI) / 180;
  const x0 = cx + rx * Math.cos(a0);
  const y0 = cy + ry * Math.sin(a0);
  const x1 = cx + rx * Math.cos(a1);
  const y1 = cy + ry * Math.sin(a1);
  // counter-clockwise sweep
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x0} ${y0} A ${rx} ${ry} 0 ${largeArc} 0 ${x1} ${y1}`;
}
