import type { MetadataRoute } from "next";

const baseUrl = "https://sohamkakra.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/blog/day-1`, lastModified: new Date("2026-09-13T12:00:00+02:00"), changeFrequency: "yearly", priority: 0.9 },
    { url: `${baseUrl}/work`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/projects`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/photography`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/journeys`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/journeys/climb`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
