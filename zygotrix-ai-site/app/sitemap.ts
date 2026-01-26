import { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://zygotrix.ai";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    // Since this is a single page site, we focus on the main entry point.
    // However, if we had other routes (like /blog, /about as separate pages), we would add them here.
    // For a single page app with sections, search engines primarily care about the URL itself.
  ];
}
