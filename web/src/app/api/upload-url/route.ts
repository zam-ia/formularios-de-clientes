import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServer } from '@/lib/supabaseServer';

const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'] as const;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const uploadRequestSchema = z.object({
  draftId: z.string().uuid(),
  category: z.enum(['brand_assets', 'materials']),
  filename: z.string().min(1).max(255),
  contentType: z.enum(allowedMimes),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

function safeFilename(filename: string) {
  const extension = filename.includes('.') ? `.${filename.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
  return `${crypto.randomUUID()}${extension}`;
}

export async function POST(request: Request) {
  try {
    const parsed = uploadRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Archivo no permitido o mayor de 20 MB.' }, { status: 400 });
    }

    const { draftId, category, filename, contentType, size } = parsed.data;
    const bucket = process.env.SUPABASE_FILES_BUCKET || 'brand-intake-files';
    const storagePath = `${draftId}/${category}/${safeFilename(filename)}`;
    const supabase = getSupabaseServer();
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(storagePath, { upsert: false });
    if (error) throw error;

    return NextResponse.json({
      storagePath,
      token: data.token,
      file: { category, storage_path: storagePath, original_name: filename, mime_type: contentType, size_bytes: size },
    });
  } catch (error) {
    console.error('Signed upload URL failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'No pudimos preparar la carga. Inténtalo nuevamente.' }, { status: 500 });
  }
}

const deleteRequestSchema = z.object({
  draftId: z.string().uuid(),
  storagePath: z.string().min(1).max(500),
});

export async function DELETE(request: Request) {
  try {
    const parsed = deleteRequestSchema.safeParse(await request.json());
    if (!parsed.success || !parsed.data.storagePath.startsWith(`${parsed.data.draftId}/`)) {
      return NextResponse.json({ error: 'Ruta no válida.' }, { status: 400 });
    }
    const bucket = process.env.SUPABASE_FILES_BUCKET || 'brand-intake-files';
    const supabase = getSupabaseServer();
    const { error } = await supabase.storage.from(bucket).remove([parsed.data.storagePath]);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete upload failed', { message: error instanceof Error ? error.message : 'unknown' });
    return NextResponse.json({ error: 'No pudimos eliminar el archivo.' }, { status: 500 });
  }
}
