import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
