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

const planSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(80),
  price: z.string().min(1).max(80),
  description: z.string().max(260).default(""),
  features: z.array(z.string().min(1).max(180)).min(1).max(12),
  badge: z.string().max(40).default(""),
  visible: z.boolean().default(true),
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
  "solutions",
  "method",
  "plans",
  "metrics",
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
    role: "Co-Founder · Estrategia & Producción",
    focus: "Administrador Industrial y Comunicador Audiovisual. Dirección de cuenta, estrategia, producción y visión.",
    imageUrl: "/brochure/team/aldair-crisdal-2026.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
  {
    id: "milagros",
    name: "Milagros Ríos",
    role: "Co-Founder · Personas & Experiencia",
    focus: "Psicóloga. Cultura, experiencia del cliente, coordinación y seguimiento del equipo.",
    imageUrl: "/brochure/team/milagros-crisdal-2026.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
  {
    id: "damaris",
    name: "Damaris Pérez",
    role: "Co-Founder · Comunicación & Contenido",
    focus: "Comunicadora titulada. Narrativa, contenido, comunicación de marca y dirección editorial.",
    imageUrl: "/brochure/team/equipo-crisdal-2026.webp",
    positionX: 72,
    positionY: 28,
    visible: true,
  },
  {
    id: "abi",
    name: "Abi",
    role: "Comercial & Brand Face",
    focus: "Conexión comercial, presencia de marca, contenido y relación con nuevos clientes.",
    imageUrl: "/brochure/team/abi-crisdal-2026.webp",
    positionX: 50,
    positionY: 28,
    visible: true,
  },
];

export const defaultBrochureMetrics = [
  {
    id: "metric-industries",
    value: 5,
    prefix: "",
    suffix: "",
    label: "Rubros atendidos",
    description: "Salud, educación, bienestar, gastronomía y servicios.",
    visible: true,
  },
  {
    id: "metric-contact",
    value: 1,
    prefix: "",
    suffix: "",
    label: "Punto de contacto",
    description: "Un equipo que coordina contenido, diseño, redes y pauta contigo.",
    visible: true,
  },
  {
    id: "metric-cycle",
    value: 4,
    prefix: "",
    suffix: "",
    label: "Momentos del ciclo",
    description: "Brief, producción, publicación y reporte con entregables claros.",
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
  ["training-full", "Personal Training · Caso completo", "Estrategia, contenido, comunidad y crecimiento comercial", "/brochure/portfolio/personal-training-full.webp"],
  ["change-ecosystem", "Change · Ecosistema", "Marca aplicada en puntos de contacto físicos y digitales", "/brochure/portfolio/change-ecosystem.webp"],
  ["san-juan-campaign", "Colegio San Juan · Campaña", "Admisión, identidad y comunicación educativa", "/brochure/portfolio/san-juan-campaign.webp"],
  ["henko", "Corporación Henko", "Producción audiovisual inmobiliaria en locación", "/brochure/portfolio/corporacion-henko.webp"],
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
  ["story-overview", "Crisdal en una mirada", "Equipo, contenido y sistema visual", "/brochure/story/brand-overview.webp"],
  ["story-problem-rhythm", "Ritmo de contenido", "Planificación y constancia de marca", "/brochure/story/strategy.webp"],
  ["story-problem-direction", "Dirección de contenido", "Estrategia antes de producir", "/brochure/story/systems.webp"],
  ["story-problem-dependency", "Trabajo en equipo", "Una operación que no depende de una sola persona", "/brochure/story/culture.webp"],
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

export const defaultBrochurePlans = [
  {
    id: "esencial",
    name: "Esencial",
    price: "S/200 / mes",
    description: "Para negocios que recién empiezan a mostrarse en redes.",
    features: [
      "1 video vertical profesional",
      "5 publicaciones con diseño y copy",
      "1 asesoría mensual de marketing",
      "Entrega lista para publicar",
    ],
    badge: "",
    visible: true,
  },
  {
    id: "crece",
    name: "Crece",
    price: "Desde S/420 / mes",
    description: "Para negocios que ya venden y necesitan presencia constante.",
    features: [
      "2 videos verticales",
      "8 publicaciones con diseño y copy",
      "Manejo completo de redes sociales",
      "Gestión de campaña en Meta Ads",
      "Reporte mensual de resultados",
    ],
    badge: "Más elegido",
    visible: true,
  },
  {
    id: "impulso",
    name: "Impulso",
    price: "Desde S/650 / mes",
    description: "Para reducir oportunidades perdidas por respuestas tardías.",
    features: [
      "3 videos verticales",
      "12 publicaciones",
      "Redes sociales + campaña Meta Ads",
      "Automatización de respuestas por WhatsApp",
      "Seguimiento quincenal de resultados",
    ],
    badge: "",
    visible: true,
  },
  {
    id: "elite",
    name: "Elite",
    price: "Cotización personalizada",
    description: "Para negocios que buscan un sistema comercial completo.",
    features: [
      "Todo lo incluido en Impulso",
      "Página web o landing de ventas",
      "Estrategia de contenido a 30 días",
      "Reunión estratégica mensual",
    ],
    badge: "",
    visible: true,
  },
] satisfies Array<z.infer<typeof planSchema>>;

export const defaultBrochureSections = [
  {
    id: "problems",
    type: "problems" as const,
    visible: true,
    eyebrow: "El problema",
    title: "",
    body: "",
    mediaIds: ["portfolio-henko"],
  },
  {
    id: "showcase",
    type: "showcase" as const,
    visible: true,
    eyebrow: "Trabajo reciente",
    title: "Mira lo que ya hicimos.",
    body: "Contenido, campañas, identidad y piezas creadas junto a negocios reales.",
    mediaIds: ["story-problem-rhythm", "story-problem-direction", "story-problem-dependency"],
    mediaSizes: {
      "story-problem-rhythm": "small" as const,
      "story-problem-direction": "small" as const,
      "story-problem-dependency": "small" as const,
    },
  },
  {
    id: "solutions",
    type: "solutions" as const,
    visible: true,
    eyebrow: "Qué hacemos",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "method",
    type: "method" as const,
    visible: true,
    eyebrow: "Método MÁGICA",
    title: "",
    body: "",
    mediaIds: [],
  },
  {
    id: "cases",
    type: "cases" as const,
    visible: true,
    eyebrow: "Casos y evidencia",
    title: "Trabajo real antes que promesas.",
    body: "Separamos resultados validados del alcance visual de cada proyecto.",
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
    id: "plans",
    type: "plans" as const,
    visible: true,
    eyebrow: "Planes mensuales",
    title: "Elige el punto de partida que más te conviene.",
    body: "Cuatro opciones claras. La inversión publicitaria y costos de terceros se cotizan por separado cuando corresponda.",
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
    id: "metrics",
    type: "metrics" as const,
    visible: true,
    eyebrow: "Una operación simple",
    title: "Todo lo necesario, sin coordinar cuatro proveedores.",
    body: "Datos que describen nuestra forma de trabajar; no son resultados prometidos.",
    mediaIds: [],
  },
  {
    id: "team",
    type: "team" as const,
    visible: true,
    eyebrow: "Equipo Crisdal",
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
  mediaSizes: "mediaSizes" in section ? section.mediaSizes ?? {} : {},
}));

export const defaultBrochureCases = [
  {
    id: "personal-training",
    client: "Personal Training Perú",
    eyebrow: "Contenido + crecimiento comercial",
    title: "De S/170 mil a más de S/220 mil mensuales.",
    summary:
      "Un caso de captación, renovación y crecimiento comercial respaldado por contenido y una presencia digital más consistente.",
    stages: [
      "Punto de partida: S/170 mil mensuales.",
      "Intervención: identidad, contenido y piezas de conversión.",
      "Resultado reportado: más de S/220 mil mensuales.",
    ],
    mediaIds: ["portfolio-training-full", "portfolio-training-social"],
  },
  {
    id: "corporacion-henko",
    client: "Corporación Henko",
    eyebrow: "Inmobiliaria · Producción audiovisual",
    title: "Una propuesta inmobiliaria explicada con claridad y presencia.",
    summary:
      "Construimos una narrativa audiovisual para presentar el proyecto, ordenar su comunicación y acompañar su presencia comercial. Mostramos el alcance creativo sin publicar métricas aún no validadas.",
    stages: [
      "Reto: comunicar una oferta compleja de forma más simple.",
      "Intervención: concepto, producción audiovisual y piezas comerciales.",
      "Resultado: una presencia más consistente en sus puntos de contacto.",
    ],
    mediaIds: [],
  },
  {
    id: "change",
    client: "Change The Slim Studio",
    eyebrow: "Branding + contenido",
    title: "Una marca fitness convertida en un sistema visual reconocible.",
    summary:
      "Desarrollamos aplicaciones para redes, prendas, papelería, espacios e identidad. El caso muestra alcance real del proyecto, sin atribuir métricas no validadas.",
    stages: [
      "Definición y orden visual de marca.",
      "Contenido y aplicaciones comerciales.",
      "Sistema consistente en canales físicos y digitales.",
    ],
    mediaIds: ["portfolio-change-ecosystem", "portfolio-change-system", "portfolio-change-experience"],
  },
  {
    id: "san-juan",
    client: "Colegio San Juan",
    eyebrow: "Identidad + presencia institucional",
    title: "Una experiencia de marca consistente dentro y fuera del colegio.",
    summary:
      "Trabajamos identidad, fachada, señalética y recepción para que cada punto de contacto comunicara la misma propuesta institucional.",
    stages: [
      "Diagnóstico de la experiencia visual.",
      "Diseño de aplicaciones y señalética.",
      "Implementación de una presencia institucional coherente.",
    ],
    mediaIds: ["portfolio-san-juan-campaign", "portfolio-san-juan"],
  },
];

export const brochureContentSchema = z.object({
  version: z.number().int().positive().default(8),
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
  plans: z.array(planSchema).min(1).max(8).default(defaultBrochurePlans),
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
export type BrochurePlan = z.infer<typeof planSchema>;
export type BrochureTestimonial = z.infer<typeof testimonialSchema>;
export type BrochureTeamMember = z.infer<typeof teamMemberSchema>;
export type BrochureSectionType = (typeof brochureSectionTypes)[number];
export type BrochureMediaLayout = (typeof brochureMediaLayouts)[number];
export type BrochureWidgetSize = (typeof brochureWidgetSizes)[number];

export const defaultBrochureContent: BrochureContent = {
  version: 8,
  kicker: "Contenido · Video · Redes · Publicidad",
  title: "Contenido que vende, no solo que se ve bonito.",
  lead: "Creamos y movemos contenido para que tu negocio deje de publicar por cumplir y empiece a generar conversaciones.",
  heroMediaId: "portfolio-training-social",
  storyTitle: "Claridad. Contexto. Curiosidad.",
  story:
    "Tres criterios para crear piezas que se entienden, conectan con la situación real de tu cliente y despiertan una razón para detenerse.",
  ctaLabel: "Ver nuestros planes",
  ctaUrl: "#planes",
  whatsappNumber: "51987088359",
  services: [
    {
      id: "video",
      title: "Video",
      description:
        "Grabamos y editamos videos verticales pensados para redes, no para quedar guardados en tu galería.",
      tag: "Grabación · Edición · Vertical",
    },
    {
      id: "design",
      title: "Design",
      description:
        "Diseñamos posts, flyers y piezas publicitarias con identidad para que tu negocio se vea tan bien como es.",
      tag: "Diseño · Copy · Identidad",
    },
    {
      id: "social",
      title: "Social",
      description:
        "Manejamos calendario, publicación y primera respuesta según el alcance del plan contratado.",
      tag: "Calendario · Publicación · Comunidad",
    },
    {
      id: "ads",
      title: "Ads",
      description:
        "Configuramos campañas en Meta Ads para llevar tu contenido a personas con mayor afinidad con tu oferta.",
      tag: "Campaña · Segmentación · Reporte",
    },
  ],
  plans: defaultBrochurePlans,
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
    if (storedVersion < 8) {
      const defaultProblems = defaultBrochureSections.find((section) => section.type === "problems");
      migratedSections = migratedSections.map((section) =>
        section.type === "problems" && defaultProblems
          ? {
              ...section,
              mediaIds: defaultProblems.mediaIds,
              mediaSizes: defaultProblems.mediaSizes,
            }
          : section,
      );
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
    const phaseOneMedia = Array.isArray(raw.media)
      ? migratedMedia
      : [...defaultBrochureMedia, ...defaultBrochureStoryMedia];
    const parsed = brochureContentSchema.safeParse({
      ...raw,
      version: 8,
      kicker: storedVersion < 7 ? defaultBrochureContent.kicker : raw.kicker,
      title: storedVersion < 7 ? defaultBrochureContent.title : raw.title,
      lead: storedVersion < 7 ? defaultBrochureContent.lead : raw.lead,
      heroMediaId: storedVersion < 7 ? defaultBrochureContent.heroMediaId : raw.heroMediaId || defaultBrochureContent.heroMediaId,
      storyTitle: storedVersion < 7 ? defaultBrochureContent.storyTitle : raw.storyTitle,
      story: storedVersion < 7 ? defaultBrochureContent.story : raw.story,
      ctaLabel:
        storedVersion < 7
          ? defaultBrochureContent.ctaLabel
          : raw.ctaLabel || defaultBrochureContent.ctaLabel,
      ctaUrl:
        storedVersion < 7 ? defaultBrochureContent.ctaUrl : raw.ctaUrl || defaultBrochureContent.ctaUrl,
      services: storedVersion < 7 ? defaultBrochureContent.services : raw.services || defaultBrochureContent.services,
      plans: storedVersion < 7 ? defaultBrochurePlans : raw.plans || defaultBrochurePlans,
      sections: storedVersion < 7 ? defaultBrochureSections : migratedSections,
      cases: storedVersion < 7 ? defaultBrochureCases : raw.cases || defaultBrochureCases,
      metrics: storedVersion < 7 ? defaultBrochureMetrics : raw.metrics || defaultBrochureMetrics,
      testimonials: migratedTestimonials,
      teamMembers: storedVersion < 7 ? defaultBrochureTeam : migratedTeam,
      media: phaseOneMedia.length
        ? phaseOneMedia.map((item) => ({
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
    version: 8,
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
