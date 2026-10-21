"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { getConsent, serverConsent, subscribeConsent } from "@/lib/analytics/consent";
import { start, stop, view, vital } from "@/lib/analytics/client";
import { gaStart, gaStop, gaView } from "@/lib/analytics/ga";
import ConsentNote from "./ConsentNote";

/**
 * Mounted once in the root layout. Owns the collector's lifecycle: nothing runs until consent is
 * granted, and revoking it tears the collector down in place rather than waiting for a reload.
 */
export default function Measure() {
  const consent = useSyncExternalStore(subscribeConsent, getConsent, serverConsent);
  const pathname = usePathname();

  /**
   * The admin surfaces are not measured. Two reasons, both found the hard way: my own editing
   * sessions would sit in the funnel as if they were visitors, and the consent note is fixed to the
   * bottom-left corner, where it covered the replay controls.
   */
  const measurable = !pathname.startsWith("/admin");
  const live = consent === "granted" && measurable;

  // Keyed on consent and surface, not on the path, because ending the session on every navigation
  // would destroy the thing most worth measuring.
  useEffect(() => {
    if (!live) {
      stop(false);
      return;
    }
    start();
    return () => stop(getConsent() === "granted");
  }, [live]);

  // Runs after the effect above on mount, so the first view lands on a live collector.
  useEffect(() => {
    if (live) view(pathname);
  }, [live, pathname]);

  // Google Analytics follows the same switch: loaded on consent, stopped and cleaned up on withdrawal.
  useEffect(() => {
    if (!live) {
      gaStop();
      return;
    }
    gaStart();
    return () => gaStop();
  }, [live]);

  useEffect(() => {
    if (live) gaView(pathname);
  }, [live, pathname]);

  useReportWebVitals((metric) => {
    if (live) vital(metric.name, metric.value);
  });

  return measurable ? <ConsentNote state={consent} /> : null;
}
