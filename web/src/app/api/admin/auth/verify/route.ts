import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { setAdminCookie, verifyMagicLinkToken } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!verifyMagicLinkToken(token)) {
    return NextResponse.redirect(new URL('/panel?access=invalid', request.url));
  }
  const response = NextResponse.redirect(new URL('/panel?access=ok', request.url));
  setAdminCookie(response);
  return response;
}
