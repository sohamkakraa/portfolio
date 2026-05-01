"use client";

import { useEffect, useState } from "react";

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

export default function LoadingScreen({ visible, onComplete }: Props) {
  const [opacity, setOpacity] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!visible) {
      setOpacity(0);
      const t = setTimeout(() => onComplete?.(), 600);
      return () => clearTimeout(t);
    } else {
      setOpacity(1);
    }
  }, [visible, onComplete]);

  if (!mounted) return null;

  return (
    <div
      role="status"
      aria-label="Loading"
      className="pointer-events-none fixed inset-0 z-[300] flex flex-col items-center justify-center bg-[#050505]"
      style={{
        opacity,
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <img
        src="/loading-animation.webp"
        alt=""
        aria-hidden="true"
        className="w-[min(600px,85vw)] h-auto select-none"
        style={{ imageRendering: "auto" }}
      />
      <p className="mt-6 animate-pulse text-[10px] font-semibold uppercase tracking-[0.4em] text-white/30">
        Loading
      </p>
    </div>
  );
}
