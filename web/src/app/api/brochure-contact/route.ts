import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { mutateAdminData } from "@/lib/adminData";
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
    await Promise.all([
      sendBrochureContactNotification(parsed.data),
      mutateAdminData((data) => {
        const capturedAt = new Date().toISOString();
        const existing = data.clients.find(
          (client) =>
            client.status === "lead" &&
            (client.whatsapp === parsed.data.whatsapp ||
              client.company_name.toLowerCase() === parsed.data.company.toLowerCase()),
        );
        const leadNote = `Lead del brochure (${capturedAt.slice(0, 10)}): ${parsed.data.message}`;
        if (existing) {
          existing.contact_name = parsed.data.name;
          existing.whatsapp = parsed.data.whatsapp;
          existing.notes = `${existing.notes}\n\n${leadNote}`.trim();
          existing.updated_at = capturedAt;
          return existing;
        }
        const capturedDate = capturedAt.slice(0, 10);
        const lead = {
          id: randomUUID(),
          company_name: parsed.data.company,
          contact_name: parsed.data.name,
          whatsapp: parsed.data.whatsapp,
          email: "",
          plan_name: "Por definir",
          monthly_fee: 0,
          currency: "PEN" as const,
          payment_account: "other" as const,
          start_date: capturedDate,
          end_date: capturedDate,
          status: "lead" as const,
          notes: leadNote,
          created_by: "brochure-public",
          created_at: capturedAt,
          updated_at: capturedAt,
        };
        data.clients.push(lead);
        return lead;
      }),
    ]);
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
