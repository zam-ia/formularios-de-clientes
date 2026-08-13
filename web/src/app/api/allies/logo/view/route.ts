import { NextResponse, type NextRequest } from "next/server";
import { allyIdFromRequest } from "@/lib/allyAuth";
import { ALLIES_BUCKET, getAllyById } from "@/lib/allies";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const allyId = allyIdFromRequest(request);
  if (!allyId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const ally = await getAllyById(allyId);
  if (!ally || ally.status !== "approved" || ally.must_change_password)
    return NextResponse.json({ error: "Acceso no activo." }, { status: 403 });

  const path = request.nextUrl.searchParams.get("path") || "";
  if (!/^logos\/[a-zA-Z0-9_-]+-\d+\.(jpg|png|webp|avif)$/.test(path)) {
    return NextResponse.json({ error: "Archivo no válido." }, { status: 400 });
  }

  const { data, error } = await getSupabaseServer().storage
    .from(ALLIES_BUCKET)
    .download(path);
  if (error || !data) {
    return NextResponse.json({ error: "Imagen no encontrada." }, { status: 404 });
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      "Content-Type": data.type || "image/webp",
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
