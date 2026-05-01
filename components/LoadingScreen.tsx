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
      img.src = `/loading-frames/${String(i + 1).padStart(2, "0")}.webp`;
      return img;
    });
  }, [mounted]);

  // rAF draw loop — draws onto a canvas that is CSS-sized to 100vw × 100vh
  useEffect(() => {
    if (!mounted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = (ts: number) => {
      rafRef.current = requestAnimationFrame(draw);
      if (ts - lastTsRef.current < FRAME_MS) return;
      lastTsRef.current = ts;

      const img = framesRef.current[frameIdxRef.current];
      if (img?.complete && img.naturalWidth > 0) {
        // Cover: scale image to fill canvas, cropping edges as needed
        const cw = canvas.clientWidth;
        const ch = canvas.clientHeight;
        const iw = img.naturalWidth;   // 960
        const ih = img.naturalHeight;  // 540
        const scale = Math.max(cw / iw, ch / ih);
        const dw = iw * scale;
        const dh = ih * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

        canvas.width = cw;
        canvas.height = ch;
        ctx.drawImage(img, dx, dy, dw, dh);
      }
      frameIdxRef.current = (frameIdxRef.current + 1) % FRAME_COUNT;
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
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
      />
    </div>
  );
}
