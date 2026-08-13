import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import { mutateAlliesData, pointsSummary, readAlliesData } from "@/lib/allies";

const serviceSchema = z.object({
  action: z.literal("service"),
  allyId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  plan: z.string().trim().min(2).max(120),
  services: z.string().trim().min(2).max(500),
  amountPaid: z.number().nonnegative().max(1_000_000),
  notes: z.string().trim().max(500).default(""),
});
const adjustmentSchema = z.object({
  action: z.literal("adjustment"),
  allyId: z.string().uuid(),
  points: z.number().int().min(-100_000).max(100_000).refine((value) => value !== 0),
  reference: z.string().trim().min(2).max(180),
});
const metricSchema = z.object({
  action: z.literal("metric"),
  allyId: z.string().uuid(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  reach: z.number().int().nonnegative(),
  audience: z.number().int().nonnegative(),
  audienceGrowth: z.number().min(-100).max(10000),
  organicGrowth: z.number().min(-100).max(10000),
  engagement: z.number().min(0).max(100),
  leads: z.number().int().nonnegative(),
  sales: z.number().int().nonnegative().nullable(),
  revenue: z.number().nonnegative().nullable(),
  adSpend: z.number().nonnegative().nullable(),
  notes: z.string().trim().max(700).default(""),
});
const rewardSchema = z.object({
  action: z.literal("reward"),
  id: z.string().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(500),
  category: z.string().trim().min(2).max(60),
  points: z.number().int().positive().max(100_000),
  active: z.boolean(),
  stock: z.number().int().nonnegative().nullable(),
  imageUrl: z.string().url().nullable(),
});
const redemptionSchema = z.object({
  action: z.literal("redemption"),
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "delivered"]),
  note: z.string().trim().max(500).default(""),
});
const loyaltySchema = z.object({
  action: z.literal("loyalty-status"),
  allyId: z.string().uuid(),
  status: z.enum(["active", "frozen"]),
});
const bodySchema = z.discriminatedUnion("action", [serviceSchema, adjustmentSchema, metricSchema, rewardSchema, redemptionSchema, loyaltySchema]);

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAlliesData();
  return NextResponse.json({
    allies: data.allies.map((ally) => ({
      id: ally.id,
      businessName: ally.business_name,
      status: ally.status,
      loyaltyStatus: ally.loyalty_status,
      ...pointsSummary(data, ally.id),
      services: data.service_records.filter((record) => record.ally_id === ally.id).length,
      metrics: data.performance_metrics.filter((metric) => metric.ally_id === ally.id).length,
    })),
    movements: data.point_movements.toSorted((a, b) => b.created_at.localeCompare(a.created_at)),
    services: data.service_records.toSorted((a, b) => b.period.localeCompare(a.period)),
    metrics: data.performance_metrics.toSorted((a, b) => b.period.localeCompare(a.period)),
    rewards: data.rewards.toSorted((a, b) => a.points - b.points),
    redemptions: data.redemptions.toSorted((a, b) => b.requested_at.localeCompare(a.requested_at)),
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos enviados." }, { status: 400 });
  const input = parsed.data;
  try {
    await mutateAlliesData((data) => {
      const now = new Date().toISOString();
      if (input.action === "reward") {
        const existing = input.id ? data.rewards.find((reward) => reward.id === input.id) : null;
        if (existing) Object.assign(existing, { title: input.title, description: input.description, category: input.category, points: input.points, active: input.active, stock: input.stock, image_url: input.imageUrl, updated_at: now });
        else data.rewards.push({ id: randomUUID(), title: input.title, description: input.description, category: input.category, points: input.points, active: input.active, stock: input.stock, image_url: input.imageUrl, created_at: now, updated_at: now });
        return;
      }
      if (input.action === "redemption") {
        const redemption = data.redemptions.find((item) => item.id === input.id);
        if (!redemption) throw new Error("missing-redemption");
        if ((input.status === "approved" || input.status === "rejected") && redemption.status !== "pending") throw new Error("invalid-transition");
        if (input.status === "delivered" && redemption.status !== "approved") throw new Error("invalid-transition");
        if (input.status === "approved" && redemption.status === "pending") {
          const summary = pointsSummary(data, redemption.ally_id);
          if (summary.balance < redemption.points) throw new Error("insufficient");
          data.point_movements.push({ id: randomUUID(), ally_id: redemption.ally_id, type: "redeemed", points: -redemption.points, reference: `Canje aprobado: ${redemption.reward_title}`, service_record_id: null, expires_at: null, created_at: now });
          const reward = data.rewards.find((item) => item.id === redemption.reward_id);
          if (reward?.stock !== null && reward?.stock !== undefined) reward.stock = Math.max(0, reward.stock - 1);
        }
        redemption.status = input.status;
        redemption.note = input.note;
        redemption.updated_at = now;
        return;
      }
      const ally = data.allies.find((item) => item.id === input.allyId);
      if (!ally) throw new Error("missing-ally");
      if (input.action === "loyalty-status") {
        ally.loyalty_status = input.status;
        ally.updated_at = now;
        return;
      }
      if (input.action === "service") {
        const id = randomUUID();
        const points = Math.floor(input.amountPaid / 10);
        data.service_records.push({ id, ally_id: ally.id, period: input.period, plan: input.plan, services: input.services, amount_paid: input.amountPaid, points_awarded: points, notes: input.notes, created_at: now });
        if (points > 0) {
          const expires = new Date();
          expires.setMonth(expires.getMonth() + 12);
          data.point_movements.push({ id: randomUUID(), ally_id: ally.id, type: "earned", points, reference: `${input.plan} · ${input.period}`, service_record_id: id, expires_at: expires.toISOString(), created_at: now });
        }
        return;
      }
      if (input.action === "adjustment") {
        data.point_movements.push({ id: randomUUID(), ally_id: ally.id, type: "adjustment", points: input.points, reference: input.reference, service_record_id: null, expires_at: null, created_at: now });
        return;
      }
      const roi = input.revenue !== null && input.adSpend ? ((input.revenue - input.adSpend) / input.adSpend) * 100 : null;
      const current = data.performance_metrics.find((metric) => metric.ally_id === ally.id && metric.period === input.period);
      const metric = { ally_id: ally.id, period: input.period, reach: input.reach, audience: input.audience, audience_growth: input.audienceGrowth, organic_growth: input.organicGrowth, engagement: input.engagement, leads: input.leads, sales: input.sales, revenue: input.revenue, ad_spend: input.adSpend, roi, notes: input.notes };
      if (current) Object.assign(current, metric);
      else data.performance_metrics.push({ ...metric, id: randomUUID(), created_at: now });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    const text = message === "insufficient" ? "El aliado ya no tiene puntos suficientes." : "No pudimos guardar el cambio.";
    return NextResponse.json({ error: text }, { status: message === "insufficient" ? 409 : 400 });
  }
}
