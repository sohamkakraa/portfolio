import type { Metadata } from "next";
import { Sora, Space_Mono } from "next/font/google";
import "./globals.css";
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
    default: "Soham Kakra",
    template: "%s · Soham Kakra",
  },
  description: "A minimal, cinematic portfolio of product work and photography.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Soham Kakra",
    description: "A minimal, cinematic portfolio of product work and photography.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Soham Kakra",
    description: "A minimal, cinematic portfolio of product work and photography.",
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
        className={`${sora.variable} ${spaceMono.variable} antialiased`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
