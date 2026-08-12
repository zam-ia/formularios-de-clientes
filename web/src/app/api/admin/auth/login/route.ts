import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { setAdminCookie, verifyAdminCredentials } from '@/lib/adminAuth';

export const runtime = 'nodejs';

const attempts = new Map<string, { count: number; blockedUntil: number }>();

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || (origin !== request.nextUrl.origin && origin !== process.env.NEXT_PUBLIC_SITE_URL)) {
    return NextResponse.json({ error: 'Solicitud no autorizada.' }, { status: 403 });
  }

  const clientKey = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const current = attempts.get(clientKey);
  if (current && current.blockedUntil > Date.now()) {
    return NextResponse.json({ error: 'Demasiados intentos. Espera unos minutos.' }, { status: 429 });
  }

  try {
    const body = await request.json() as { username?: string; password?: string };
    const valid = verifyAdminCredentials(body.username || '', body.password || '');
    if (!valid) {
      const count = (current?.count || 0) + 1;
      attempts.set(clientKey, { count, blockedUntil: count >= 5 ? Date.now() + 10 * 60 * 1000 : 0 });
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    }

    attempts.delete(clientKey);
    const response = NextResponse.json({ success: true });
    setAdminCookie(response);
    return response;
  } catch (error) {
    console.error('Admin login failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'No pudimos iniciar sesión.' }, { status: 500 });
  }
}
