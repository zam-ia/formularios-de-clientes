import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const entrySchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]),
  date: z.string().date(),
  amount: z.number().positive().max(10_000_000),
  currency: z.enum(["PEN", "USD"]),
  account: z.enum(["bcp", "bbva", "interbank", "cash", "other"]),
  category: z.string().trim().min(2).max(100),
  client_id: z.string().uuid().or(z.literal("")),
  description: z.string().trim().min(2).max(500),
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAdminData();
  return NextResponse.json({
    entries: data.finance_entries.toSorted((a, b) => b.date.localeCompare(a.date)),
    clients: data.clients.toSorted((a, b) => a.company_name.localeCompare(b.company_name)),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = entrySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa el movimiento." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  try {
    const entry = await mutateAdminData((data) => {
      if (parsed.data.client_id && !data.clients.some((client) => client.id === parsed.data.client_id)) throw new Error("client");
      const now = new Date().toISOString();
      const created = { ...parsed.data, id: randomUUID(), created_by: actor.id, created_by_name: actor.displayName, created_at: now, updated_at: now };
      data.finance_entries.push(created);
      return created;
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "client") return NextResponse.json({ error: "El cliente seleccionado ya no existe." }, { status: 400 });
    throw error;
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = entrySchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: parsed.success ? "Falta el movimiento." : parsed.error.issues[0]?.message }, { status: 400 });
  try {
    const input = parsed.data;
    const entry = await mutateAdminData((data) => {
      const current = data.finance_entries.find((item) => item.id === input.id);
      if (!current) throw new Error("missing");
      Object.assign(current, input, { updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ entry });
  } catch {
    return NextResponse.json({ error: "No encontramos ese movimiento." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Movimiento inválido." }, { status: 400 });
  await mutateAdminData((data) => { data.finance_entries = data.finance_entries.filter((entry) => entry.id !== parsed.data.id); });
  return NextResponse.json({ success: true });
}
