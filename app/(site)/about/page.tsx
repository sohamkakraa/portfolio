import type { Metadata } from "next";
import AboutSection from "@/components/AboutSection";
import LifeSection from "@/components/LifeSection";
import { getPortfolioData } from "@/lib/portfolio-server";

export const metadata: Metadata = {
  title: "About",
  description: "The short version, the CV log, and what I have been reading.",
};

/**
 * An interim home.
 *
 * The road at / tells the story properly, which leaves this page holding the facts that do not fit
 * a scene — the CV log and the reading. Both belong on the worldview surface once that exists, and
 * this page is here so the content is reachable in the meantime rather than deleted for tidiness.
 */
export default async function AboutPage() {
  const data = await getPortfolioData();

  return (
    <>
      <AboutSection about={data.about} site={data.site} />
      <LifeSection life={data.life} />
    </>
  );
}
