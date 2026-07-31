import type { PortfolioData } from "@/lib/portfolio-types";

/**
 * Remove content marked `hidden` before it leaves the server.
 *
 * `hidden` used to be honoured only where the gallery rendered, in PhotographySection and
 * PhotographyGlobe — both client components. That meant hiding a photograph removed it from the
 * page while still shipping its title and its `src` in the server-rendered payload and in the
 * public GET /api/portfolio response. Anyone reading the response saw everything that had been
 * hidden, and the file itself was one request away. A visibility flag that only the renderer
 * respects is a label, not a control.
 *
 * Admins still get the unfiltered payload, or hidden items could never be found and unhidden.
 */
export function stripHiddenContent(data: PortfolioData): PortfolioData {
  const categories = (data.photography?.categories ?? [])
    .filter((category) => !category.hidden)
    .map((category) => ({
      ...category,
      images: (category.images ?? []).filter((image) => !image.hidden),
    }));

  return {
    ...data,
    photography: { ...data.photography, categories },
  };
}
