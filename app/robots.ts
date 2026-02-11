import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/owner", "/employee"],
      disallow: ["/backend-test", "/api"],
    },
    sitemap: "https://www.prozync.in/sitemap.xml",
  }
}
