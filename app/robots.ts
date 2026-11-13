import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // App surfaces need a connected wallet or account data — keep crawlers
      // on the marketing and public flows only.
      disallow: ["/api/", "/dashboard", "/positions", "/vault/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://floorline.near.app"}/sitemap.xml`,
  };
}
