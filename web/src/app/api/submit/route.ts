import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { intakeSchema } from '@/lib/intake';
import { sendSubmissionNotification } from '@/lib/notify';

export const runtime = 'nodejs';
export const maxDuration = 20;

async function verifyTurnstile(token: string | undefined, ip: string | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new FormData();
  body.set('secret', secret);
  body.set('response', token);
  if (ip) body.set('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
    cache: 'no-store',
  });
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 250_000) {
    return NextResponse.json({ error: 'La solicitud es demasiado grande.' }, { status: 413 });
  }

  try {
    const raw = await request.json();
    const parsed = intakeSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({
        error: 'Revisa los datos del formulario.',
        fields: parsed.error.flatten().fieldErrors,
      }, { status: 400 });
    }

    const payload = parsed.data;
    if (payload.website) {
      return NextResponse.json({ success: true, submission: { code: payload.submission_code } });
    }

    const elapsed = Date.now() - new Date(payload.started_at).getTime();
    if (!Number.isFinite(elapsed) || elapsed < 3_000) {
      return NextResponse.json({ error: 'Espera un momento antes de enviar.' }, { status: 429 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    if (!(await verifyTurnstile(payload.turnstile_token, ip))) {
      return NextResponse.json({ error: 'No pudimos verificar que seas una persona. Inténtalo otra vez.' }, { status: 400 });
    }

    const supabase = getSupabaseServer();
    const { files, turnstile_token: _turnstile, website: _website, ...submissionInput } = payload;
    void _turnstile;
    void _website;
    const insert = {
      ...submissionInput,
      marketing_invested: payload.marketing_invested,
      contact_email: payload.contact_email || null,
      deadline_date: payload.deadline_date || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };

    const { data: submission, error } = await supabase
      .from('onboarding_submissions')
      .insert(insert)
      .select('id, draft_id, submission_code, business_name, contact_whatsapp, contact_email')
      .single();

    if (error?.code === '23505') {
      const { data: existing } = await supabase
        .from('onboarding_submissions')
        .select('id, draft_id, submission_code, business_name, contact_whatsapp, contact_email')
        .eq('draft_id', payload.draft_id)
        .single();
      if (existing) return NextResponse.json({ success: true, submission: existing, duplicate: true });
    }

    if (error || !submission) {
      console.error('Submission insert failed', { code: error?.code });
      return NextResponse.json({ error: 'No pudimos guardar la radiografía. Inténtalo nuevamente.' }, { status: 500 });
    }

    if (files.length) {
      const fileRows = files.map((file) => ({ ...file, submission_id: submission.id }));
      const { error: fileError } = await supabase.from('onboarding_files').insert(fileRows);
      if (fileError) console.error('File metadata insert failed', { code: fileError.code });
    }

    let notified = false;
    try {
      await sendSubmissionNotification(payload);
      notified = true;
      await supabase.from('onboarding_submissions').update({ email_status: 'sent', email_error_code: null }).eq('id', submission.id);
    } catch (notifyError) {
      const code = notifyError instanceof Error ? notifyError.message.slice(0, 100) : 'email_failed';
      console.error('Notification failed', { code });
      await supabase.from('onboarding_submissions').update({ email_status: 'failed', email_error_code: code }).eq('id', submission.id);
    }

    return NextResponse.json({ success: true, submission, notified }, { status: 201 });
  } catch (error) {
    console.error('Submit route failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Ocurrió un error inesperado. Inténtalo nuevamente.' }, { status: 500 });
  }
}
