import type { MetadataRoute } from "next";
import { LOGBOOK } from "@/lib/basecamp/logbook";

const baseUrl = "https://sohamkakra.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/logbook`, changeFrequency: "weekly", priority: 0.9 },
    ...LOGBOOK.map((e) => ({
      url: `${baseUrl}/logbook/${e.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${baseUrl}/blog/day-1`, lastModified: new Date("2026-09-13T12:00:00+02:00"), changeFrequency: "yearly", priority: 0.8 },
    { url: `${baseUrl}/lists`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/places`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/photography`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/work`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/projects`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
