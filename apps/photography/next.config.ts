import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "photography.sohamkakra.com",
      },
      {
        // Allow any R2 custom domain
        protocol: "https",
        hostname: "**.sohamkakra.com",
      },
    ],
  },
};

export default nextConfig;
