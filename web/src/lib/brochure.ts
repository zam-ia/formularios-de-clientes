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
  url: z.string().url().max(1500),
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
    role: "Estrategia & Procesos",
    focus: "Administración, operación y estructura.",
    imageUrl: "/team/aldair.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
  {
    id: "milagros",
    name: "Milagros Ríos",
    role: "Cultura & Personas",
    focus: "Psicología organizacional, cultura y gestión del cambio.",
    imageUrl: "/team/milagros.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
  {
    id: "abi",
    name: "Abi",
    role: "Comunicación & Growth",
    focus: "Comunicación estratégica, publicidad y marca.",
    imageUrl: "/team/abi.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
];

export const defaultBrochureMetrics = [
  {
    id: "metric-availability",
    value: 24,
    prefix: "",
    suffix: "/7",
    label: "Atención conectada",
    description: "Una experiencia preparada para acompañar cada oportunidad.",
    visible: true,
  },
  {
    id: "metric-capabilities",
    value: 4,
    prefix: "",
    suffix: " áreas",
    label: "Bajo una misma ruta",
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
    suffix: " ruta",
    label: "Sin proveedores aislados",
    description: "Un equipo que entiende el problema completo y mide el avance.",
    visible: true,
  },
];

export const defaultBrochureTestimonials = [
  {
    id: "testimonial-placeholder",
    quote:
      "Este espacio está listo para publicar una experiencia real cuando el cliente autorice el uso de su testimonio.",
    name: "Próximo testimonio",
    role: "Caso en preparación",
    company: "Cliente Crisdal",
    rating: 5,
    visible: true,
  },
];

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
    eyebrow: "Avance visible",
    title: "Los números también cuentan la historia.",
    body: "Indicadores claros para entender el sistema que estamos construyendo.",
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
  version: z.number().int().positive().default(4),
  kicker: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  lead: z.string().min(1).max(500),
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
  version: 4,
  kicker: "Estrategia · Procesos · Cultura · Tecnología",
  title: "Crecer con orden.",
  lead: "Ayudamos a convertir un crecimiento que se siente pesado en una empresa más clara, rentable y preparada para lo que viene.",
  storyTitle: "un negocio que trabaja desconectado.",
  story:
    "No creemos en sumar herramientas por sumar. Primero entendemos qué está pasando, luego ordenamos lo esencial y recién entonces construimos una solución que el equipo pueda sostener.",
  ctaLabel: "Cuéntanos sobre tu empresa",
  ctaUrl: "/",
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
  media: [],
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
    const storedSections = Array.isArray(raw.sections)
      ? (raw.sections as Array<Record<string, unknown>>)
      : defaultBrochureSections;
    const migratedSections =
      Number(raw.version || 1) < 4
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
    const parsed = brochureContentSchema.safeParse({
      ...raw,
      version: 4,
      sections: migratedSections,
      cases: raw.cases || defaultBrochureCases,
      metrics: raw.metrics || defaultBrochureMetrics,
      testimonials: raw.testimonials || defaultBrochureTestimonials,
      teamMembers: raw.teamMembers || defaultBrochureTeam,
      media: Array.isArray(raw.media)
        ? raw.media.map((item) => ({
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
    version: 4,
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
