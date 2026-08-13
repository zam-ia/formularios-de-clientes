import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { getSiteContent, saveSiteContent } from "@/lib/siteContent";

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json(await getSiteContent());
}
export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try { return NextResponse.json(await saveSiteContent(await request.json())); }
  catch { return NextResponse.json({ error: "Revisa los textos y las imágenes antes de publicar." }, { status: 400 }); }
}
