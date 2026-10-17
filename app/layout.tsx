import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Doto, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import Measure from "@/components/analytics/Measure";
import OfflineCache from "@/components/OfflineCache";

/** Headings and interface. The optical-size axis keeps it playful large and plain small. */
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

/** Long reading: the logbook entries and stories. */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

/** Dot-matrix figures: dates, altitudes, depths, camera settings. Never for running text. */
const doto = Doto({
  variable: "--font-doto",
  subsets: ["latin"],
  weight: ["600", "800", "900"],
  display: "swap",
});

/** Kept for the admin, where values and code need a real monospace. */
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const DESCRIPTION =
  "Soham Kakra: AI engineer, traveller and photographer. Basecamp for the logbook of trips, the bucket list, and the questions I'm still figuring out.";

export const metadata: Metadata = {
  title: {
    default: "Soham Kakra",
    template: "%s · Soham Kakra",
  },
  description: DESCRIPTION,
  metadataBase: new URL("https://sohamkakra.com"),
  openGraph: {
    title: "Soham Kakra",
    description: DESCRIPTION,
    type: "website",
    url: "https://sohamkakra.com",
    siteName: "Soham Kakra",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soham Kakra",
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f1a2b" },
    { media: "(prefers-color-scheme: light)", color: "#eef0ec" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bricolage.variable} ${sourceSerif.variable} ${doto.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        <ThemeProvider>{children}</ThemeProvider>
        <Measure />
        <OfflineCache />
      </body>
    </html>
  );
}
