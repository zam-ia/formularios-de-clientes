import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, readAdminData } from "@/lib/adminData";
import { calendarEventMessage, calendarShareUrl, notifyCalendarEvent } from "@/lib/calendarNotifier";

export const runtime = "nodejs";

const eventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(160),
  client_name: z.string().trim().max(140),
  type: z.enum(["recording", "meeting", "delivery", "publication", "vacation", "internal", "other"]),
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  all_day: z.boolean(),
  location: z.string().trim().max(240),
  assignees: z.array(z.string().trim().min(1).max(100)).max(12),
  description: z.string().trim().max(1600),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled"]),
  drive_url: z.string().trim().url().max(1000).or(z.literal("")),
  notify_whatsapp: z.boolean(),
}).superRefine((event, context) => {
  if (new Date(event.end_at).getTime() < new Date(event.start_at).getTime()) {
    context.addIssue({ code: "custom", path: ["end_at"], message: "La hora final debe ser posterior al inicio." });
  }
});

function decorate<T extends { id: string }>(event: T & Parameters<typeof calendarEventMessage>[0]) {
  return { ...event, share_text: calendarEventMessage(event), share_url: calendarShareUrl(event) };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAdminData();
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const events = data.calendar_events
    .filter((event) => (!from || event.end_at >= from) && (!to || event.start_at <= to))
    .toSorted((a, b) => a.start_at.localeCompare(b.start_at))
    .map(decorate);
  return NextResponse.json({ events, groupUrl: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "" });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa los datos del evento." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  const event = await mutateAdminData((data) => {
    const now = new Date().toISOString();
    const created = {
      ...parsed.data,
      id: randomUUID(),
      created_by: actor.id,
      created_by_name: actor.displayName,
      created_at: now,
      updated_at: now,
    };
    data.calendar_events.push(created);
    return created;
  });
  const notification = await notifyCalendarEvent(event);
  return NextResponse.json({ event: decorate(event), notification }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = eventSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: parsed.success ? "Falta el evento." : parsed.error.issues[0]?.message }, { status: 400 });
  try {
    const event = await mutateAdminData((data) => {
      const current = data.calendar_events.find((item) => item.id === parsed.data.id);
      if (!current) throw new Error("missing");
      Object.assign(current, parsed.data, { updated_at: new Date().toISOString() });
      return current;
    });
    const notification = await notifyCalendarEvent(event);
    return NextResponse.json({ event: decorate(event), notification });
  } catch {
    return NextResponse.json({ error: "No encontramos ese evento." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Evento inválido." }, { status: 400 });
  await mutateAdminData((data) => { data.calendar_events = data.calendar_events.filter((item) => item.id !== parsed.data.id); });
  return NextResponse.json({ success: true });
}
