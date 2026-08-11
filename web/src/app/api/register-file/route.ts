import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { submission_id, category, storage_path, original_name, mime_type, size_bytes } = payload;
    if (!submission_id || !storage_path || !original_name) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('onboarding_files')
      .insert({ submission_id, category, storage_path, original_name, mime_type, size_bytes })
      .select('*')
      .single();

    if (error) {
      console.error('Supabase file insert error', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, file: data });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
