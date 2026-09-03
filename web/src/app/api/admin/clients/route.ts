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
  monthly_fee: z.number().int().min(0).max(10_000_000),
  currency: z.enum(["PEN", "USD"]),
  payment_account: z.enum(["bcp", "bbva", "interbank", "cash", "other"]),
  start_date: z.string().date(),
  end_date: z.string().date(),
  status: z.enum(["lead", "active", "paused", "completed"]),
  notes: z.string().trim().max(2000),
  advisor_id: z.string().max(80).optional().default(""),
  advisor_name: z.string().trim().max(140).optional().default(""),
}).superRefine((client, context) => {
  if (client.end_date < client.start_date) {
    context.addIssue({ code: "custom", path: ["end_date"], message: "La fecha final del plan debe ser posterior al inicio." });
  }
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const actor = adminSessionFromRequest(request)!;
  const data = await readAdminData();
  const advisors = data.users
    .filter((user) => user.active && ["sales", "supervisor", "admin", "owner"].includes(user.role))
    .map((user) => ({ id: user.id, displayName: user.display_name, role: user.role }));
  if (!advisors.some((user) => user.id === "environment-owner")) advisors.unshift({ id: "environment-owner", displayName: "Crisdal Agency", role: "owner" });
  if (!advisors.some((user) => user.id === actor.id) && ["owner", "admin", "supervisor", "sales"].includes(actor.role)) {
    advisors.unshift({ id: actor.id, displayName: actor.displayName, role: actor.role });
  }
  const clients = actor.role === "sales"
    ? data.clients.filter((client) => (client.advisor_id || client.created_by) === actor.id)
    : data.clients;
  return NextResponse.json({
    clients: clients.toSorted((a, b) => a.company_name.localeCompare(b.company_name)),
    plans: data.quote_plans.filter((plan) => plan.active),
    advisors,
    canAssign: ["owner", "admin", "supervisor"].includes(actor.role),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (adminSessionFromRequest(request)?.role === "finance") return NextResponse.json({ error: "El rol Finanzas puede consultar clientes, pero no modificarlos." }, { status: 403 });
  const parsed = clientSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa los datos del cliente." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  try {
    const client = await mutateAdminData((data) => {
      const now = new Date().toISOString();
      const requestedAdvisorId = actor.role === "sales" ? actor.id : (["owner", "admin", "supervisor"].includes(actor.role) ? parsed.data.advisor_id : "");
      const assignedUser = data.users.find((user) => user.id === requestedAdvisorId && user.active && ["sales", "supervisor", "admin", "owner"].includes(user.role));
      const advisorName = requestedAdvisorId === actor.id ? actor.displayName : requestedAdvisorId === "environment-owner" ? "Crisdal Agency" : assignedUser?.display_name || "";
      if (requestedAdvisorId && !advisorName) throw new Error("advisor");
      const created = { ...parsed.data, advisor_id: requestedAdvisorId, advisor_name: advisorName, id: randomUUID(), created_by: actor.id, created_at: now, updated_at: now };
      data.clients.push(created);
      return created;
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "advisor") return NextResponse.json({ error: "El asesor seleccionado no está disponible." }, { status: 409 });
    return NextResponse.json({ error: "No pudimos guardar el cliente. Intenta nuevamente." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (adminSessionFromRequest(request)?.role === "finance") return NextResponse.json({ error: "El rol Finanzas puede consultar clientes, pero no modificarlos." }, { status: 403 });
  const parsed = clientSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: parsed.success ? "Falta el cliente." : parsed.error.issues[0]?.message }, { status: 400 });
  try {
    const input = parsed.data;
    const actor = adminSessionFromRequest(request)!;
    const client = await mutateAdminData((data) => {
      const current = data.clients.find((item) => item.id === input.id);
      if (!current) throw new Error("missing");
      if (actor.role === "sales" && (current.advisor_id || current.created_by) !== actor.id) throw new Error("forbidden");
      const canAssign = ["owner", "admin", "supervisor"].includes(actor.role);
      const requestedAdvisorId = actor.role === "sales" ? actor.id : (canAssign ? input.advisor_id : current.advisor_id || "");
      const assignedUser = data.users.find((user) => user.id === requestedAdvisorId && user.active && ["sales", "supervisor", "admin", "owner"].includes(user.role));
      const advisorName = requestedAdvisorId === actor.id ? actor.displayName : requestedAdvisorId === "environment-owner" ? "Crisdal Agency" : assignedUser?.display_name || (requestedAdvisorId === current.advisor_id ? current.advisor_name : "") || "";
      if (requestedAdvisorId && !advisorName) throw new Error("advisor");
      Object.assign(current, input, { advisor_id: requestedAdvisorId, advisor_name: advisorName, updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ client });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "missing";
    if (reason === "forbidden") return NextResponse.json({ error: "Solo puedes modificar tus clientes asignados." }, { status: 403 });
    if (reason === "advisor") return NextResponse.json({ error: "El asesor seleccionado no está disponible." }, { status: 409 });
    return NextResponse.json({ error: "No encontramos ese cliente." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  if (adminSessionFromRequest(request)?.role === "finance") return NextResponse.json({ error: "El rol Finanzas puede consultar clientes, pero no modificarlos." }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Cliente inválido." }, { status: 400 });
  try {
    const actor = adminSessionFromRequest(request)!;
    await mutateAdminData((data) => {
      const current = data.clients.find((client) => client.id === parsed.data.id);
      if (!current) throw new Error("missing");
      if (actor.role === "sales" && (current.advisor_id || current.created_by) !== actor.id) throw new Error("forbidden");
      const linked = data.finance_entries.some((entry) => entry.client_id === parsed.data.id) || data.calendar_events.some((event) => event.client_id === parsed.data.id) || data.project_tasks.some((task) => task.client_id === parsed.data.id);
      if (linked) throw new Error("linked");
      data.clients = data.clients.filter((client) => client.id !== parsed.data.id);
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") return NextResponse.json({ error: "Solo puedes eliminar tus clientes asignados." }, { status: 403 });
    return NextResponse.json({ error: "Este cliente ya tiene movimientos o actividades. Cámbialo a Finalizado para conservar su historial." }, { status: 409 });
  }
}
