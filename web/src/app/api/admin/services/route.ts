import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const serviceSchema = z.object({
  id: z.string().max(80).optional(),
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  category_id: z.string().min(1).max(80),
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1200),
  unit: z.string().trim().min(2).max(80),
  base_cost: z.number().min(0).max(10_000_000),
  suggested_price: z.number().min(0).max(10_000_000),
  estimated_time: z.string().trim().max(80),
  tax_percent: z.number().min(0).max(100),
  max_discount_percent: z.number().min(0).max(100),
  active: z.boolean(),
}).superRefine((service, context) => {
  if (service.suggested_price < service.base_cost) context.addIssue({ code: "custom", path: ["suggested_price"], message: "El precio sugerido no puede ser menor al costo base." });
});
const categorySchema = z.object({ id: z.string().max(80).optional(), name: z.string().trim().min(2).max(80), description: z.string().trim().max(400), active: z.boolean() });
const settingsSchema = z.object({ default_tax_percent: z.number().min(0).max(100), max_global_discount_percent: z.number().min(0).max(100), allow_below_cost: z.boolean() });
const envelopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("service"), data: serviceSchema }),
  z.object({ kind: z.literal("category"), data: categorySchema }),
  z.object({ kind: z.literal("settings"), data: settingsSchema }),
]);

function canManage(request: NextRequest) {
  return ["owner", "admin"].includes(adminSessionFromRequest(request)?.role || "");
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const actor = adminSessionFromRequest(request)!;
  const data = await readAdminData();
  const services = data.catalog_services.toSorted((a, b) => a.name.localeCompare(b.name)).map((service) => actor.role === "sales" ? { ...service, base_cost: undefined } : service);
  return NextResponse.json({ services, categories: data.service_categories.toSorted((a, b) => a.name.localeCompare(b.name)), settings: data.commercial_settings, canManage: canManage(request) });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canManage(request)) return NextResponse.json({ error: "Solo administración puede crear servicios." }, { status: 403 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success || parsed.data.kind === "settings") return NextResponse.json({ error: parsed.success ? "Configuración inválida." : parsed.error.issues[0]?.message }, { status: 400 });
  const envelope = parsed.data;
  try {
    if (envelope.kind === "category") {
      const categoryInput = envelope.data;
      const category = await mutateAdminData((data) => {
        const now = new Date().toISOString();
        const created = { ...categoryInput, id: randomUUID(), created_at: now, updated_at: now };
        data.service_categories.push(created);
        return created;
      });
      return NextResponse.json({ item: category }, { status: 201 });
    }
    const serviceInput = envelope.data;
    const created = await mutateAdminData((data) => {
      const now = new Date().toISOString();
      if (!data.service_categories.some((category) => category.id === serviceInput.category_id)) throw new Error("category");
      if (data.catalog_services.some((service) => service.code === serviceInput.code)) throw new Error("code");
      const service = { ...serviceInput, id: randomUUID(), created_at: now, updated_at: now };
      data.catalog_services.push(service);
      return service;
    });
    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "code" ? "Ya existe un servicio con ese código." : "Selecciona una categoría válida." }, { status: 409 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canManage(request)) return NextResponse.json({ error: "Solo administración puede modificar el catálogo." }, { status: 403 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa los datos." }, { status: 400 });
  const envelope = parsed.data;
  try {
    if (envelope.kind === "settings") {
      const settings = await mutateAdminData((data) => {
        data.commercial_settings = envelope.data;
        return data.commercial_settings;
      });
      return NextResponse.json({ item: settings });
    }
    if (!envelope.data.id) throw new Error("missing");
    if (envelope.kind === "category") {
      const categoryInput = envelope.data;
      const category = await mutateAdminData((data) => {
        const current = data.service_categories.find((item) => item.id === categoryInput.id);
        if (!current) throw new Error("missing");
        Object.assign(current, categoryInput, { updated_at: new Date().toISOString() });
        return current;
      });
      return NextResponse.json({ item: category });
    }
    const serviceInput = envelope.data;
    const updated = await mutateAdminData((data) => {
      const now = new Date().toISOString();
      if (!data.service_categories.some((category) => category.id === serviceInput.category_id)) throw new Error("category");
      if (data.catalog_services.some((service) => service.code === serviceInput.code && service.id !== serviceInput.id)) throw new Error("code");
      const current = data.catalog_services.find((item) => item.id === serviceInput.id);
      if (!current) throw new Error("missing");
      Object.assign(current, serviceInput, { updated_at: now });
      return current;
    });
    return NextResponse.json({ item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "missing";
    return NextResponse.json({ error: message === "code" ? "Ya existe un servicio con ese código." : message === "category" ? "Selecciona una categoría válida." : "No encontramos ese registro." }, { status: message === "missing" ? 404 : 409 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canManage(request)) return NextResponse.json({ error: "Solo administración puede desactivar servicios." }, { status: 403 });
  const parsed = z.object({ kind: z.enum(["service", "category"]), id: z.string().min(1).max(80) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Registro inválido." }, { status: 400 });
  await mutateAdminData((data) => {
    if (parsed.data.kind === "service") {
      const service = data.catalog_services.find((item) => item.id === parsed.data.id);
      if (service) { service.active = false; service.updated_at = new Date().toISOString(); }
    } else {
      const category = data.service_categories.find((item) => item.id === parsed.data.id);
      if (category) { category.active = false; category.updated_at = new Date().toISOString(); }
      data.catalog_services.forEach((service) => { if (service.category_id === parsed.data.id) service.active = false; });
    }
  });
  return NextResponse.json({ success: true });
}
