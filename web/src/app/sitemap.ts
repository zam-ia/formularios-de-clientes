import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://crisdalagency.vercel.app";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/brochure`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/formulario`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/aliados`, changeFrequency: "monthly", priority: 0.5 },
  ];
}
