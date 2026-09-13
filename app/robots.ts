import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/lab/"],
    },
    sitemap: "https://sohamkakra.com/sitemap.xml",
    host: "https://sohamkakra.com",
  };
}
