import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/adminAuth';
import { getBrochureContent, saveBrochureContent } from '@/lib/brochure';

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  return NextResponse.json(await getBrochureContent());
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  try {
    return NextResponse.json(await saveBrochureContent(await request.json()));
  } catch (error) {
    console.error('Brochure save failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'No pudimos guardar el brochure.' }, { status: 400 });
  }
}
