import { NextResponse } from "next/server";
import { z } from "zod";
import { sendBrochureContactNotification } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 15;

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  company: z.string().trim().min(2).max(100),
  whatsapp: z.string().trim().min(8).max(20),
  message: z.string().trim().min(10).max(600),
  website: z.string().max(200).optional().default(""),
});

const attempts = new Map<string, number[]>();

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const requestOrigin = new URL(request.url).origin;
  const allowedOrigin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || requestOrigin;
  if (!origin || (origin !== requestOrigin && origin !== allowedOrigin))
    return NextResponse.json(
      { error: "Origen no permitido." },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") || 0) > 20_000)
    return NextResponse.json(
      { error: "Solicitud demasiado grande." },
      { status: 413 },
    );

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const recent = (attempts.get(ip) || []).filter(
    (time) => now - time < 10 * 60_000,
  );
  if (recent.length >= 3)
    return NextResponse.json(
      { error: "Espera unos minutos antes de volver a enviar." },
      { status: 429 },
    );

  try {
    const parsed = contactSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Revisa los datos del formulario." },
        { status: 400 },
      );
    if (parsed.data.website) return NextResponse.json({ success: true });
    attempts.set(ip, [...recent, now]);
    await sendBrochureContactNotification(parsed.data);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Brochure contact failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "No pudimos enviar tu consulta." },
      { status: 500 },
    );
  }
}
