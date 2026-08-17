import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { createPublicQuoteToken, mutateAdminData, nextQuoteNumber, readAdminData } from "@/lib/adminData";
import { PUBLIC_SITE_URL } from "@/lib/publicSiteUrl";

export const runtime = "nodejs";

const itemSchema = z.object({
  id: z.string().min(1).max(80),
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
  currency: z.enum(["PEN", "USD"]),
  items: z.array(itemSchema).min(1).max(30),
  strategies: z.array(strategySchema).max(12),
  global_discount_type: z.enum(["percent", "fixed"]),
  global_discount_value: z.number().min(0).max(10_000_000),
  valid_until: z.string().date(),
  terms: z.array(z.string().trim().min(1).max(500)).max(20),
  notes: z.string().trim().max(2000),
  status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]),
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

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAdminData();
  return NextResponse.json({
    quotes: data.quotes.toSorted((a, b) => b.updated_at.localeCompare(a.updated_at)).map(quoteResponse),
    plans: data.quote_plans.toSorted((a, b) => a.price - b.price),
    discounts: data.discount_rules.toSorted((a, b) => b.updated_at.localeCompare(a.updated_at)),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos de la cotización." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  if (parsed.data.kind === "plan") {
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
  const quote = await mutateAdminData((data) => {
    const now = new Date().toISOString();
    const created = {
      ...quoteInput,
      id: randomUUID(),
      public_token: createPublicQuoteToken(),
      quote_number: nextQuoteNumber(data.quotes),
      created_by: actor.id,
      created_by_name: actor.displayName,
      created_at: now,
      updated_at: now,
    };
    data.quotes.push(created);
    return created;
  });
  return NextResponse.json({ quote: quoteResponse(quote) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = envelopeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos enviados." }, { status: 400 });
  try {
    if (parsed.data.kind === "plan") {
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
    const quote = await mutateAdminData((data) => {
      const current = data.quotes.find((item) => item.id === quoteInput.id);
      if (!current) throw new Error("missing");
      Object.assign(current, quoteInput, { updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ quote: quoteResponse(quote) });
  } catch {
    return NextResponse.json({ error: "No encontramos el registro que quieres actualizar." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = z.object({ kind: z.enum(["quote", "plan", "discount"]), id: z.string().min(1).max(80) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Registro inválido." }, { status: 400 });
  await mutateAdminData((data) => {
    if (parsed.data.kind === "quote") data.quotes = data.quotes.filter((item) => item.id !== parsed.data.id);
    else if (parsed.data.kind === "plan") data.quote_plans = data.quote_plans.filter((item) => item.id !== parsed.data.id);
    else data.discount_rules = data.discount_rules.filter((item) => item.id !== parsed.data.id);
  });
  return NextResponse.json({ success: true });
}
