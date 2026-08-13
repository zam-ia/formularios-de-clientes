import { NextResponse, type NextRequest } from "next/server";
import { allyIdFromRequest } from "@/lib/allyAuth";
import { pointsSummary, readAlliesData } from "@/lib/allies";

export async function GET(request: NextRequest) {
  const allyId = allyIdFromRequest(request);
  if (!allyId) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAlliesData();
  const ally = data.allies.find((item) => item.id === allyId);
  if (!ally || ally.status !== "approved" || ally.must_change_password) return NextResponse.json({ error: "Cuenta no disponible." }, { status: 403 });
  const movements = data.point_movements.filter((item) => item.ally_id === allyId).toSorted((a, b) => b.created_at.localeCompare(a.created_at));
  const summary = pointsSummary(data, allyId);
  return NextResponse.json({
    summary: { ...summary, status: ally.loyalty_status },
    movements,
    services: data.service_records.filter((item) => item.ally_id === allyId).toSorted((a, b) => b.period.localeCompare(a.period)),
    metrics: data.performance_metrics.filter((item) => item.ally_id === allyId).toSorted((a, b) => b.period.localeCompare(a.period)),
    rewards: data.rewards.filter((reward) => reward.active && (reward.stock === null || reward.stock > 0)).toSorted((a, b) => a.points - b.points),
    redemptions: data.redemptions.filter((item) => item.ally_id === allyId).toSorted((a, b) => b.requested_at.localeCompare(a.requested_at)),
  });
}
