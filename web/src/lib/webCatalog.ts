import { z } from "zod";
import seed from "@/data/catalogSeed.json";
import {
  BROCHURE_BUCKET,
  ensureBrochureBucket,
} from "@/lib/brochure";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const WEB_CATALOG_PATH = "content/web-catalog.json";

const mediaUrl = z.string().max(1800).default("");
const workflowStatus = z.enum([
  "draft",
  "pending_approval",
  "approved",
  "published",
  "archived",
]);

const faqSchema = z.object({
  question: z.string().min(2).max(220),
  answer: z.string().min(2).max(900),
});

const planSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(2).max(120),
  price: z.number().int().min(0).max(10_000_000),
  headline: z.string().min(2).max(280),
  includes: z.string().min(2).max(1200),
  bonuses: z.array(z.string().min(2).max(600)).max(6).default([]),
  limit: z.string().max(800).default(""),
  approvalStatus: workflowStatus.default("draft"),
  publicationStatus: workflowStatus.default("draft"),
});

const webServiceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
  eyebrow: z.string().min(2).max(120),
  headline: z.string().min(5).max(300),
  sub: z.string().min(5).max(700),
  purpose: z.string().min(5).max(700),
  aim: z.string().min(2).max(120),
  recommended: z.string().max(120).default(""),
  visible: z.boolean().default(true),
  heroMedia: mediaUrl,
  heroAlt: z.string().max(220).default(""),
  cardMedia: mediaUrl,
  cardAlt: z.string().max(220).default(""),
  seoTitle: z.string().max(180).default(""),
  seoDescription: z.string().max(320).default(""),
  benefits: z.array(z.string().min(2).max(240)).min(1).max(6),
  faqs: z.array(faqSchema).max(8).default([]),
  plans: z.array(planSchema).max(8).default([]),
});

const projectSchema = z.object({
  id: z.string().min(1).max(100),
  slug: z.string().min(2).max(120),
  title: z.string().min(2).max(160),
  serviceIds: z.array(z.string().max(80)).max(8).default([]),
  industry: z.string().max(120).default(""),
  summary: z.string().min(5).max(900),
  heroMedia: mediaUrl,
  heroAlt: z.string().max(220).default(""),
  gallery: z.array(z.object({
    id: z.string().min(1).max(120),
    url: mediaUrl,
    alt: z.string().max(220).default(""),
    kind: z.enum(["image", "video"]).default("image"),
  })).max(12).default([]),
  featured: z.boolean().default(false),
  visible: z.boolean().default(true),
  proofStatus: z.enum(["not_claimed", "client_reported", "verified"]).default("not_claimed"),
  seoTitle: z.string().max(180).default(""),
  seoDescription: z.string().max(320).default(""),
});

export const webCatalogSchema = z.object({
  version: z.literal(1),
  servicesTitle: z.string().min(5).max(200),
  servicesLead: z.string().min(5).max(500),
  portfolioTitle: z.string().min(5).max(200),
  portfolioLead: z.string().min(5).max(500),
  services: z.array(webServiceSchema).min(1).max(20),
  kits: z.array(planSchema).max(8).default([]),
  projects: z.array(projectSchema).max(80).default([]),
  updatedAt: z.string().datetime(),
});

export type WebCatalog = z.infer<typeof webCatalogSchema>;
export type WebService = z.infer<typeof webServiceSchema>;
export type WebPlan = z.infer<typeof planSchema>;
export type WebProject = z.infer<typeof projectSchema>;

type SeedService = {
  id: string;
  title: string;
  slug: string;
  eyebrow: string;
  headline: string;
  sub: string;
  purpose: string;
  aim: string;
  recommended?: string;
  benefit_sections?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  plans?: SeedPlan[];
};

type SeedPlan = {
  name: string;
  price: number;
  headline: string;
  includes: string;
  bonuses?: string[];
  limit?: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 90);
}

function normalizePlan(
  plan: SeedPlan,
  prefix: string,
): WebPlan {
  return {
    id: `${prefix}-${slugify(plan.name)}`,
    name: plan.name,
    price: Math.round(plan.price || 0),
    headline: plan.headline,
    includes: plan.includes,
    bonuses: plan.bonuses || [],
    limit: plan.limit || "",
    approvalStatus: "draft",
    publicationStatus: "draft",
  };
}

const projectDefaults: Record<string, Omit<WebProject, "id" | "slug" | "title" | "serviceIds">> = {
  "personal-training": {
    industry: "Fitness y bienestar",
    summary: "Contenido y presencia digital desarrollados para acompañar la comunicación y el crecimiento comercial reportado por el cliente.",
    heroMedia: "/brochure/portfolio/personal-training-full.webp",
    heroAlt: "Proyecto de contenido para Personal Training Perú",
    gallery: [
      { id: "pt-brand", url: "/brochure/portfolio/personal-training-brand.webp", alt: "Identidad aplicada de Personal Training Perú", kind: "image" },
      { id: "pt-social", url: "/brochure/portfolio/personal-training-social.webp", alt: "Piezas sociales de Personal Training Perú", kind: "image" },
    ],
    featured: true,
    visible: true,
    proofStatus: "client_reported",
    seoTitle: "Personal Training Perú · Caso Crisdal Agency",
    seoDescription: "Contenido y presencia digital desarrollados para Personal Training Perú.",
  },
  "corporacion-henko": {
    industry: "Inmobiliaria",
    summary: "Narrativa y producción audiovisual para presentar una propuesta inmobiliaria con mayor claridad.",
    heroMedia: "/brochure/portfolio/corporacion-henko.webp",
    heroAlt: "Producción audiovisual para Corporación Henko",
    gallery: [], featured: true, visible: true, proofStatus: "not_claimed", seoTitle: "Corporación Henko · Caso Crisdal Agency", seoDescription: "Producción audiovisual para una propuesta inmobiliaria.",
  },
  "change-the-slim-studio": {
    industry: "Fitness y bienestar",
    summary: "Sistema visual, contenido y aplicaciones de marca para una experiencia reconocible en canales físicos y digitales.",
    heroMedia: "/brochure/portfolio/change-slim-studio.webp",
    heroAlt: "Proyecto de marca de Change The Slim Studio",
    gallery: [
      { id: "change-system", url: "/brochure/portfolio/change-brand-system.webp", alt: "Sistema visual de Change The Slim Studio", kind: "image" },
      { id: "change-experience", url: "/brochure/portfolio/change-experience.webp", alt: "Aplicaciones de Change The Slim Studio", kind: "image" },
    ],
    featured: true, visible: true, proofStatus: "not_claimed", seoTitle: "Change The Slim Studio · Caso Crisdal Agency", seoDescription: "Sistema visual y contenido para Change The Slim Studio.",
  },
  "colegio-san-juan": {
    industry: "Educación",
    summary: "Identidad, fachada y aplicaciones institucionales para sostener una experiencia visual coherente.",
    heroMedia: "/brochure/portfolio/colegio-san-juan.webp",
    heroAlt: "Proyecto de identidad para Colegio San Juan",
    gallery: [
      { id: "san-juan-campaign", url: "/brochure/portfolio/san-juan-campaign.webp", alt: "Aplicaciones de campaña del Colegio San Juan", kind: "image" },
    ],
    featured: true, visible: true, proofStatus: "not_claimed", seoTitle: "Colegio San Juan · Caso Crisdal Agency", seoDescription: "Identidad y aplicaciones institucionales para Colegio San Juan.",
  },
};

const seedServices = (seed.services as SeedService[]).map((service) => ({
  id: service.id,
  title: service.title,
  slug: service.slug,
  eyebrow: service.eyebrow,
  headline: service.headline,
  sub: service.sub,
  purpose: service.purpose,
  aim: service.aim,
  recommended: service.recommended || "",
  visible: true,
  heroMedia: "",
  heroAlt: "",
  cardMedia: "",
  cardAlt: "",
  seoTitle: `${service.title} en Huancayo`,
  seoDescription: service.sub,
  benefits: service.benefit_sections || [],
  faqs: service.faqs || [],
  plans: (service.plans || []).map((plan) => normalizePlan(plan, service.id)),
}));

const seedProjects = seed.seed_projects.map((project) => ({
  id: project.slug,
  slug: project.slug,
  title: project.title,
  serviceIds: "service_ids" in project ? [...project.service_ids] : [],
  ...(projectDefaults[project.slug] || {
    industry: "",
    summary: "Proyecto real de Crisdal Agency pendiente de completar desde el panel.",
    heroMedia: "",
    heroAlt: "",
    gallery: [],
    featured: false,
    visible: true,
    proofStatus: "not_claimed" as const,
    seoTitle: `${project.title} · Caso Crisdal Agency`,
    seoDescription: `Proyecto real de Crisdal Agency para ${project.title}.`,
  }),
}));

export const defaultWebCatalog: WebCatalog = webCatalogSchema.parse({
  version: 1,
  servicesTitle: "Cada negocio necesita una manera diferente de comunicar su valor.",
  servicesLead: "Explora soluciones de fotografía, contenido, video, streaming, eventos y publicidad. Te ayudamos a definir el alcance adecuado.",
  portfolioTitle: "Mira cómo trabajamos, no solo lo que prometemos.",
  portfolioLead: "Una selección de proyectos reales, organizada por servicio e industria.",
  services: seedServices,
  kits: seed.kits.map((plan) => normalizePlan(plan, "kit")),
  projects: seedProjects,
  updatedAt: new Date(0).toISOString(),
});

export function isPlanPublic(plan: WebPlan) {
  return plan.approvalStatus === "approved" && plan.publicationStatus === "published";
}

export async function getWebCatalog(): Promise<WebCatalog> {
  try {
    await ensureBrochureBucket();
    const { data, error } = await getSupabaseServer()
      .storage.from(BROCHURE_BUCKET)
      .download(WEB_CATALOG_PATH);
    if (error || !data) return structuredClone(defaultWebCatalog);
    const parsed = webCatalogSchema.safeParse(JSON.parse(await data.text()));
    return parsed.success ? parsed.data : structuredClone(defaultWebCatalog);
  } catch {
    return structuredClone(defaultWebCatalog);
  }
}

export async function saveWebCatalog(input: unknown): Promise<WebCatalog> {
  const catalog = webCatalogSchema.parse({
    ...(typeof input === "object" && input ? input : {}),
    version: 1,
    updatedAt: new Date().toISOString(),
  });
  await ensureBrochureBucket();
  const blob = new Blob([JSON.stringify(catalog, null, 2)], { type: "application/json" });
  const { error } = await getSupabaseServer()
    .storage.from(BROCHURE_BUCKET)
    .upload(WEB_CATALOG_PATH, blob, {
      contentType: "application/json",
      cacheControl: "0",
      upsert: true,
    });
  if (error) throw error;
  return catalog;
}

export function serviceBySlug(catalog: WebCatalog, slug: string) {
  return catalog.services.find((service) => service.slug === slug && service.visible);
}
