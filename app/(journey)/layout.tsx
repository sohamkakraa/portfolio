import "./journey.css";

/**
 * The journey surfaces: the road itself at /, the walkthroughs under /journeys, and the work
 * surface that the road's panels hand off to.
 *
 * They share a stylesheet and nothing else. No nav bar and no grain overlay, because these pages
 * are a scene with instruments laid over it rather than a document — the film grain belongs to the
 * scene and is drawn inside it, at a strength each chapter chooses.
 */
export default function JourneyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
