import type { MetadataRoute } from "next";
import { PUBLIC_SITE_URL } from "@/lib/publicSiteUrl";
import { getWebCatalog } from "@/lib/webCatalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = PUBLIC_SITE_URL;
  const catalog = await getWebCatalog();
  const cases = catalog.projects.filter((item) => item.visible).map((item) => item.slug);
  const industries = ["fitness-bienestar", "educacion", "inmobiliaria", "salud-estetica"];
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/brochure`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/servicios`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/portafolio`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/metodo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/nosotros`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contacto`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/servicios/kits-combinados`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/formulario`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/aliados`, changeFrequency: "monthly", priority: 0.5 },
    ...catalog.services.filter((item) => item.visible).map((service) => ({ url: `${base}/servicios/${service.slug}`, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...cases.map((slug) => ({ url: `${base}/casos/${slug}`, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...industries.map((slug) => ({ url: `${base}/industrias/${slug}`, changeFrequency: "monthly" as const, priority: 0.65 })),
  ];
}
