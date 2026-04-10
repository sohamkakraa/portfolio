import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeProvider from "@/components/ThemeProvider";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Soham Kakra — AI Engineer & Visual Storyteller",
    template: "%s · Soham Kakra",
  },
  description:
    "Portfolio of Soham Kakra — AI/ML engineer, full-stack builder, and photographer crafting data products that feel human.",
  metadataBase: new URL("https://sohamkakra.com"),
  openGraph: {
    title: "Soham Kakra — AI Engineer & Visual Storyteller",
    description:
      "AI/ML engineer, full-stack builder, and photographer crafting data products that feel human.",
    type: "website",
    url: "https://sohamkakra.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soham Kakra",
    description:
      "AI/ML engineer, full-stack builder, and photographer crafting data products that feel human.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        suppressHydrationWarning
        className={`${sora.variable} ${spaceMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div className="grain" aria-hidden="true" />
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
