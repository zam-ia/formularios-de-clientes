import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  BROCHURE_BUCKET,
  brochurePublicUrl,
  ensureBrochureBucket,
} from "@/lib/brochure";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const SITE_CONTENT_PATH = "content/site.json";

const serviceSchema = z.object({
  id: z.string(),
  title: z.string().min(2).max(100),
  text: z.string().min(2).max(350),
});

const mediaUrlSchema = z.string().refine(
  (value) => value.startsWith("/") || /^https:\/\//.test(value),
  "Recurso multimedia inválido",
);

const testimonialSchema = z.object({
  id: z.string().min(1).max(100),
  quote: z.string().min(10).max(700),
  name: z.string().min(2).max(100),
  role: z.string().max(120).default(""),
  company: z.string().max(120).default(""),
  visible: z.boolean().default(true),
});

export const siteContentSchema = z.object({
  version: z.literal(2),
  whatsappNumber: z.string().regex(/^\d{8,15}$/),
  logoUrl: mediaUrlSchema,
  heroKicker: z.string().min(2).max(100),
  heroTitle: z.string().min(5).max(180),
  heroLead: z.string().min(10).max(500),
  heroMediaKind: z.enum(["image", "video"]),
  heroMedia: mediaUrlSchema,
  heroPoster: mediaUrlSchema,
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
  caseCategory: z.string().min(2).max(80),
  caseTitle: z.string().min(5).max(180),
  caseChallenge: z.string().min(5).max(500),
  caseSolution: z.string().min(5).max(500),
  caseExecution: z.string().min(5).max(600),
  caseImage: mediaUrlSchema,
  casePoster: mediaUrlSchema,
  caseMediaKind: z.enum(["image", "video"]),
  metricValue: z.string().max(20),
  metricLabel: z.string().max(100),
  aboutTitle: z.string().min(5).max(180),
  aboutText: z.string().min(5).max(700),
  aboutImage: mediaUrlSchema,
  testimonials: z.array(testimonialSchema).max(12).default([]),
  finalKicker: z.string().min(5).max(180),
  finalTitle: z.string().min(5).max(180),
  finalMediaKind: z.enum(["image", "video"]),
  finalMedia: mediaUrlSchema,
  finalPoster: mediaUrlSchema,
  updatedAt: z.string().datetime(),
});

export type SiteContent = z.infer<typeof siteContentSchema>;
export type SiteTestimonial = z.infer<typeof testimonialSchema>;

export const defaultSiteContent: SiteContent = {
  version: 2,
  whatsappNumber: "51987088359",
  logoUrl: "/brand/crisdal-agency-logo.png",
  heroKicker: "Estrategia · Creatividad · Distribución · Conversión",
  heroTitle: "CONVERTIMOS ATENCIÓN\nEN OPORTUNIDADES\nREALES.",
  heroLead:
    "Crisdal conecta estrategia, creatividad, tecnología y seguimiento para que tu negocio responda mejor, convierta con claridad y crezca sin desorden.",
  heroMediaKind: "image",
  heroMedia: "/team/equipo-crisdal.webp",
  heroPoster: "/team/equipo-crisdal.webp",
  whyTitle: "Una sola ruta. Menos piezas aisladas. Más claridad para avanzar.",
  sectorsTitle: "Conocemos el contexto antes de diseñar la solución.",
  healthTitle: "Salud y estética",
  healthText:
    "Atención, contenido y seguimiento para transformar consultas en citas sin perder el trato humano.",
  educationTitle: "Educación",
  educationText:
    "Comunicación y automatización para ordenar informes, registros y matrículas en cada campaña.",
  servicesTitle: "Capacidades conectadas alrededor de un objetivo.",
  servicesLead:
    "No coordinas proveedores aislados. Diseñamos una ruta y activamos las capacidades que el problema necesita.",
  services: [
    {
      id: "strategy",
      title: "Estrategia",
      text: "Investigación, planificación, funnel y consultoría para decidir con claridad.",
    },
    {
      id: "performance",
      title: "Performance",
      text: "Meta Ads, campañas y optimización enfocadas en oportunidades medibles.",
    },
    {
      id: "creative",
      title: "Creatividad",
      text: "Identidad, diseño y contenido que convierten una promesa en una marca reconocible.",
    },
    {
      id: "audiovisual",
      title: "Audiovisual",
      text: "Fotografía, reels y campañas producidas con tu equipo y tu realidad.",
    },
    {
      id: "web",
      title: "Web & Conversión",
      text: "Experiencias rápidas y claras que convierten visitas en conversaciones.",
    },
    {
      id: "growth",
      title: "Growth",
      text: "Automatización, analítica y mejora continua para sostener el avance.",
    },
  ],
  resultsTitle: "El trabajo se entiende mejor cuando se ve el recorrido completo.",
  caseCategory: "Caso en preparación",
  caseTitle: "Del problema real a una solución que el equipo puede sostener.",
  caseChallenge:
    "Documentamos el punto de partida para entender dónde se enfrían las oportunidades o se pierde tiempo.",
  caseSolution:
    "Conectamos estrategia, contenido y sistemas en una ruta proporcional al negocio.",
  caseExecution:
    "Publicaremos aquí el proceso y los resultados únicamente cuando exista autorización del cliente.",
  caseImage: "/team/equipo-crisdal.webp",
  casePoster: "/team/equipo-crisdal.webp",
  caseMediaKind: "image",
  metricValue: "",
  metricLabel: "",
  aboutTitle: "Creatividad con estructura. Tecnología con propósito.",
  aboutText:
    "Somos un equipo de Huancayo que conecta estrategia, comunicación, producción audiovisual y desarrollo para transformar ideas en sistemas que generan resultados sostenibles.",
  aboutImage: "/team/equipo-crisdal.webp",
  testimonials: [],
  finalKicker: "Tu próxima oportunidad ya puede estar escribiéndote",
  finalTitle: "Cuéntanos qué necesita cambiar.",
  finalMediaKind: "image",
  finalMedia: "/team/abi.webp",
  finalPoster: "/team/abi.webp",
  updatedAt: new Date(0).toISOString(),
};

export async function getSiteContent(): Promise<SiteContent> {
  try {
    await ensureBrochureBucket();
    const { data, error } = await getSupabaseServer()
      .storage.from(BROCHURE_BUCKET)
      .download(SITE_CONTENT_PATH);
    if (error || !data) return defaultSiteContent;
    const raw = JSON.parse(await data.text()) as Record<string, unknown>;
    const legacyHero = String(raw.heroImage || defaultSiteContent.heroMedia);
    const legacyCaseText = String(raw.caseText || defaultSiteContent.caseChallenge);
    const legacyFinal = String(raw.finalImage || defaultSiteContent.finalMedia);
    const parsed = siteContentSchema.safeParse({
      ...defaultSiteContent,
      ...raw,
      version: 2,
      heroMedia: raw.heroMedia || legacyHero,
      heroPoster: raw.heroPoster || legacyHero,
      caseChallenge: raw.caseChallenge || legacyCaseText,
      caseSolution: raw.caseSolution || legacyCaseText,
      caseExecution: raw.caseExecution || legacyCaseText,
      casePoster: raw.casePoster || raw.caseImage || defaultSiteContent.casePoster,
      finalMedia: raw.finalMedia || legacyFinal,
      finalPoster: raw.finalPoster || legacyFinal,
      testimonials: raw.testimonials || [],
    });
    return parsed.success ? parsed.data : defaultSiteContent;
  } catch {
    return defaultSiteContent;
  }
}

export async function saveSiteContent(input: unknown) {
  const content = siteContentSchema.parse({
    ...(typeof input === "object" && input ? input : {}),
    version: 2,
    updatedAt: new Date().toISOString(),
  });
  await ensureBrochureBucket();
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const { error } = await getSupabaseServer()
    .storage.from(BROCHURE_BUCKET)
    .upload(SITE_CONTENT_PATH, blob, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });
  if (error) throw error;
  return content;
}

export function createSiteMediaPath(fileName: string) {
  const extension =
    fileName.toLowerCase().match(/\.(png|jpe?g|webp|avif|mp4|webm)$/)?.[1] ||
    "jpg";
  return `site/${Date.now()}-${randomUUID()}.${extension === "jpeg" ? "jpg" : extension}`;
}

export { brochurePublicUrl as sitePublicUrl };
