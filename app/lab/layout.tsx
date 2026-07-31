import type { Metadata } from "next";
import "../(journey)/journey.css";

/**
 * What is left of the prototype sandbox: the geocoding review tool at /lab/locations, which exists
 * to confirm where each photograph was taken before the coordinates are trusted anywhere public.
 *
 * An internal tool, so it stays out of the index. It borrows the journey stylesheet because it is
 * reviewing the journey's frames.
 */
export const metadata: Metadata = {
  title: "Location review",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
