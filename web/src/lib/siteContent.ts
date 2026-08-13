import { randomUUID } from "node:crypto";
import { z } from "zod";
import { BROCHURE_BUCKET, brochurePublicUrl, ensureBrochureBucket } from "@/lib/brochure";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const SITE_CONTENT_PATH = "content/site.json";
const serviceSchema = z.object({ id: z.string(), title: z.string().min(2).max(100), text: z.string().min(2).max(350) });
const mediaUrlSchema = z.string().refine((value) => value.startsWith("/") || /^https:\/\//.test(value), "Imagen inválida");
export const siteContentSchema = z.object({
  version: z.literal(1),
  whatsappNumber: z.string().regex(/^\d{8,15}$/),
  logoUrl: mediaUrlSchema,
  heroKicker: z.string().min(2).max(100),
  heroTitle: z.string().min(5).max(180),
  heroLead: z.string().min(10).max(500),
  heroImage: mediaUrlSchema,
  whyTitle: z.string().min(5).max(180),
  sectorsTitle: z.string().min(5).max(180),
  healthTitle: z.string().min(5).max(180),
  healthText: z.string().min(5).max(350),
  educationTitle: z.string().min(5).max(180),
  educationText: z.string().min(5).max(350),
  servicesTitle: z.string().min(5).max(180),
  servicesLead: z.string().min(5).max(350),
  services: z.array(serviceSchema).length(6),
  resultsTitle: z.string().min(5).max(180),
  caseTitle: z.string().min(5).max(180),
  caseText: z.string().min(5).max(500),
  metricValue: z.string().min(1).max(20),
  metricLabel: z.string().min(2).max(100),
  aboutTitle: z.string().min(5).max(180),
  aboutText: z.string().min(5).max(700),
  aboutImage: mediaUrlSchema,
  finalKicker: z.string().min(5).max(180),
  finalTitle: z.string().min(5).max(180),
  finalImage: mediaUrlSchema,
  updatedAt: z.string().datetime(),
});
export type SiteContent = z.infer<typeof siteContentSchema>;

export const defaultSiteContent: SiteContent = {
  version: 1,
  whatsappNumber: "51987088359",
  logoUrl: "/brand/crisdal-agency-logo.png",
  heroKicker: "Marketing, automatización y sistemas",
  heroTitle: "QUE NINGÚN\nPACIENTE O ALUMNO\nSE QUEDE ESPERANDO.",
  heroLead: "Conectamos estrategia, contenido y automatización con IA para que tu negocio responda mejor, venda con orden y pueda crecer sin saturar a tu equipo.",
  heroImage: "/avatar-crisdal-cutout-v2.png",
  whyTitle: "No hacemos marketing aislado. Construimos un sistema que responde.",
  sectorsTitle: "Tu cliente necesita sentir que lo entiendes antes de escribirte.",
  healthTitle: "¿Cuántos pacientes se van porque nadie respondió a tiempo?",
  healthText: "Automatizamos consultas, citas y seguimiento sin perder el trato humano.",
  educationTitle: "¿Tu equipo de informes se satura durante la matrícula?",
  educationText: "Ordenamos consultas, registros y seguimiento para que cada interesado avance.",
  servicesTitle: "Todo lo que tu marca necesita. En el orden correcto.",
  servicesLead: "No coordinas cinco proveedores. Diseñamos una ruta y conectamos las piezas.",
  services: [
    { id: "automation", title: "Automatización IA & WhatsApp", text: "Respuestas, seguimiento y derivación sin dejar conversaciones esperando." },
    { id: "content", title: "Redes & contenido", text: "Estrategia y piezas que sostienen una conversación real con tu mercado." },
    { id: "video", title: "Producción audiovisual", text: "Foto y video propio, producido en tu espacio y pensado para vender." },
    { id: "web", title: "Diseño web", text: "Sitios rápidos y claros que convierten visitas en oportunidades." },
    { id: "software", title: "Apps & software", text: "Herramientas a medida para ordenar operaciones y atención." },
    { id: "branding", title: "Branding", text: "Una identidad reconocible, coherente y lista para crecer." },
  ],
  resultsTitle: "No mostramos piezas sueltas. Mostramos lo que cambió.",
  caseTitle: "De conversaciones dispersas a un seguimiento visible.",
  caseText: "Los próximos casos mostrarán el problema, la solución implementada y la métrica alcanzada con autorización del cliente.",
  metricValue: "0",
  metricLabel: "mensajes importantes olvidados",
  aboutTitle: "Creatividad con estructura. Tecnología con propósito.",
  aboutText: "Somos un equipo de Huancayo que conecta comunicación, producción audiovisual y desarrollo para transformar ideas en resultados sostenibles.",
  aboutImage: "/brand/crisdal-agency-logo.png",
  finalKicker: "Tu próxima oportunidad ya puede estar escribiéndote",
  finalTitle: "Haz que encuentre una respuesta.",
  finalImage: "/avatar-crisdal-cutout-v2.png",
  updatedAt: new Date(0).toISOString(),
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    await ensureBrochureBucket();
    const { data, error } = await getSupabaseServer().storage.from(BROCHURE_BUCKET).download(SITE_CONTENT_PATH);
    if (error || !data) return defaultSiteContent;
    const parsed = siteContentSchema.safeParse({ ...defaultSiteContent, ...JSON.parse(await data.text()), version: 1 });
    return parsed.success ? parsed.data : defaultSiteContent;
  } catch { return defaultSiteContent; }
}
export async function saveSiteContent(input: unknown) {
  const content = siteContentSchema.parse({ ...(typeof input === "object" && input ? input : {}), version: 1, updatedAt: new Date().toISOString() });
  await ensureBrochureBucket();
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const { error } = await getSupabaseServer().storage.from(BROCHURE_BUCKET).upload(SITE_CONTENT_PATH, blob, { contentType: "application/json", cacheControl: "0", upsert: true });
  if (error) throw error;
  return content;
}
export function createSiteMediaPath(fileName: string) {
  const extension = fileName.toLowerCase().match(/\.(png|jpe?g|webp|avif)$/)?.[1] || "jpg";
  return `site/${Date.now()}-${randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
}
export { brochurePublicUrl as sitePublicUrl };
