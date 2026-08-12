import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { clearAdminCookie, isAdminRequest } from '@/lib/adminAuth';

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const response = NextResponse.json({ success: true });
  clearAdminCookie(response);
  return response;
}
