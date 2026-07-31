"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "full" | "lite";

type NavigatorWithHints = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

export type TierReport = {
  tier: DeviceTier;
  /** Why the gate landed where it did — surfaced in the lab UI so the trade-off is visible. */
  reasons: string[];
  /** True once measured on the client. Server render is always lite so there is no WebGL flash. */
  measured: boolean;
};

function probeWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ??
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");
    if (!gl) return false;
    // A software rasteriser will technically succeed but cannot hold 60fps.
    const debug = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
    if (debug) {
      const renderer = String(
        (gl as WebGLRenderingContext).getParameter(debug.UNMASKED_RENDERER_WEBGL)
      ).toLowerCase();
      if (renderer.includes("swiftshader") || renderer.includes("basic render")) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function measureTier(): TierReport {
  const reasons: string[] = [];
  const nav = navigator as NavigatorWithHints;

  const override = new URLSearchParams(window.location.search).get("mode");
  if (override === "lite" || override === "full") {
    return { tier: override, reasons: [`forced by ?mode=${override}`], measured: true };
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reasons.push("system asks for reduced motion");
  }
  if (!probeWebGL()) {
    reasons.push("no hardware WebGL");
  }
  if (nav.connection?.saveData) {
    reasons.push("data saver on");
  }
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) {
    reasons.push(`${nav.deviceMemory}GB RAM`);
  }
  if (typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency < 4) {
    reasons.push(`${nav.hardwareConcurrency} cores`);
  }
  if (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900) {
    reasons.push("small touch screen");
  }

  return {
    tier: reasons.length > 0 ? "lite" : "full",
    reasons: reasons.length > 0 ? reasons : ["hardware WebGL, desktop-class"],
    measured: true,
  };
}

/** The server can never know the answer, so it always renders the lite path. */
const SERVER_REPORT: TierReport = { tier: "lite", reasons: [], measured: false };

let cached: TierReport | null = null;

function subscribe(onChange: () => void) {
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = null;
    onChange();
  };
  motion.addEventListener("change", handler);
  return () => motion.removeEventListener("change", handler);
}

function getSnapshot(): TierReport {
  if (!cached) cached = measureTier();
  return cached;
}

/**
 * Read through useSyncExternalStore rather than measuring in an effect: it keeps the
 * server and hydration snapshots honest and avoids a state write on mount.
 */
export function useDeviceTier(): TierReport {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_REPORT);
}
