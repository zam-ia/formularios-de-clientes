import { z } from 'zod';

const text = (max: number) => z.string().trim().max(max).nullable().optional();

export const uploadedFileSchema = z.object({
  category: z.enum(['brand_assets', 'materials']),
  storage_path: z.string().min(1).max(500),
  original_name: z.string().min(1).max(255),
  mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']),
  size_bytes: z.number().int().positive().max(20 * 1024 * 1024),
});

export const intakeSchema = z.object({
  draft_id: z.string().uuid(),
  submission_code: z.string().regex(/^RM-[A-Z0-9]{6}$/),
  form_version: z.string().min(1).max(20),
  service_types: z.array(z.string().max(100)).min(1).max(2),
  business_name: z.string().trim().min(2).max(120),
  sector: z.string().trim().min(1).max(120),
  location: z.string().trim().min(2).max(120),
  business_age: z.string().trim().min(1).max(80),
  social_links: text(600),

  brand_words: z.array(z.string().trim().min(1).max(40)).length(3),
  brand_assets_status: z.string().trim().min(1).max(120),
  brand_colors_text: text(300),
  brand_tone: z.string().trim().min(1).max(120),
  brand_avoid: text(500),

  primary_goal: z.string().trim().min(1).max(120),
  four_week_result: z.string().trim().min(2).max(300),
  primary_cta: z.string().trim().min(1).max(120),

  ideal_customer: z.string().trim().min(5).max(600),
  customer_problem: z.string().trim().min(5).max(500),
  customer_channels: z.array(z.string().max(80)).min(1).max(8),
  main_objection: text(300),

  star_offer: z.string().trim().min(2).max(200),
  average_price: z.string().trim().min(1).max(100),
  differentiator: z.string().trim().min(5).max(600),
  current_promo: text(300),
  competitors: text(300),
  competitor_notes: text(500),

  marketing_invested: z.boolean(),
  marketing_history: text(600),
  ad_budget: text(100),
  own_materials: z.string().trim().min(1).max(120),
  materials_link: text(600),

  deadline_type: z.string().trim().min(1).max(80),
  deadline_date: z.string().date().nullable().optional(),
  key_date: text(300),
  contact_name: z.string().trim().min(2).max(120),
  contact_whatsapp: z.string().regex(/^\+[1-9]\d{7,14}$/),
  contact_email: z.union([z.literal(''), z.string().email().max(180)]).nullable().optional(),
  best_contact_time: z.string().trim().min(1).max(80),
  consent: z.literal(true),

  files: z.array(uploadedFileSchema).max(2).default([]),
  turnstile_token: z.string().max(2048).optional(),
  website: z.string().max(0).optional(),
  started_at: z.string().datetime(),
  utm_source: text(200),
  utm_medium: text(200),
  utm_campaign: text(200),
  utm_content: text(200),
  utm_term: text(200),
  referrer: text(1000),
  landing_path: text(500),
}).superRefine((data, ctx) => {
  if (data.marketing_invested && !data.marketing_history) {
    ctx.addIssue({ code: 'custom', path: ['marketing_history'], message: 'Cuéntanos brevemente qué pasó.' });
  }
  if (data.deadline_type === 'Tengo una fecha exacta' && !data.deadline_date) {
    ctx.addIssue({ code: 'custom', path: ['deadline_date'], message: 'Selecciona una fecha.' });
  }
  for (const file of data.files) {
    if (!file.storage_path.startsWith(`${data.draft_id}/`)) {
      ctx.addIssue({ code: 'custom', path: ['files'], message: 'La ruta del archivo no es válida.' });
    }
  }
});

export type IntakePayload = z.infer<typeof intakeSchema>;
