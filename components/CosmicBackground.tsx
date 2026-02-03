"use client";

import Galaxy from "@/components/Galaxy";

export default function CosmicBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={0.8}
          glowIntensity={0.2}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={1}
          autoCenterRepulsion={0}
          starSpeed={1}
          speed={1.4}
        />
      </div>

    </div>
  );
}
