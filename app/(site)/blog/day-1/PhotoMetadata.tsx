"use client";

import { Aperture, Camera, CircleGauge, Clock3, Focus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type CameraSettings = {
  aperture: string;
  shutter: string;
  iso: string;
  focalLength: string;
};

export default function PhotoMetadata({ settings }: { settings: CameraSettings }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previewedRef = useRef(false);
  const [previewing, setPreviewing] = useState(false);
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");
    if (!container || !coarsePointer.matches) return;

    let timeout = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || previewedRef.current) return;
        previewedRef.current = true;
        setPreviewing(true);
        timeout = window.setTimeout(() => setPreviewing(false), 1900);
      },
      { threshold: 0.58 }
    );

    observer.observe(container);
    return () => {
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className={`day-camera-settings${previewing ? " is-previewing" : ""}${pinned ? " is-pinned" : ""}`}>
      <button type="button" aria-label={`${pinned ? "Hide" : "Show"} camera settings`} aria-expanded={pinned} onClick={() => setPinned((value) => !value)}>
        <Camera className="day-camera-trigger" aria-hidden />
        <span title="Aperture"><Aperture aria-hidden /><small>Aperture</small><strong>{settings.aperture}</strong></span>
        <span title="Shutter speed"><Clock3 aria-hidden /><small>Shutter</small><strong>{settings.shutter}</strong></span>
        <span title="ISO"><CircleGauge aria-hidden /><small>ISO</small><strong>{settings.iso}</strong></span>
        <span title="Focal length"><Focus aria-hidden /><small>Focal length</small><strong>{settings.focalLength}</strong></span>
      </button>
    </div>
  );
}
