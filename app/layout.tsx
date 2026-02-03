import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CosmicBackground from "@/components/CosmicBackground";
import ThemeProvider from "@/components/ThemeProvider";
import CursorTrail from "@/components/CursorTrail";
import FloatingLines from "@/components/FloatingLines";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Soham Kakra",
    template: "%s · Soham Kakra",
  },
  description: "Soham's portfolio of work, notes, and photography.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Soham Kakra",
    description: "Soham's portfolio of work, notes, and photography.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soham Kakra",
    description: "Soham's portfolio of work, notes, and photography.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <Nav />
          <FloatingLines />
          <CursorTrail />
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
