import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    // Minimal mapping: insert payload as appropriate fields
    const insert = {
      draft_id: payload.draft_id ?? null,
      submission_code: payload.submission_code ?? null,
      form_version: payload.form_version ?? '1.0',
      service_types: payload.service_types ?? [],
      business_name: payload.business_name ?? null,
      sector: payload.sector ?? null,
      location: payload.location ?? null,
      business_age: payload.business_age ?? null,
      social_links: payload.social_links ?? null,

      brand_words: payload.brand_words ?? [],
      brand_assets_status: payload.brand_assets_status ?? null,
      brand_colors_text: payload.brand_colors_text ?? null,
      brand_tone: payload.brand_tone ?? null,
      brand_avoid: payload.brand_avoid ?? null,

      primary_goal: payload.primary_goal ?? null,
      four_week_result: payload.four_week_result ?? null,
      primary_cta: payload.primary_cta ?? null,

      ideal_customer: payload.ideal_customer ?? null,
      customer_problem: payload.customer_problem ?? null,
      customer_channels: payload.customer_channels ?? [],
      main_objection: payload.main_objection ?? null,

      star_offer: payload.star_offer ?? null,
      average_price: payload.average_price ?? null,
      differentiator: payload.differentiator ?? null,
      current_promo: payload.current_promo ?? null,
      competitors: payload.competitors ?? null,
      competitor_notes: payload.competitor_notes ?? null,

      marketing_invested: payload.marketing_invested ?? null,
      marketing_history: payload.marketing_history ?? null,
      ad_budget: payload.ad_budget ?? null,
      own_materials: payload.own_materials ?? null,
      materials_link: payload.materials_link ?? null,

      deadline_type: payload.deadline_type ?? null,
      deadline_date: payload.deadline_date ?? null,
      key_date: payload.key_date ?? null,

      contact_name: payload.contact_name ?? null,
      contact_whatsapp: payload.contact_whatsapp ?? null,
      contact_email: payload.contact_email ?? null,
      best_contact_time: payload.best_contact_time ?? null,
      consent: payload.consent ?? false,

      utm_source: payload.utm_source ?? null,
      utm_medium: payload.utm_medium ?? null,
      utm_campaign: payload.utm_campaign ?? null,
      utm_content: payload.utm_content ?? null,
      utm_term: payload.utm_term ?? null,
      referrer: payload.referrer ?? null,
      landing_path: payload.landing_path ?? null,

      started_at: payload.started_at ?? null,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseServer
      .from('onboarding_submissions')
      .insert(insert)
      .select('*')
      .single();

    if (error) {
      console.error('Supabase insert error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
