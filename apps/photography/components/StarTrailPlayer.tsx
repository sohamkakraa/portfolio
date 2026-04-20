"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import type { VideoSequence } from "@/lib/gallery-data";
import { CDN, frameUrl } from "@/lib/gallery-data";

type Props = {
  video: VideoSequence;
  /** If true, playback starts when element enters viewport */
  autoplay?: boolean;
  className?: string;
};

/**
 * Canvas-based frame-sequence player for star trail videos.
 *
 * Loads frames progressively (preloads a buffer window),
 * draws them to a <canvas> at the sequence's native FPS.
 * Much lighter than embedding a video — no decode overhead,
 * works on all browsers, scroll-friendly.
 */
export default function StarTrailPlayer({
  video,
  autoplay = true,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const framesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const rafRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const [currentFrame, setCurrentFrame] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);

  const BUFFER_AHEAD = 30; // preload this many frames ahead
  const frameInterval = 1000 / video.fps;

  // Preload a range of frames
  const preloadRange = useCallback(
    (start: number, end: number) => {
      const clamped = Math.min(end, video.frames);
      for (let i = start; i <= clamped; i++) {
        if (framesRef.current.has(i)) continue;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = frameUrl(video, i);
        img.onload = () => {
          framesRef.current.set(i, img);
          setLoaded((prev) => prev + 1);
        };
        framesRef.current.set(i, img); // placeholder to avoid double-load
      }
    },
    [video]
  );

  // Initial preload — first buffer
  useEffect(() => {
    preloadRange(1, BUFFER_AHEAD);
  }, [preloadRange]);

  // Mark ready when enough frames are loaded
  useEffect(() => {
    if (loaded >= Math.min(BUFFER_AHEAD, video.frames) && !ready) {
      setReady(true);
    }
  }, [loaded, video.frames, ready]);

  // Draw a frame to canvas
  const drawFrame = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      const img = framesRef.current.get(frameIndex);
      if (!canvas || !img || !img.complete || !img.naturalWidth) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions to match image (only once or on resize)
      if (canvas.width !== img.naturalWidth || canvas.height !== img.naturalHeight) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
      }

      ctx.drawImage(img, 0, 0);
    },
    []
  );

  // Draw first frame when ready
  useEffect(() => {
    if (ready) drawFrame(1);
  }, [ready, drawFrame]);

  // Animation loop
  useEffect(() => {
    if (!playing || !ready) return;

    let frame = currentFrame;

    const tick = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= frameInterval) {
        lastFrameTimeRef.current = timestamp;
        frame++;

        if (frame > video.frames) {
          // Loop or stop
          frame = 1;
          setPlaying(false);
          setCurrentFrame(1);
          drawFrame(1);
          return;
        }

        drawFrame(frame);
        setCurrentFrame(frame);

        // Progressive preload — load ahead as we play
        preloadRange(frame, frame + BUFFER_AHEAD);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, ready, currentFrame, video.frames, frameInterval, drawFrame, preloadRange]);

  // Autoplay on viewport entry
  useEffect(() => {
    if (!autoplay || !ready) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !playing) {
          setPlaying(true);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [autoplay, ready, playing]);

  const togglePlay = () => setPlaying(!playing);
  const reset = () => {
    setPlaying(false);
    setCurrentFrame(1);
    drawFrame(1);
  };

  const progress = video.frames > 0 ? ((currentFrame - 1) / (video.frames - 1)) * 100 : 0;
  const loadProgress = video.frames > 0 ? (loaded / video.frames) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`video-canvas-container group relative ${className}`}
    >
      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full" />

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-surface)]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--accent)]" />
          <p className="text-xs text-[var(--fg-muted)]">
            Loading frames... {Math.round(loadProgress)}%
          </p>
        </div>
      )}

      {/* Controls overlay — visible on hover */}
      {ready && (
        <div className="absolute inset-0 flex items-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex w-full items-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
            {/* Play/pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
            </button>

            {/* Progress bar */}
            <div className="relative flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={reset}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition hover:bg-white/20"
              aria-label="Reset"
            >
              <RotateCcw size={14} />
            </button>

            {/* Frame counter */}
            <span className="min-w-[4rem] text-right font-mono text-[10px] text-white/60">
              {currentFrame}/{video.frames}
            </span>
          </div>
        </div>
      )}

      {/* Title badge */}
      <div className="absolute left-4 top-4 rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
        {video.title}
      </div>
    </div>
  );
}
