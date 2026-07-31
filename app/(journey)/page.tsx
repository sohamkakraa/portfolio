import type { Metadata } from "next";
import RouteJourney from "./route-journey";

/**
 * The front door.
 *
 * A server component only so the page can carry its own metadata — the road itself needs the
 * browser for scroll position and WebGL, so everything below this line is a client component.
 */
export const metadata: Metadata = {
  title: "Soham Kakra",
  description:
    "Six places, walked west to east. Three I lived in and did not choose, three I went to and came back from — and nearly every photograph here was made on the second kind.",
  openGraph: {
    title: "Soham Kakra",
    description:
      "Six places, walked west to east. Three I lived in and did not choose, three I went to and came back from.",
    type: "website",
    url: "https://sohamkakra.com",
  },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <RouteJourney />;
}
