import { NextResponse } from 'next/server';
import { createMagicLinkToken, getAdminEmail } from '@/lib/adminAuth';
import { sendEmail } from '@/lib/notify';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const token = createMagicLinkToken();
    const link = new URL('/api/admin/auth/verify', request.url);
    link.searchParams.set('token', token);

    await sendEmail({
      to: getAdminEmail(),
      subject: 'Tu acceso privado al panel de Crisdal',
      html: `<!doctype html><html><body style="margin:0;background:#f4f2ec;padding:28px;font-family:Arial,sans-serif;color:#11100e">
        <div style="max-width:560px;margin:auto;background:#fff;border-radius:24px;padding:32px;border:1px solid #e7dfd2">
          <p style="margin:0 0 10px;color:#9a6800;font-weight:700;letter-spacing:.08em">CRISDAL AGENCY</p>
          <h1 style="font-size:28px;margin:0 0 14px">Accede a tu panel privado</h1>
          <p style="line-height:1.6;color:#625f58">Este enlace es válido durante los próximos 15 minutos.</p>
          <a href="${link.toString()}" style="display:inline-block;margin-top:12px;background:#11100e;color:#fff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700">Abrir panel</a>
          <p style="font-size:12px;color:#8b877f;margin:26px 0 0">Si no solicitaste este acceso, puedes ignorar el mensaje.</p>
        </div>
      </body></html>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin magic link failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'No pudimos enviar el acceso. Inténtalo nuevamente.' }, { status: 500 });
  }
}
