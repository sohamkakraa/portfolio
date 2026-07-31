"use client";

import { useEffect, useRef, useState } from "react";
import type * as THREE_NS from "three";

export type Three = typeof THREE_NS;

export type SceneApi = {
  THREE: Three;
  renderer: THREE_NS.WebGLRenderer;
  width: number;
  height: number;
};

export type FrameContext = {
  /** 0–1 across the whole scrollable document. The single driver every scene reads. */
  progress: number;
  /** Seconds since the scene mounted. For ambient motion that must not depend on scroll. */
  elapsed: number;
  dt: number;
};

export type SceneHandle = {
  update: (ctx: FrameContext) => void;
  render: (ctx: FrameContext) => void;
  resize?: (width: number, height: number) => void;
  dispose?: () => void;
};

export function scrollProgress(): number {
  const doc = document.documentElement;
  const max = Math.max(1, doc.scrollHeight - window.innerHeight);
  return Math.min(1, Math.max(0, window.scrollY / max));
}

/** ACES filmic + sRGB, matching the look of the reference prototypes. */
export function applyFilmicRenderer(THREE: Three, renderer: THREE_NS.WebGLRenderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
}

export function disposeObject(root: THREE_NS.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE_NS.Mesh;
    mesh.geometry?.dispose?.();
    const mat = mesh.material as THREE_NS.Material | THREE_NS.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat?.dispose?.();
  });
}

type Options = {
  enabled: boolean;
  build: (api: SceneApi) => SceneHandle;
  /** Fired when sustained framerate is too low to justify the scene. */
  onDegrade?: () => void;
};

export function useJourneyScene({ enabled, build, onDegrade }: Options) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const buildRef = useRef(build);
  const degradeRef = useRef(onDegrade);
  useEffect(() => {
    buildRef.current = build;
    degradeRef.current = onDegrade;
  });

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let raf = 0;
    let disposed = false;
    let handle: SceneHandle | null = null;
    let renderer: THREE_NS.WebGLRenderer | null = null;
    let onResize: (() => void) | null = null;

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      applyFilmicRenderer(THREE, renderer);

      handle = buildRef.current({
        THREE,
        renderer,
        width: window.innerWidth,
        height: window.innerHeight,
      });

      onResize = () => {
        if (!renderer) return;
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        handle?.resize?.(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", onResize);

      // `?watchdog=off` keeps the scene alive on software renderers, for screenshots.
      const watchdogEnabled =
        new URLSearchParams(window.location.search).get("watchdog") !== "off";

      const start = performance.now();
      let last = start;
      let windowStart = start;
      let frames = 0;
      let slowWindows = 0;

      const loop = () => {
        raf = requestAnimationFrame(loop);
        const now = performance.now();
        const ctx: FrameContext = {
          progress: scrollProgress(),
          elapsed: (now - start) / 1000,
          dt: Math.min(0.1, (now - last) / 1000),
        };
        last = now;

        handle?.update(ctx);
        handle?.render(ctx);

        frames += 1;
        if (!watchdogEnabled) return;
        if (now - windowStart >= 2000) {
          const fps = (frames * 1000) / (now - windowStart);
          frames = 0;
          windowStart = now;
          // Two consecutive bad windows, not one, so a single GC pause cannot demote a good machine.
          slowWindows = fps < 28 ? slowWindows + 1 : 0;
          if (slowWindows >= 2) degradeRef.current?.();
        }
      };

      raf = requestAnimationFrame(loop);
      setReady(true);
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      if (onResize) window.removeEventListener("resize", onResize);
      handle?.dispose?.();
      renderer?.dispose();
      setReady(false);
    };
  }, [enabled]);

  return { canvasRef, ready };
}

/** Smoothstep between two edges — used everywhere to fade weather and light in and out. */
export function smoothstep(x: number, edge0: number, edge1: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Interpolate a keyframed colour ramp against progress. */
export function rampColor(
  THREE: Three,
  stops: { t: number; color: THREE_NS.Color }[],
  progress: number,
  out: THREE_NS.Color
) {
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (progress >= stops[i].t && progress <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const local = THREE.MathUtils.clamp((progress - a.t) / span, 0, 1);
  out.copy(a.color).lerp(b.color, local);
  return out;
}

/**
 * Interpolate a keyframed scalar ramp against progress.
 *
 * Non-monotonic curves are the point: a day that darkens and lightens again cannot be
 * expressed as a smoothstep, and driving light, fog and particles off one shared ramp
 * keeps them from disagreeing about what time it is.
 */
export function rampValue(stops: { t: number; v: number }[], progress: number): number {
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i += 1) {
    if (progress >= stops[i].t && progress <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const span = b.t - a.t || 1;
  const local = Math.min(1, Math.max(0, (progress - a.t) / span));
  return a.v + (b.v - a.v) * local;
}
