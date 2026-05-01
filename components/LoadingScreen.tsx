"use client";

import { useEffect, useRef, useState } from "react";

const FRAME_COUNT = 60;
const FPS = 24;
const FRAME_MS = 1000 / FPS;

type Props = {
  visible: boolean;
  onComplete?: () => void;
};

export default function LoadingScreen({ visible, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const rafRef = useRef<number>(0);
  const frameIdxRef = useRef(0);
  const lastTsRef = useRef(0);
  const [hiding, setHiding] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Preload all 60 frames
  useEffect(() => {
    if (!mounted) return;
    framesRef.current = Array.from({ length: FRAME_COUNT }, (_, i) => {
      const img = new Image();
      img.src = `/loading-frames/${String(i + 1).padStart(2, "0")}.jpg`;
      return img;
    });
  }, [mounted]);

  // Resize canvas to physical pixels (respects devicePixelRatio for Retina sharpness).
  // This runs once on mount and on window resize — never inside the draw loop.
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mounted]);

  // rAF draw loop — uses canvas.width/height (physical pixels) for crisp output
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let lastDrawnFrame = -1;

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (ts - lastTsRef.current < FRAME_MS) return;
      lastTsRef.current = ts;

      const idx = frameIdxRef.current;
      const img = framesRef.current[idx];

      if (img?.complete && img.naturalWidth > 0) {
        // object-cover in physical pixels
        const cw = canvas.width;
        const ch = canvas.height;
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        lastDrawnFrame = idx;
      }
      // Advance even if frame wasn't ready — it'll catch up next tick
      frameIdxRef.current = (idx + 1) % FRAME_COUNT;
      void lastDrawnFrame; // suppress lint
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [mounted]);

  // Fade-out on hide
  useEffect(() => {
    if (!visible) {
      setHiding(true);
      const t = setTimeout(() => onComplete?.(), 700);
      return () => clearTimeout(t);
    } else {
      setHiding(false);
    }
  }, [visible, onComplete]);

  if (!mounted) return null;

  return (
    <div
      aria-label="Loading"
      role="status"
      className="pointer-events-none fixed inset-0 z-[300]"
      style={{
        opacity: hiding ? 0 : 1,
        transition: "opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <canvas ref={canvasRef} className="block" />
    </div>
  );
}
