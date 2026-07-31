import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Two years, subdomains included, and preload-eligible. Without this a first visit over
  // plaintext http can be intercepted before the redirect to https ever happens.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // unsafe-eval is React Refresh in dev only, so production does not carry it. unsafe-inline
      // stays for now because App Router emits inline hydration scripts; removing it needs a
      // nonce threaded through middleware, which is a change worth making on its own.
      `script-src 'self' ${isDev ? "'unsafe-eval' " : ""}'unsafe-inline' https://va.vercel-scripts.com`,
      "style-src 'self' 'unsafe-inline'",
      // data: for SVG grain overlay; blob: for image previews; book covers proxied via /api/book-cover
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://photography.sohamkakra.com",
      "connect-src 'self' https://va.vercel-scripts.com vitals.vercel-insights.com",
      "font-src 'self'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      // Falls back to default-src, but stating it means a future default-src loosening cannot
      // silently re-enable plugin content.
      "object-src 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
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
      {
        protocol: "https",
        hostname: "photography.sohamkakra.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
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
