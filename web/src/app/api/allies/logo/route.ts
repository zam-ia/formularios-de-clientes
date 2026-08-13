import { NextResponse, type NextRequest } from "next/server";
import { allyIdFromRequest, sameOrigin } from "@/lib/allyAuth";
import { ALLIES_BUCKET, ensureAlliesBucket, getAllyById } from "@/lib/allies";
import { getSupabaseServer } from "@/lib/supabaseServer";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  const id = allyIdFromRequest(request);
  if (!id)
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const ally = await getAllyById(id);
  if (!ally || ally.status !== "approved" || ally.must_change_password)
    return NextResponse.json({ error: "Acceso no activo." }, { status: 403 });
  const body = await request.json();
  const mime = String(body.mimeType || "");
  const size = Number(body.sizeBytes || 0);
  if (
    !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(mime) ||
    size < 1 ||
    size > 5 * 1024 * 1024
  )
    return NextResponse.json(
      { error: "Usa JPG, PNG, WebP o AVIF de hasta 5 MB." },
      { status: 400 },
    );
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const path = `logos/${id}-${Date.now()}.${ext}`;
  const storage = getSupabaseServer().storage;
  await ensureAlliesBucket();
  const { data, error } = await storage
    .from(ALLIES_BUCKET)
    .createSignedUploadUrl(path);
  if (error)
    return NextResponse.json(
      { error: "No pudimos preparar la carga." },
      { status: 500 },
    );
  const url = `/api/allies/logo/view?path=${encodeURIComponent(path)}`;
  return NextResponse.json({ path, token: data.token, url });
}
