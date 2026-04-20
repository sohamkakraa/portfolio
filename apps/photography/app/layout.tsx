import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Photography — Soham Kakra",
    template: "%s — Soham Kakra Photography",
  },
  description:
    "A visual diary of landscapes, wildlife, cityscapes, star trails, and moments in between.",
  metadataBase: new URL("https://photography.sohamkakra.com"),
  openGraph: {
    title: "Photography — Soham Kakra",
    description: "Visual diary of landscapes, wildlife, astrophotography, and motion.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
