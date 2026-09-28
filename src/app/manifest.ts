import type { MetadataRoute } from "next";
import { site } from "@/components/site";

// For "add to home screen": the name, the floppy disk icons, and the site's near-black.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.title,
    short_name: site.shortName,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
