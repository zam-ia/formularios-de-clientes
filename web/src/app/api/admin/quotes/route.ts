import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { createPublicQuoteToken, mutateAdminData, nextQuoteNumber, readAdminData } from "@/lib/adminData";
import { PUBLIC_SITE_URL } from "@/lib/publicSiteUrl";

export const runtime = "nodejs";

const itemSchema = z.object({
  id: z.string().min(1).max(80),
  service_id: z.string().max(80).optional(),
  code: z.string().max(30).optional(),
  category: z.string().max(80).optional(),
  unit: z.string().max(80).optional(),
  base_cost: z.number().min(0).max(10_000_000).optional(),
  tax_percent: z.number().min(0).max(100).optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(800),
  quantity: z.number().positive().max(1000),
  unit_price: z.number().min(0).max(10_000_000),
  discount_percent: z.number().min(0).max(100),
  features: z.array(z.string().trim().min(1).max(240)).max(30),
});
const strategySchema = z.object({ id: z.string().min(1).max(80), title: z.string().trim().min(1).max(120), description: z.string().trim().min(1).max(1000) });
const quoteInputSchema = z.object({
  id: z.string().uuid().optional(),
  client_name: z.string().trim().min(2).max(120),
  company_name: z.string().trim().min(2).max(140),
  client_whatsapp: z.string().trim().max(30),
  client_email: z.string().trim().email().max(180).or(z.literal("")),
  title: z.string().trim().min(3).max(180),
  introduction: z.string().trim().max(1600),
  client_id: z.string().uuid().optional(),
  currency: z.enum(["PEN", "USD"]),
  items: z.array(itemSchema).min(1).max(30),
  strategies: z.array(strategySchema).max(12),
  global_discount_type: z.enum(["percent", "fixed"]),
  global_discount_value: z.number().min(0).max(10_000_000),
  tax_percent: z.number().min(0).max(100).optional(),
  valid_until: z.string().date(),
  terms: z.array(z.string().trim().min(1).max(500)).max(20),
  notes: z.string().trim().max(2000),
  status: z.enum(["draft", "sent", "accepted", "approved", "won", "lost", "rejected", "expired"]),
});
const planInputSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(800),
  price: z.number().min(0).max(10_000_000),
  billing_label: z.string().trim().max(80),
  features: z.array(z.string().trim().min(1).max(240)).max(30),
  badge: z.string().trim().max(60),
  active: z.boolean(),
});
const discountInputSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive().max(10_000_000),
  active: z.boolean(),
}).superRefine((discount, context) => {
  if (discount.type === "percent" && discount.value > 100) {
    context.addIssue({ code: "custom", path: ["value"], message: "El porcentaje no puede superar 100%." });
  }
});
const envelopeSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("quote"), data: quoteInputSchema }),
  z.object({ kind: z.literal("plan"), data: planInputSchema }),
  z.object({ kind: z.literal("discount"), data: discountInputSchema }),
]);

function quoteResponse(quote: { public_token: string } & Record<string, unknown>) {
  return { ...quote, public_url: `${PUBLIC_SITE_URL}/cotizacion/${quote.public_token}` };
}

function quoteForRole(quote: Awaited<ReturnType<typeof readAdminData>>["quotes"][number], role: string) {
  if (role !== "sales") return quoteResponse(quote);
  return quoteResponse({ ...quote, items: quote.items.map((item) => { const sanitized = { ...item }; delete sanitized.base_cost; return sanitized; }) });
}

function quoteBase(input: z.infer<typeof quoteInputSchema>) {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0);
  const discount = input.global_discount_type === "percent" ? subtotal * input.global_discount_value / 100 : Math.min(subtotal, input.global_discount_value);
  return Math.max(0, subtotal - discount);
}

function validateQuoteRules(data: Awaited<ReturnType<typeof readAdminData>>, input: z.infer<typeof quoteInputSchema>, role: string) {
  for (const item of input.items) {
    if (!item.service_id) continue;
    const service = data.catalog_services.find((current) => current.id === item.service_id);
    if (!service) throw new Error("service");
    if (role === "sales" && item.discount_percent > service.max_discount_percent) throw new Error("line-discount");
    const netUnitPrice = item.unit_price * (1 - item.discount_percent / 100);
    if (!data.commercial_settings.allow_below_cost && netUnitPrice < service.base_cost) throw new Error("below-cost");
  }
  const base = input.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0);
  const globalPercent = input.global_discount_type === "percent" ? input.global_discount_value : base ? input.global_discount_value / base * 100 : 0;
  if (role === "sales" && globalPercent > data.commercial_settings.max_global_discount_percent) throw new Error("global-discount");
}

function syncCommission(data: Awaited<ReturnType<typeof readAdminData>>, quote: typeof data.quotes[number]) {
  const existing = data.commissions.find((record) => record.quote_id === quote.id);
  if (quote.status !== "won") {
    if (existing?.status === "pending") data.commissions = data.commissions.filter((record) => record.id !== existing.id);
    return;
  }
  const baseAmount = quoteBase(quote);
  const month = quote.updated_at.slice(0, 7);
  const monthlySales = data.quotes.filter((item) => item.created_by === quote.created_by && item.status === "won" && item.updated_at.startsWith(month)).reduce((sum, item) => sum + quoteBase(item), 0);
  const lineSubtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0) || 1;
  let weightedCommission = 0;
  let weightedPercent = 0;
  const fixedRules = new Set<string>();
  for (const item of quote.items) {
    const service = item.service_id ? data.catalog_services.find((current) => current.id === item.service_id) : undefined;
    const candidates = data.commission_rules.filter((rule) => rule.active && (!rule.user_id || rule.user_id === quote.created_by) && (!rule.category_id || rule.category_id === service?.category_id));
    const rule = candidates.toSorted((a, b) => Number(Boolean(b.user_id)) * 2 + Number(Boolean(b.category_id)) - Number(Boolean(a.user_id)) * 2 - Number(Boolean(a.category_id)))[0];
    if (!rule) continue;
    const lineBase = item.quantity * item.unit_price * (1 - item.discount_percent / 100) * (baseAmount / lineSubtotal);
    const rate = rule.commission_percent + (rule.min_sales_threshold > 0 && monthlySales >= rule.min_sales_threshold ? rule.extra_percent_above_threshold : 0);
    weightedCommission += lineBase * rate / 100;
    weightedPercent += lineBase * rate;
    if (rule.fixed_amount > 0) fixedRules.add(rule.id);
  }
  const fixedAmount = [...fixedRules].reduce((sum, id) => sum + (data.commission_rules.find((rule) => rule.id === id)?.fixed_amount || 0), 0);
  const now = new Date().toISOString();
  const payload = {
    user_id: quote.created_by,
    user_name: quote.created_by_name,
    quote_id: quote.id,
    quote_number: quote.quote_number,
    base_amount: baseAmount,
    commission_percent: baseAmount ? weightedPercent / baseAmount : 0,
    fixed_amount: fixedAmount,
    commission_amount: weightedCommission + fixedAmount,
  };
  if (existing) Object.assign(existing, payload);
  else data.commissions.push({ id: randomUUID(), ...payload, status: "pending", created_at: now, paid_at: "" });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const actor = adminSessionFromRequest(request)!;
  const data = await readAdminData();
  return NextResponse.json({
    quotes: data.quotes.filter((quote) => actor.role !== "sales" || quote.created_by === actor.id).toSorted((a, b) => b.updated_at.localeCompare(a.updated_at)).map((quote) => quoteForRole(quote, actor.role)),
    plans: data.quote_plans.toSorted((a, b) => a.price - b.price),
    discounts: data.discount_rules.toSorted((a, b) => b.updated_at.localeCompare(a.updated_at)),
    services: data.catalog_services.filter((service) => service.active).map((service) => actor.role === "sales" ? { ...service, base_cost: undefined } : service),
    categories: data.service_categories.filter((category) => category.active),
    clients: data.clients.filter((client) => client.status !== "completed"),
    settings: data.commercial_settings,
    currentRole: actor.role,
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la cotización." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  if (parsed.data.kind === "plan") {
    if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Solo administración puede crear planes." }, { status: 403 });
    const planInput = parsed.data.data;
    const plan = await mutateAdminData((data) => {
      const now = new Date().toISOString();
      const created = { ...planInput, id: randomUUID(), created_at: now, updated_at: now };
      data.quote_plans.push(created);
      return created;
    });
    return NextResponse.json({ plan }, { status: 201 });
  }
  if (parsed.data.kind === "discount") {
    if (!["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Solo administración puede crear descuentos." }, { status: 403 });
    const discountInput = parsed.data.data;
    const discount = await mutateAdminData((data) => {
      const now = new Date().toISOString();
      const created = { ...discountInput, id: randomUUID(), created_at: now, updated_at: now };
      data.discount_rules.push(created);
      return created;
    });
    return NextResponse.json({ discount }, { status: 201 });
  }

  const quoteInput = parsed.data.data;
  if (actor.role === "sales" && !["draft", "sent"].includes(quoteInput.status)) return NextResponse.json({ error: "Un asesor solo puede guardar como borrador o enviada." }, { status: 403 });
  try {
    const quote = await mutateAdminData((data) => {
      validateQuoteRules(data, quoteInput, actor.role);
      const now = new Date().toISOString();
      const created = { ...quoteInput, tax_percent: quoteInput.tax_percent ?? data.commercial_settings.default_tax_percent, id: randomUUID(), public_token: createPublicQuoteToken(), quote_number: nextQuoteNumber(data.quotes), created_by: actor.id, created_by_name: actor.displayName, created_at: now, updated_at: now };
      data.quotes.push(created);
      syncCommission(data, created);
      return created;
    });
    return NextResponse.json({ quote: quoteForRole(quote, actor.role) }, { status: 201 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid";
    const messages: Record<string, string> = { service: "Uno de los servicios ya no está disponible.", "line-discount": "El descuento de un servicio supera el máximo permitido.", "below-cost": "El precio final de un servicio está por debajo del mínimo permitido.", "global-discount": "El descuento global supera tu límite permitido." };
    return NextResponse.json({ error: messages[reason] || "Revisa los valores de la cotización." }, { status: 409 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos enviados." }, { status: 400 });
  try {
    if (parsed.data.kind === "plan") {
      if (!["owner", "admin"].includes(adminSessionFromRequest(request)!.role)) return NextResponse.json({ error: "Solo administración puede modificar planes." }, { status: 403 });
      if (!parsed.data.data.id) throw new Error("missing");
      const planInput = parsed.data.data;
      const plan = await mutateAdminData((data) => {
        const current = data.quote_plans.find((item) => item.id === planInput.id);
        if (!current) throw new Error("missing");
        Object.assign(current, planInput, { updated_at: new Date().toISOString() });
        return current;
      });
      return NextResponse.json({ plan });
    }
    if (parsed.data.kind === "discount") {
      if (!["owner", "admin"].includes(adminSessionFromRequest(request)!.role)) return NextResponse.json({ error: "Solo administración puede modificar descuentos." }, { status: 403 });
      if (!parsed.data.data.id) throw new Error("missing");
      const discountInput = parsed.data.data;
      const discount = await mutateAdminData((data) => {
        const current = data.discount_rules.find((item) => item.id === discountInput.id);
        if (!current) throw new Error("missing");
        Object.assign(current, discountInput, { updated_at: new Date().toISOString() });
        return current;
      });
      return NextResponse.json({ discount });
    }

    if (!parsed.data.data.id) throw new Error("missing");
    const quoteInput = parsed.data.data;
    const actor = adminSessionFromRequest(request)!;
    if (actor.role === "sales" && !["draft", "sent"].includes(quoteInput.status)) return NextResponse.json({ error: "Un asesor no puede marcar una venta como ganada." }, { status: 403 });
    const quote = await mutateAdminData((data) => {
      const current = data.quotes.find((item) => item.id === quoteInput.id);
      if (!current) throw new Error("missing");
      if (actor.role === "sales" && current.created_by !== actor.id) throw new Error("forbidden");
      validateQuoteRules(data, quoteInput, actor.role);
      Object.assign(current, quoteInput, { tax_percent: quoteInput.tax_percent ?? data.commercial_settings.default_tax_percent, updated_at: new Date().toISOString() });
      syncCommission(data, current);
      return current;
    });
    return NextResponse.json({ quote: quoteForRole(quote, adminSessionFromRequest(request)!.role) });
  } catch (error) {
    const reason = error instanceof Error ? error.message : "missing";
    const messages: Record<string, string> = { forbidden: "Solo puedes modificar tus propias cotizaciones.", service: "Uno de los servicios ya no está disponible.", "line-discount": "El descuento de un servicio supera el máximo permitido.", "below-cost": "El precio final de un servicio está por debajo del mínimo permitido.", "global-discount": "El descuento global supera tu límite permitido." };
    return NextResponse.json({ error: messages[reason] || "No encontramos el registro que quieres actualizar." }, { status: reason === "missing" ? 404 : 409 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = z.object({ kind: z.enum(["quote", "plan", "discount"]), id: z.string().min(1).max(80) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Registro inválido." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  if (parsed.data.kind !== "quote" && !["owner", "admin"].includes(actor.role)) return NextResponse.json({ error: "Solo administración puede eliminar este registro." }, { status: 403 });
  try {
    await mutateAdminData((data) => {
      if (parsed.data.kind === "quote") {
        const quote = data.quotes.find((item) => item.id === parsed.data.id);
        if (actor.role === "sales" && quote?.created_by !== actor.id) throw new Error("forbidden");
        data.quotes = data.quotes.filter((item) => item.id !== parsed.data.id);
        data.commissions = data.commissions.filter((record) => record.quote_id !== parsed.data.id || record.status === "paid");
      }
      else if (parsed.data.kind === "plan") data.quote_plans = data.quote_plans.filter((item) => item.id !== parsed.data.id);
      else data.discount_rules = data.discount_rules.filter((item) => item.id !== parsed.data.id);
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Solo puedes eliminar tus propias cotizaciones." }, { status: 403 });
  }
}
