import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://crisdalagency.vercel.app";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/panel", "/api"] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
