import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const BROCHURE_BUCKET = 'crisdal-brochure-assets';
export const BROCHURE_CONTENT_PATH = 'content/brochure.json';

const serviceSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().min(1).max(80),
  description: z.string().min(1).max(240),
  tag: z.string().max(40).default(''),
});

const mediaSchema = z.object({
  id: z.string().min(1).max(100),
  kind: z.enum(['image', 'video', 'document']),
  path: z.string().min(1).max(500),
  url: z.string().url().max(1500),
  title: z.string().max(100).default(''),
  caption: z.string().max(240).default(''),
  mimeType: z.string().max(100),
});

export const brochureContentSchema = z.object({
  version: z.number().int().positive().default(1),
  kicker: z.string().min(1).max(80),
  title: z.string().min(1).max(140),
  lead: z.string().min(1).max(500),
  storyTitle: z.string().min(1).max(120),
  story: z.string().min(1).max(900),
  ctaLabel: z.string().min(1).max(60),
  ctaUrl: z.string().min(1).max(600),
  whatsappNumber: z.string().regex(/^\d{8,15}$/),
  services: z.array(serviceSchema).min(1).max(12),
  media: z.array(mediaSchema).max(40),
  updatedAt: z.string().datetime(),
});

export type BrochureContent = z.infer<typeof brochureContentSchema>;
export type BrochureMedia = z.infer<typeof mediaSchema>;

export const defaultBrochureContent: BrochureContent = {
  version: 1,
  kicker: 'Crisdal Agency · Estrategia, creatividad y tecnología',
  title: 'Hacemos que tu marca se vea, conecte y crezca.',
  lead: 'Diseñamos experiencias que convierten ideas en marcas claras, contenido memorable y herramientas digitales que ayudan a vender.',
  storyTitle: 'Antes de diseñar, entendemos. Antes de publicar, ordenamos.',
  story: 'En Crisdal combinamos estrategia, diseño, producción audiovisual y tecnología para que cada pieza tenga una razón de existir. No entregamos contenido aislado: construimos un sistema visual y comercial que tu negocio pueda sostener.',
  ctaLabel: 'Cuéntanos sobre tu proyecto',
  ctaUrl: '/',
  whatsappNumber: '51987088359',
  services: [
    { id: 'branding', title: 'Branding e identidad', description: 'Una marca coherente, reconocible y lista para crecer.', tag: 'Identidad' },
    { id: 'content', title: 'Contenido y campañas', description: 'Piezas que comunican con intención y mueven a la acción.', tag: 'Estrategia' },
    { id: 'video', title: 'Video y motion', description: 'Historias visuales pensadas para captar atención en segundos.', tag: 'Producción' },
    { id: 'digital', title: 'Web, catálogos y automatización', description: 'Experiencias rápidas y simples que convierten visitas en oportunidades.', tag: 'Tecnología' },
  ],
  media: [],
  updatedAt: new Date(0).toISOString(),
};

export async function ensureBrochureBucket() {
  const supabase = getSupabaseServer();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (!buckets.some((bucket) => bucket.name === BROCHURE_BUCKET)) {
    const { error } = await supabase.storage.createBucket(BROCHURE_BUCKET, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'application/json'],
    });
    if (error) throw error;
  }
}

export async function getBrochureContent(): Promise<BrochureContent> {
  try {
    const { data, error } = await getSupabaseServer().storage.from(BROCHURE_BUCKET).download(BROCHURE_CONTENT_PATH);
    if (error || !data) return defaultBrochureContent;
    const parsed = brochureContentSchema.safeParse(JSON.parse(await data.text()));
    return parsed.success ? parsed.data : defaultBrochureContent;
  } catch {
    return defaultBrochureContent;
  }
}

export async function saveBrochureContent(input: unknown) {
  const content = brochureContentSchema.parse({
    ...(typeof input === 'object' && input ? input : {}),
    updatedAt: new Date().toISOString(),
  });
  await ensureBrochureBucket();
  const payload = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
  const { error } = await getSupabaseServer().storage
    .from(BROCHURE_BUCKET)
    .upload(BROCHURE_CONTENT_PATH, payload, { contentType: 'application/json', upsert: true });
  if (error) throw error;
  return content;
}

export function brochurePublicUrl(path: string) {
  return getSupabaseServer().storage.from(BROCHURE_BUCKET).getPublicUrl(path).data.publicUrl;
}

export function createMediaPath(fileName: string) {
  const safeName = fileName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-120) || 'archivo';
  return `media/${Date.now()}-${randomUUID()}-${safeName}`;
}
