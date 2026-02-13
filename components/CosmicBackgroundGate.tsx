"use client";

import { usePathname } from "next/navigation";
import CosmicBackground from "@/components/CosmicBackground";

export default function CosmicBackgroundGate() {
  const pathname = usePathname();
  const showCosmic = pathname?.startsWith("/photography/astrophotography");

  if (!showCosmic) {
    return null;
  }

  return <CosmicBackground />;
}
