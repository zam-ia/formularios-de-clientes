import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const clientSchema = z.object({
  id: z.string().uuid().optional(),
  company_name: z.string().trim().min(2).max(160),
  contact_name: z.string().trim().min(2).max(140),
  whatsapp: z.string().trim().max(30),
  email: z.string().trim().email().max(180).or(z.literal("")),
  plan_name: z.string().trim().min(2).max(120),
  monthly_fee: z.number().min(0).max(10_000_000),
  currency: z.enum(["PEN", "USD"]),
  payment_account: z.enum(["bcp", "bbva", "interbank", "cash", "other"]),
  start_date: z.string().date(),
  end_date: z.string().date(),
  status: z.enum(["lead", "active", "paused", "completed"]),
  notes: z.string().trim().max(2000),
}).superRefine((client, context) => {
  if (client.end_date < client.start_date) {
    context.addIssue({ code: "custom", path: ["end_date"], message: "La fecha final del plan debe ser posterior al inicio." });
  }
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAdminData();
  return NextResponse.json({
    clients: data.clients.toSorted((a, b) => a.company_name.localeCompare(b.company_name)),
    plans: data.quote_plans.filter((plan) => plan.active),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (adminSessionFromRequest(request)?.role === "finance") return NextResponse.json({ error: "El rol Finanzas puede consultar clientes, pero no modificarlos." }, { status: 403 });
  const parsed = clientSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa los datos del cliente." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  const client = await mutateAdminData((data) => {
    const now = new Date().toISOString();
    const created = { ...parsed.data, id: randomUUID(), created_by: actor.id, created_at: now, updated_at: now };
    data.clients.push(created);
    return created;
  });
  return NextResponse.json({ client }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (adminSessionFromRequest(request)?.role === "finance") return NextResponse.json({ error: "El rol Finanzas puede consultar clientes, pero no modificarlos." }, { status: 403 });
  const parsed = clientSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: parsed.success ? "Falta el cliente." : parsed.error.issues[0]?.message }, { status: 400 });
  try {
    const input = parsed.data;
    const client = await mutateAdminData((data) => {
      const current = data.clients.find((item) => item.id === input.id);
      if (!current) throw new Error("missing");
      Object.assign(current, input, { updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: "No encontramos ese cliente." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (adminSessionFromRequest(request)?.role === "finance") return NextResponse.json({ error: "El rol Finanzas puede consultar clientes, pero no modificarlos." }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
  try {
    await mutateAdminData((data) => {
      const linked = data.finance_entries.some((entry) => entry.client_id === parsed.data.id) || data.calendar_events.some((event) => event.client_id === parsed.data.id) || data.project_tasks.some((task) => task.client_id === parsed.data.id);
      if (linked) throw new Error("linked");
      data.clients = data.clients.filter((client) => client.id !== parsed.data.id);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Este cliente ya tiene movimientos o actividades. Cámbialo a Finalizado para conservar su historial." }, { status: 409 });
  }
}
