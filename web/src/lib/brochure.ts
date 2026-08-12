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
  version: 2,
  kicker: 'Estrategia · Procesos · Cultura · Tecnología',
  title: 'Crecer con orden.',
  lead: 'Transformamos el crecimiento desordenado en una estructura más clara, rentable y preparada para escalar.',
  storyTitle: 'un sistema roto.',
  story: 'Por eso diagnosticamos antes de proponer, ordenamos antes de automatizar y medimos antes de escalar.',
  ctaLabel: 'Solicitar diagnóstico',
  ctaUrl: '/',
  whatsappNumber: '51987088359',
  services: [
    { id: 'strategy', title: 'Strategy', description: 'Diagnóstico, posicionamiento, objetivos y roadmap para convertir problemas dispersos en prioridades claras.', tag: 'Dirección' },
    { id: 'growth', title: 'Growth', description: 'Contenido, campañas, pauta y embudos conectados con una ruta medible hacia oportunidades comerciales.', tag: 'Demanda' },
    { id: 'systems', title: 'Systems', description: 'Procesos, CRM, automatización, IA, web, dashboards e integraciones para reducir fricción.', tag: 'Sistema' },
    { id: 'culture', title: 'Culture', description: 'Funciones, comunicación interna, cultura y gestión del cambio para sostener las mejoras.', tag: 'Adopción' },
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
    if (!parsed.success) return defaultBrochureContent;
    if (parsed.data.version < defaultBrochureContent.version) {
      return { ...defaultBrochureContent, media: parsed.data.media, whatsappNumber: parsed.data.whatsappNumber, updatedAt: parsed.data.updatedAt };
    }
    return parsed.data;
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
