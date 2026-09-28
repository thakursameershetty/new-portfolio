import type { MetadataRoute } from "next";
import { site } from "@/components/site";

// Everything is open to crawlers; the sitemap lists every page.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
