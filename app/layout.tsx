import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ThemeProvider from "@/components/ThemeProvider";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
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
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${fraunces.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
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
