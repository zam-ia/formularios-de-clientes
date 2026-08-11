import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const notifyEmail = process.env.NOTIFY_EMAIL ?? process.env.NEXT_PUBLIC_NOTIFY_EMAIL ?? 'crisdalagency@gmail.com';

if (!resendApiKey) {
  console.warn('RESEND_API_KEY not set — email sending will fail');
}

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { submission } = payload;
    if (!submission) return NextResponse.json({ error: 'missing submission' }, { status: 400 });

    const client = new Resend(resendApiKey ?? '');

    // Basic notification email — templates and localization should be added per docs
    const html = `
      <p>Nueva radiografía enviada</p>
      <p>ID: ${submission.id}</p>
      <p>Negocio: ${submission.business_name ?? '—'}</p>
      <p>Contacto: ${submission.contact_whatsapp ?? '—'} — ${submission.contact_email ?? '—'}</p>
      <p>Revisar panel de submissions en Supabase.</p>
    `;

    try {
      const resp = await client.emails.send({
        from: process.env.RESEND_FROM ?? 'no-reply@crisdal.agency',
        to: notifyEmail,
        subject: `Nueva Radiografía — ${submission.business_name ?? submission.id}`,
        html
      });

      return NextResponse.json({ success: true, resend: resp });
    } catch (err: any) {
      console.error('Resend send error', err);
      return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
    }
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
