import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { allyIdFromRequest, sameOrigin } from "@/lib/allyAuth";
import { mutateAlliesData, pointsSummary } from "@/lib/allies";

const schema = z.object({ rewardId: z.string().min(1).max(120) });

export async function POST(request: NextRequest) {
  const allyId = allyIdFromRequest(request);
  if (!allyId || !sameOrigin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Premio inválido." }, { status: 400 });
  try {
    await mutateAlliesData((data) => {
      const ally = data.allies.find((item) => item.id === allyId);
      if (!ally || ally.status !== "approved" || ally.loyalty_status !== "active") throw new Error("frozen");
      const reward = data.rewards.find((item) => item.id === parsed.data.rewardId && item.active);
      if (!reward || reward.stock === 0) throw new Error("missing");
      const summary = pointsSummary(data, allyId);
      if (summary.available < reward.points) throw new Error("insufficient");
      const now = new Date().toISOString();
      data.redemptions.push({ id: randomUUID(), ally_id: allyId, reward_id: reward.id, reward_title: reward.title, points: reward.points, status: "pending", note: "", requested_at: now, updated_at: now });
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "unknown";
    const message = code === "insufficient" ? "Todavía no tienes puntos suficientes." : code === "frozen" ? "Tus puntos están congelados. Escríbenos para revisar tu cuenta." : "Este premio ya no está disponible.";
    return NextResponse.json({ error: message }, { status: code === "insufficient" ? 409 : 400 });
  }
}
