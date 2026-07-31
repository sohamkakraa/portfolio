import type { Metadata } from "next";
import PhotographyGlobe from "@/components/PhotographyGlobe";
import { getPortfolioData } from "@/lib/portfolio-server";

export const metadata: Metadata = {
  title: "Photography",
  description:
    "Frames from six places, plotted where they were made. Landscape, wildlife, cityscapes, night skies and star trails.",
};

/**
 * No heading of its own: the globe brings one, and a page title above it made two headings saying
 * the same thing in a row.
 */
export default async function PhotographyPage() {
  const data = await getPortfolioData();
  return <PhotographyGlobe section={data.photography} />;
}
