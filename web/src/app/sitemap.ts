import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/publicSiteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = PUBLIC_SITE_URL;
  const cases = ["personal-training", "corporacion-henko", "change-the-slim-studio", "colegio-san-juan"];
  const industries = ["fitness-bienestar", "educacion", "inmobiliaria", "salud-estetica"];
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/brochure`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/formulario`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/aliados`, changeFrequency: "monthly", priority: 0.5 },
    ...cases.map((slug) => ({ url: `${base}/casos/${slug}`, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...industries.map((slug) => ({ url: `${base}/industrias/${slug}`, changeFrequency: "monthly" as const, priority: 0.65 })),
  ];
}
