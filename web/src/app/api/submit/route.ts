import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { intakeSchema } from '@/lib/intake';
import { sendSubmissionNotification } from '@/lib/notify';

export const runtime = 'nodejs';
export const maxDuration = 20;

type SubmissionSummary = {
  id?: string;
  draft_id: string;
  submission_code: string;
  business_name: string;
  contact_whatsapp: string;
  contact_email?: string | null;
};

function errorDetails(error: unknown) {
  if (!error || typeof error !== 'object') return { code: 'unknown', message: String(error || 'unknown') };
  const candidate = error as { code?: string; name?: string; message?: string; cause?: { code?: string } };
  return {
    code: candidate.code || candidate.cause?.code || candidate.name || 'unknown',
    message: candidate.message || 'unknown',
  };
}

function fallbackSubmission(payload: ReturnType<typeof intakeSchema.parse>): SubmissionSummary {
  return {
    draft_id: payload.draft_id,
    submission_code: payload.submission_code,
    business_name: payload.business_name,
    contact_whatsapp: payload.contact_whatsapp,
    contact_email: payload.contact_email || null,
  };
}

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

    let submission: SubmissionSummary | null = null;
    let persisted = false;
    let duplicate = false;
    let persistenceFailure: { code: string; message: string } | null = null;

    try {
      const { data, error } = await supabase
        .from('onboarding_submissions')
        .insert(insert)
        .select('id, draft_id, submission_code, business_name, contact_whatsapp, contact_email')
        .single();

      if (error?.code === '23505') {
        const { data: existing, error: existingError } = await supabase
          .from('onboarding_submissions')
          .select('id, draft_id, submission_code, business_name, contact_whatsapp, contact_email')
          .eq('draft_id', payload.draft_id)
          .maybeSingle();
        if (existingError) throw existingError;
        if (existing) {
          submission = existing;
          persisted = true;
          duplicate = true;
        } else {
          throw error;
        }
      } else if (error || !data) {
        throw error || new Error('submission_missing');
      } else {
        submission = data;
        persisted = true;
      }
    } catch (databaseError) {
      persistenceFailure = errorDetails(databaseError);
      submission = fallbackSubmission(payload);
      console.error('Submission persistence failed', persistenceFailure);
    }

    if (persisted && files.length && submission?.id) {
      const fileRows = files.map((file) => ({ ...file, submission_id: submission!.id }));
      const { error: fileError } = await supabase.from('onboarding_files').insert(fileRows);
      if (fileError) console.error('File metadata insert failed', errorDetails(fileError));
    }

    let notified: boolean | null = duplicate ? null : false;
    let notificationFailure = '';
    if (!duplicate || !persisted) {
      try {
        await sendSubmissionNotification(payload, {
          databaseBackup: !persisted,
          skipPrivateLinks: !persisted,
        });
        notified = true;
      } catch (notifyError) {
        notificationFailure = errorDetails(notifyError).message.slice(0, 100);
        console.error('Notification failed', errorDetails(notifyError));
      }
    }

    if (persisted && submission?.id && !duplicate) {
      try {
        await supabase
          .from('onboarding_submissions')
          .update({
            email_status: notified ? 'sent' : 'failed',
            email_error_code: notified ? null : notificationFailure || 'email_failed',
          })
          .eq('id', submission.id);
      } catch (statusError) {
        console.error('Email status update failed', errorDetails(statusError));
      }
    }

    if (!persisted && !notified) {
      return NextResponse.json({
        error: 'No pudimos conectar con nuestros servidores. Tu avance sigue guardado en este dispositivo. Inténtalo nuevamente en unos minutos o escríbenos por WhatsApp.',
        retryable: true,
        code: payload.submission_code,
      }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      submission,
      notified,
      persisted,
      duplicate,
      delivery: persisted ? 'database' : 'email_backup',
      warningCode: persistenceFailure?.code,
    }, { status: persisted ? 201 : 202 });
  } catch (error) {
    console.error('Submit route failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'Ocurrió un error inesperado. Inténtalo nuevamente.' }, { status: 500 });
  }
}
