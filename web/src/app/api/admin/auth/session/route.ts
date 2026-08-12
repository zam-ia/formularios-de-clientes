import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';

export async function GET(request: NextRequest) {
  return NextResponse.json({ authenticated: isAdminRequest(request) });
}
