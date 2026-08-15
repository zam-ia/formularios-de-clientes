import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { adminSessionFromRequest } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  const user = adminSessionFromRequest(request);
  return NextResponse.json({ authenticated: Boolean(user), user });
}
