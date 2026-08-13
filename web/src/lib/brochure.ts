import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const BROCHURE_BUCKET = "crisdal-brochure-assets";
export const BROCHURE_CONTENT_PATH = "content/brochure.json";

const serviceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(320),
  tag: z.string().max(40).default(""),
});

const mediaSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(["image", "video", "document"]),
  path: z.string().min(1).max(500),
  url: z
    .string()
    .max(1500)
    .refine((value) => value.startsWith("/") || /^https:\/\//.test(value), "URL inválida"),
  title: z.string().max(100).default(""),
  caption: z.string().max(320).default(""),
  mimeType: z.string().max(100),
  sizeBytes: z.number().int().nonnegative().default(0),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  positionX: z.number().min(0).max(100).default(50),
  positionY: z.number().min(0).max(100).default(50),
  zoom: z.number().min(1).max(2.5).default(1),
});

export const brochureSectionTypes = [
  "problems",
  "manifesto",
  "solutions",
  "metrics",
  "nexo",
  "cases",
  "testimonials",
  "showcase",
  "industries",
  "team",
  "route",
  "faq",
  "contact",
  "custom",
] as const;

export const brochureMediaLayouts = ["grid", "spotlight", "stack"] as const;
export const brochureWidgetSizes = ["small", "medium", "wide", "full"] as const;

const sectionSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(brochureSectionTypes),
  visible: z.boolean().default(true),
  eyebrow: z.string().max(80).default(""),
  title: z.string().max(180).default(""),
  body: z.string().max(1200).default(""),
  mediaIds: z.array(z.string().max(100)).max(30).default([]),
  mediaLayout: z.enum(brochureMediaLayouts).default("grid"),
  mediaSizes: z
    .record(z.string().max(100), z.enum(brochureWidgetSizes))
    .default({}),
});

const caseSchema = z.object({
  id: z.string().min(1).max(100),
  client: z.string().min(1).max(100),
  eyebrow: z.string().max(80).default("Caso de transformación"),
  title: z.string().min(1).max(180),
  summary: z.string().min(1).max(900),
  stages: z.array(z.string().min(1).max(240)).min(1).max(6),
  mediaIds: z.array(z.string().max(100)).max(12).default([]),
});

const metricSchema = z.object({
  id: z.string().min(1).max(100),
  value: z.number().finite().min(-999999).max(999999),
  prefix: z.string().max(12).default(""),
  suffix: z.string().max(12).default(""),
  label: z.string().min(1).max(100),
  description: z.string().max(240).default(""),
  visible: z.boolean().default(true),
});

const testimonialSchema = z.object({
  id: z.string().min(1).max(100),
  quote: z.string().min(1).max(700),
  name: z.string().min(1).max(100),
  role: z.string().max(100).default(""),
  company: z.string().max(100).default(""),
  rating: z.number().int().min(1).max(5).default(5),
  before: z.string().max(500).default(""),
  after: z.string().max(500).default(""),
  mediaId: z.string().max(100).default(""),
  visible: z.boolean().default(true),
});

const teamMemberSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  role: z.string().min(1).max(120),
  focus: z.string().max(280).default(""),
  imageUrl: z
    .string()
    .refine(
      (value) => value.startsWith("/") || /^https:\/\//.test(value),
      "Imagen inválida",
    ),
  positionX: z.number().min(0).max(100).default(50),
  positionY: z.number().min(0).max(100).default(35),
  visible: z.boolean().default(true),
});

export const defaultBrochureTeam = [
  {
    id: "aldair",
    name: "Aldair Pérez",
    role: "Strategy / Systems · 01",
    focus: "ORDENAR COMPLEJIDAD · Administración · Operación · Procesos",
    imageUrl: "/brochure/team/aldair-crisdal-2026.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
  {
    id: "milagros",
    name: "Milagros Ríos",
    role: "Culture / People · 02",
    focus: "ACTIVAR EQUIPOS · Cultura · Personas · Gestión del cambio",
    imageUrl: "/brochure/team/milagros-crisdal-2026.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
  {
    id: "abi",
    name: "Abi",
    role: "Growth / Communication · 03",
    focus: "CONECTAR OPORTUNIDADES · Comunicación · Publicidad · Marca",
    imageUrl: "/brochure/team/abi-crisdal-2026.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
];

export const defaultBrochureMetrics = [
  {
    id: "metric-capabilities",
    value: 4,
    prefix: "",
    suffix: "",
    label: "Frentes conectados",
    description: "Strategy, Growth, Systems y Culture trabajando juntas.",
    visible: true,
  },
  {
    id: "metric-view",
    value: 360,
    prefix: "",
    suffix: "°",
    label: "Visión del negocio",
    description: "Decisiones que conectan operación, personas y resultados.",
    visible: true,
  },
  {
    id: "metric-route",
    value: 1,
    prefix: "",
    suffix: "",
    label: "Ruta integrada",
    description: "Sin coordinar múltiples proveedores aislados.",
    visible: true,
  },
];

export const defaultBrochureMedia = [
  ["vitalis", "Clínica Vitalis", "Identidad, sitio web y presencia digital", "/brochure/portfolio/clinica-vitalis.webp"],
  ["sonrie", "Sonríe Dental", "Identidad y experiencia digital", "/brochure/portfolio/sonrie-dental.webp"],
  ["don-fuego", "Pollería Don Fuego", "Marca, empaque, fotografía y sitio web", "/brochure/portfolio/don-fuego.webp"],
  ["lima-brasa", "Lima Brasa", "Identidad y presencia digital para gastronomía", "/brochure/portfolio/lima-brasa.webp"],
  ["aura", "Aura Skin Studio", "Branding, website y ecosistema de contenido", "/brochure/portfolio/aura-skin-studio.webp"],
  ["nova", "Instituto Nova Gestión", "Identidad, web y campaña de admisión", "/brochure/portfolio/nova-gestion.webp"],
  ["change", "Change The Slim Studio", "Sistema de marca y experiencia digital", "/brochure/portfolio/change-slim-studio.webp"],
  ["training", "Personal Training", "Identidad y presencia comercial", "/brochure/portfolio/personal-training-case.webp"],
  ["change-system", "Change · Sistema de marca", "Redes, espacio, uniformes y aplicaciones", "/brochure/portfolio/change-brand-system.webp"],
  ["patron", "El Patrón Pollos & Parrillas", "Sistema de comunicación y contenido comercial", "/brochure/portfolio/el-patron.webp"],
  ["san-juan", "Colegio San Juan", "Identidad, señalética y campaña educativa", "/brochure/portfolio/colegio-san-juan.webp"],
  ["training-social", "Personal Training · Contenido", "Estrategia social, historias y piezas de conversión", "/brochure/portfolio/personal-training-social.webp"],
].map(([id, title, caption, url]) => ({
  id: `portfolio-${id}`,
  kind: "image" as const,
  path: `static${url}`,
  url,
  title,
  caption,
  mimeType: "image/webp",
  sizeBytes: 0,
  width: 1448,
  height: 1086,
  positionX: 50,
  positionY: 50,
  zoom: 1,
}));

export const defaultBrochureStoryMedia = [
  ["story-hero", "De desorden a crecimiento", "Visual de portada Crisdal", "/brochure/story/hero-system.webp"],
  ["story-overview", "Crisdal en una mirada", "Equipo, servicios y sistema de marca", "/brochure/story/brand-overview.webp"],
  ["story-problems", "Crecer no debería desordenarte", "Los tres problemas que frenan el crecimiento", "/brochure/story/problems.webp"],
  ["story-manifesto", "Más conexión", "Más marketing no arregla un negocio desconectado", "/brochure/story/manifesto.webp"],
  ["story-strategy", "Crisdal Strategy", "Diagnóstico, claridad y priorización", "/brochure/story/strategy.webp"],
  ["story-growth", "Crisdal Growth", "Contenido, campaña, conversación, lead y seguimiento", "/brochure/story/growth.webp"],
  ["story-systems", "Crisdal Systems", "Flujo integrado y automatización", "/brochure/story/systems.webp"],
  ["story-culture", "Crisdal Culture", "Roles, acuerdos y adopción", "/brochure/story/culture.webp"],
  ["story-nexo", "Marco NEXO", "Cómo conectamos estrategia, experiencia y optimización", "/brochure/story/nexo.webp"],
  ["story-rebagliati", "Caso Rebagliati", "Evidencias, proceso y modelo operativo", "/brochure/story/caso-rebagliati.webp"],
].map(([id, title, caption, url]) => ({
  id,
  kind: "image" as const,
  path: `static${url}`,
  url,
  title,
  caption,
  mimeType: "image/webp",
  sizeBytes: 0,
  width: 1586,
  height: 992,
  positionX: 50,
  positionY: 50,
  zoom: 1,
}));

export const defaultBrochureTestimonials: Array<z.infer<typeof testimonialSchema>> = [];

export const defaultBrochureSections = [
  {
    id: "problems",
    type: "problems" as const,
    visible: true,
    eyebrow: "Crecer no debería desordenarte",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "manifesto",
    type: "manifesto" as const,
    visible: true,
    eyebrow: "",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "solutions",
    type: "solutions" as const,
    visible: true,
    eyebrow: "Un sistema conectado",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "nexo",
    type: "nexo" as const,
    visible: true,
    eyebrow: "Nuestra manera de trabajar",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "metrics",
    type: "metrics" as const,
    visible: true,
    eyebrow: "Modelo integrado",
    title: "Un sistema pensado como uno solo.",
    body: "No son resultados prometidos: describen cómo conectamos el negocio para avanzar con una sola ruta.",
    mediaIds: [],
  },
  {
    id: "cases",
    type: "cases" as const,
    visible: true,
    eyebrow: "Casos reales",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "showcase",
    type: "showcase" as const,
    visible: true,
    eyebrow: "Trabajo reciente",
    title: "Ideas que ya tomaron forma.",
    body: "Videos, campañas, piezas y experiencias creadas junto a nuestros clientes.",
    mediaIds: [],
  },
  {
    id: "testimonials",
    type: "testimonials" as const,
    visible: true,
    eyebrow: "Experiencias compartidas",
    title: "La transformación, contada por sus protagonistas.",
    body: "Publica aquí testimonios reales y autorizados de tus clientes.",
    mediaIds: [],
  },
  {
    id: "industries",
    type: "industries" as const,
    visible: true,
    eyebrow: "Experiencia",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "team",
    type: "team" as const,
    visible: true,
    eyebrow: "Equipo interdisciplinario",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "route",
    type: "route" as const,
    visible: true,
    eyebrow: "Cómo trabajamos",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "faq",
    type: "faq" as const,
    visible: true,
    eyebrow: "Preguntas frecuentes",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "contact",
    type: "contact" as const,
    visible: true,
    eyebrow: "Conversemos",
    title: "",
    body: "",
    mediaIds: [],
  },
].map((section) => ({
  ...section,
  mediaLayout: "grid" as const,
  mediaSizes: {},
}));

export const defaultBrochureCases = [
  {
    id: "rebagliati",
    client: "Rebagliati Diplomados",
    eyebrow: "Caso de transformación",
    title: "Del diagnóstico al orden operativo.",
    summary:
      "Empezamos escuchando al equipo y entendiendo cómo trabajaba el negocio. A partir de ahí ordenamos procesos, responsabilidades y prioridades para construir una base más clara para crecer.",
    stages: [
      "Entender el contexto y escuchar al equipo.",
      "Ordenar procesos, responsabilidades y comunicación.",
      "Dejar una base clara para seguir creciendo.",
    ],
    mediaIds: [],
  },
];

export const brochureContentSchema = z.object({
  version: z.number().int().positive().default(5),
  kicker: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  lead: z.string().min(1).max(500),
  heroMediaId: z.string().max(100).default("story-hero"),
  storyTitle: z.string().min(1).max(120),
  story: z.string().min(1).max(900),
  ctaLabel: z.string().min(1).max(60),
  ctaUrl: z.string().min(1).max(600),
  whatsappNumber: z.string().regex(/^\d{8,15}$/),
  services: z.array(serviceSchema).min(1).max(12),
  media: z.array(mediaSchema).max(120),
  sections: z
    .array(sectionSchema)
    .min(1)
    .max(30)
    .default(defaultBrochureSections),
  cases: z.array(caseSchema).max(20).default(defaultBrochureCases),
  metrics: z.array(metricSchema).max(16).default(defaultBrochureMetrics),
  testimonials: z
    .array(testimonialSchema)
    .max(24)
    .default(defaultBrochureTestimonials),
  teamMembers: z.array(teamMemberSchema).max(12).default(defaultBrochureTeam),
  updatedAt: z.string().datetime(),
});

export type BrochureContent = z.infer<typeof brochureContentSchema>;
export type BrochureMedia = z.infer<typeof mediaSchema>;
export type BrochureSection = z.infer<typeof sectionSchema>;
export type BrochureCase = z.infer<typeof caseSchema>;
export type BrochureMetric = z.infer<typeof metricSchema>;
export type BrochureTestimonial = z.infer<typeof testimonialSchema>;
export type BrochureTeamMember = z.infer<typeof teamMemberSchema>;
export type BrochureSectionType = (typeof brochureSectionTypes)[number];
export type BrochureMediaLayout = (typeof brochureMediaLayouts)[number];
export type BrochureWidgetSize = (typeof brochureWidgetSizes)[number];

export const defaultBrochureContent: BrochureContent = {
  version: 5,
  kicker: "Estrategia · Procesos · Cultura · Tecnología",
  title: "Crecer con orden.",
  lead: "Ayudamos a convertir un crecimiento que se siente pesado en una empresa más clara, rentable y preparada para lo que viene.",
  heroMediaId: "story-hero",
  storyTitle: "un negocio que trabaja desconectado.",
  story:
    "No creemos en sumar herramientas por sumar. Primero entendemos qué está pasando, luego ordenamos lo esencial y recién entonces construimos una solución que el equipo pueda sostener.",
  ctaLabel: "Solicitar diagnóstico",
  ctaUrl: "#contacto",
  whatsappNumber: "51987088359",
  services: [
    {
      id: "strategy",
      title: "Strategy",
      description:
        "Ponemos el problema sobre la mesa, definimos prioridades y trazamos una ruta clara para avanzar.",
      tag: "Dirección",
    },
    {
      id: "growth",
      title: "Growth",
      description:
        "Conectamos contenido, campañas y embudos con oportunidades comerciales que sí puedes seguir y medir.",
      tag: "Demanda",
    },
    {
      id: "systems",
      title: "Systems",
      description:
        "Ordenamos procesos y usamos tecnología, automatización e IA para que el trabajo fluya con menos fricción.",
      tag: "Sistema",
    },
    {
      id: "culture",
      title: "Culture",
      description:
        "Aclaramos funciones y acompañamos al equipo para que las mejoras no dependan de una sola persona.",
      tag: "Adopción",
    },
  ],
  media: [...defaultBrochureMedia, ...defaultBrochureStoryMedia],
  sections: defaultBrochureSections,
  cases: defaultBrochureCases,
  metrics: defaultBrochureMetrics,
  testimonials: defaultBrochureTestimonials,
  teamMembers: defaultBrochureTeam,
  updatedAt: new Date(0).toISOString(),
};

const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "application/json",
];

export async function ensureBrochureBucket() {
  const supabase = getSupabaseServer();
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) throw listError;
  const exists = buckets.some((bucket) => bucket.name === BROCHURE_BUCKET);
  const options = {
    public: true,
    fileSizeLimit: 50 * 1024 * 1024,
    allowedMimeTypes,
  };
  if (!exists) {
    const { error } = await supabase.storage.createBucket(
      BROCHURE_BUCKET,
      options,
    );
    if (error) throw error;
  } else {
    const { error } = await supabase.storage.updateBucket(
      BROCHURE_BUCKET,
      options,
    );
    if (error) throw error;
  }
}

export async function getBrochureContent(): Promise<BrochureContent> {
  try {
    const { data, error } = await getSupabaseServer()
      .storage.from(BROCHURE_BUCKET)
      .download(BROCHURE_CONTENT_PATH);
    if (error || !data) return defaultBrochureContent;
    const raw = JSON.parse(await data.text()) as Record<string, unknown>;
    if (Number(raw.version || 1) < 3) {
      const legacyMedia = Array.isArray(raw.media)
        ? raw.media.map((item) => ({
            ...(item as object),
            sizeBytes: (item as { sizeBytes?: number }).sizeBytes || 0,
            positionX: (item as { positionX?: number }).positionX ?? 50,
            positionY: (item as { positionY?: number }).positionY ?? 50,
            zoom: (item as { zoom?: number }).zoom ?? 1,
          }))
        : [];
      return brochureContentSchema.parse({
        ...defaultBrochureContent,
        media: legacyMedia,
        whatsappNumber:
          raw.whatsappNumber || defaultBrochureContent.whatsappNumber,
        ctaUrl: raw.ctaUrl || defaultBrochureContent.ctaUrl,
        updatedAt: raw.updatedAt || defaultBrochureContent.updatedAt,
      });
    }
    const storedVersion = Number(raw.version || 1);
    const storedSections = Array.isArray(raw.sections)
      ? (raw.sections as Array<Record<string, unknown>>)
      : defaultBrochureSections;
    let migratedSections =
      storedVersion < 4
        ? (() => {
            const next = [...storedSections];
            const newWidgets = defaultBrochureSections.filter(
              (section) =>
                ["metrics", "testimonials"].includes(section.type) &&
                !next.some((item) => item.type === section.type),
            );
            const contactIndex = next.findIndex(
              (section) => section.type === "contact",
            );
            next.splice(
              contactIndex >= 0 ? contactIndex : next.length,
              0,
              ...newWidgets,
            );
            return next;
          })()
        : storedSections;
    if (storedVersion < 5) {
      const order: Record<string, number> = {
        problems: 1,
        manifesto: 2,
        solutions: 3,
        nexo: 4,
        cases: 5,
        showcase: 6,
        industries: 7,
        team: 8,
        route: 9,
        metrics: 10,
        testimonials: 11,
        faq: 12,
        contact: 13,
        custom: 14,
      };
      migratedSections = migratedSections
        .map((section) => {
          if (section.type === "metrics")
            return {
              ...section,
              eyebrow: "Modelo integrado",
              title: "Un sistema pensado como uno solo.",
              body: "No son resultados prometidos: describen cómo conectamos el negocio para avanzar con una sola ruta.",
            };
          if (section.type === "nexo")
            return { ...section, eyebrow: "Marco de pensamiento" };
          if (section.type === "route")
            return { ...section, eyebrow: "Ciclo de implementación" };
          return section;
        })
        .sort((a, b) => (order[String(a.type)] || 99) - (order[String(b.type)] || 99));
    }
    const migratedTestimonials = Array.isArray(raw.testimonials)
      ? (raw.testimonials as Array<Record<string, unknown>>)
          .filter((item) => item.id !== "testimonial-placeholder" && item.name !== "Próximo testimonio")
          .map((item) => ({ ...item, before: item.before || "", after: item.after || "", mediaId: item.mediaId || "" }))
      : [];
    const existingMedia = Array.isArray(raw.media) ? raw.media : [];
    const migratedMedia = [
      ...existingMedia,
      ...[...defaultBrochureMedia, ...defaultBrochureStoryMedia].filter(
        (fallback) => !existingMedia.some((item) => (item as { id?: string }).id === fallback.id),
      ),
    ];
    const migratedTeam = Array.isArray(raw.teamMembers)
      ? (raw.teamMembers as Array<Record<string, unknown>>).map((person) => {
          const updated = defaultBrochureTeam.find((item) => item.id === person.id);
          return storedVersion < 5 && updated ? { ...person, role: updated.role, focus: updated.focus, imageUrl: updated.imageUrl } : person;
        })
      : defaultBrochureTeam;
    const parsed = brochureContentSchema.safeParse({
      ...raw,
      version: 5,
      heroMediaId: raw.heroMediaId || "story-hero",
      ctaLabel:
        storedVersion < 5
          ? defaultBrochureContent.ctaLabel
          : raw.ctaLabel || defaultBrochureContent.ctaLabel,
      ctaUrl:
        storedVersion < 5 && raw.ctaUrl === "/"
          ? defaultBrochureContent.ctaUrl
          : raw.ctaUrl || defaultBrochureContent.ctaUrl,
      sections: migratedSections,
      cases: raw.cases || defaultBrochureCases,
      metrics: storedVersion < 5 ? defaultBrochureMetrics : raw.metrics || defaultBrochureMetrics,
      testimonials: migratedTestimonials,
      teamMembers: migratedTeam,
      media: migratedMedia.length
        ? migratedMedia.map((item) => ({
            ...(item as object),
            sizeBytes: (item as { sizeBytes?: number }).sizeBytes || 0,
            positionX: (item as { positionX?: number }).positionX ?? 50,
            positionY: (item as { positionY?: number }).positionY ?? 50,
            zoom: (item as { zoom?: number }).zoom ?? 1,
          }))
        : [],
    });
    return parsed.success ? parsed.data : defaultBrochureContent;
  } catch {
    return defaultBrochureContent;
  }
}

export async function saveBrochureContent(input: unknown) {
  const content = brochureContentSchema.parse({
    ...(typeof input === "object" && input ? input : {}),
    version: 5,
    updatedAt: new Date().toISOString(),
  });
  await ensureBrochureBucket();
  const payload = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const { error } = await getSupabaseServer()
    .storage.from(BROCHURE_BUCKET)
    .upload(BROCHURE_CONTENT_PATH, payload, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw error;
  return content;
}

export function brochurePublicUrl(path: string) {
  return getSupabaseServer().storage.from(BROCHURE_BUCKET).getPublicUrl(path)
    .data.publicUrl;
}

export function createMediaPath(fileName: string) {
  const safeName =
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(-120) || "archivo";
  return `media/${Date.now()}-${randomUUID()}-${safeName}`;
}
