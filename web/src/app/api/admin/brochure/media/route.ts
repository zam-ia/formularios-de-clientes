import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import {
  BROCHURE_BUCKET,
  brochurePublicUrl,
  createMediaPath,
  ensureBrochureBucket,
} from "@/lib/brochure";
import { getSupabaseServer } from "@/lib/supabaseServer";

const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
  ]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(50 * 1024 * 1024),
});

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = uploadSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: "Archivo no permitido o demasiado grande." },
      { status: 400 },
    );
  const { fileName, sizeBytes } = parsed.data;
  const limit = 50 * 1024 * 1024;
  if (sizeBytes > limit)
    return NextResponse.json(
      { error: "El archivo supera el límite permitido para su tipo." },
      { status: 400 },
    );

  await ensureBrochureBucket();
  const path = createMediaPath(fileName);
  const { data, error } = await getSupabaseServer()
    .storage.from(BROCHURE_BUCKET)
    .createSignedUploadUrl(path);
  if (error)
    return NextResponse.json(
      { error: "No pudimos preparar la carga." },
      { status: 500 },
    );
  return NextResponse.json({
    path,
    token: data.token,
    publicUrl: brochurePublicUrl(path),
  });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const path = request.nextUrl.searchParams.get("path") || "";
  if (!path.startsWith("media/") || path.includes(".."))
    return NextResponse.json({ error: "Ruta inválida." }, { status: 400 });
  const { error } = await getSupabaseServer()
    .storage.from(BROCHURE_BUCKET)
    .remove([path]);
  if (error)
    return NextResponse.json(
      { error: "No pudimos eliminar el archivo." },
      { status: 500 },
    );
  return NextResponse.json({ success: true });
}
