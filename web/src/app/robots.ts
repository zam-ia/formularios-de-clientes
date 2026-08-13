import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/publicSiteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = PUBLIC_SITE_URL;
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/panel", "/api"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
