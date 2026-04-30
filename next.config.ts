import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js App Router requires unsafe-eval in dev; unsafe-inline for hydration scripts
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      // data: for SVG grain overlay; blob: for image previews; openlibrary for book covers
      "img-src 'self' data: blob: https://covers.openlibrary.org https://*.public.blob.vercel-storage.com https://photography.sohamkakra.com",
      "connect-src 'self'",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "photography.sohamkakra.com" }],
        destination: "https://sohamkakra.com/#photography",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Admin uploads can return Vercel Blob URLs; next/image rejects unknown hosts with 400.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
  // Allow large image uploads in API routes
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Exclude heavy static assets from serverless function bundles
  outputFileTracingExcludes: {
    "*": ["public/photography/**", "public/about/**", "public/books/**"],
  },
};

export default nextConfig;
