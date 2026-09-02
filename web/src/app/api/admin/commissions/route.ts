import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, publicAdminUser, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const ruleSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().max(80),
  category_id: z.string().max(80),
  commission_percent: z.number().min(0).max(100),
  fixed_amount: z.number().min(0).max(1_000_000),
  min_sales_threshold: z.number().min(0).max(10_000_000),
  extra_percent_above_threshold: z.number().min(0).max(100),
  active: z.boolean(),
});
const envelopeSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("rule"), data: ruleSchema }),
  z.object({ action: z.literal("payment"), id: z.string().uuid(), status: z.enum(["pending", "paid"]) }),
]);

function canManage(request: NextRequest) { return ["owner", "admin", "supervisor"].includes(adminSessionFromRequest(request)?.role || ""); }

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const actor = adminSessionFromRequest(request)!;
  const data = await readAdminData();
  const records = actor.role === "sales" ? data.commissions.filter((record) => record.user_id === actor.id) : data.commissions;
  const rules = actor.role === "sales" ? data.commission_rules.filter((rule) => !rule.user_id || rule.user_id === actor.id) : data.commission_rules;
  return NextResponse.json({
    records: records.toSorted((a, b) => b.created_at.localeCompare(a.created_at)),
    rules: rules.toSorted((a, b) => b.updated_at.localeCompare(a.updated_at)),
    users: data.users.filter((user) => user.active && ["sales", "supervisor", "admin"].includes(user.role)).map(publicAdminUser),
    categories: data.service_categories.filter((category) => category.active),
    currentUserId: actor.id,
    canManage: canManage(request),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canManage(request)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa la regla de comisión." }, { status: 400 });
  const envelope = parsed.data;
  if (envelope.action === "payment") {
    const payment = envelope;
    try {
      const record = await mutateAdminData((data) => {
        const current = data.commissions.find((item) => item.id === payment.id);
        if (!current) throw new Error("missing");
        current.status = payment.status;
        current.paid_at = payment.status === "paid" ? new Date().toISOString() : "";
        return current;
      });
      return NextResponse.json({ record });
    } catch {
      return NextResponse.json({ error: "No encontramos esa comisión." }, { status: 404 });
    }
  }
  const ruleInput = envelope.data;
  const rule = await mutateAdminData((data) => {
    const now = new Date().toISOString();
    const created = { ...ruleInput, id: randomUUID(), created_at: now, updated_at: now };
    data.commission_rules.push(created);
    return created;
  });
  return NextResponse.json({ rule }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canManage(request)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = z.object({ action: z.literal("rule"), data: ruleSchema }).safeParse(await request.json());
  if (!parsed.success || !parsed.data.data.id) return NextResponse.json({ error: "Regla inválida." }, { status: 400 });
  try {
    const rule = await mutateAdminData((data) => {
      const current = data.commission_rules.find((item) => item.id === parsed.data.data.id);
      if (!current) throw new Error("missing");
      Object.assign(current, parsed.data.data, { updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ rule });
  } catch {
    return NextResponse.json({ error: "No encontramos esa regla." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canManage(request)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Regla inválida." }, { status: 400 });
  await mutateAdminData((data) => { data.commission_rules = data.commission_rules.filter((rule) => rule.id !== parsed.data.id); });
  return NextResponse.json({ success: true });
}
