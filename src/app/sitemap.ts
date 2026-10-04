import type { MetadataRoute } from "next";
import { projects } from "@/components/projects";
import { absolute } from "@/components/site";

// Home, About, the Figma practice, the inspirations, and a page for every case study (from projects.ts, so new ones join
// automatically). Dated to each build.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: absolute("/"), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: absolute("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: absolute("/practice"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absolute("/inspirations"), lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...projects.map((project) => ({
      url: absolute(`/work/${project.id}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: project.context === "Spotmies" ? 0.7 : 0.6,
    })),
  ];
}
