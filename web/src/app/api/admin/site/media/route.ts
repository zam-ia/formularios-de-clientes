import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import { BROCHURE_BUCKET, ensureBrochureBucket } from "@/lib/brochure";
import { createSiteMediaPath, sitePublicUrl } from "@/lib/siteContent";
import { getSupabaseServer } from "@/lib/supabaseServer";

const schema = z.object({ fileName: z.string().min(1).max(255), mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"]), sizeBytes: z.number().int().positive().max(50 * 1024 * 1024) });
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Usa JPG, PNG, WEBP, AVIF, MP4 o WEBM de hasta 50 MB." }, { status: 400 });
  await ensureBrochureBucket();
  const path = createSiteMediaPath(parsed.data.fileName);
  const { data, error } = await getSupabaseServer().storage.from(BROCHURE_BUCKET).createSignedUploadUrl(path);
  if (error) return NextResponse.json({ error: "No pudimos preparar la carga." }, { status: 500 });
  return NextResponse.json({ path, token: data.token, publicUrl: sitePublicUrl(path) });
}
