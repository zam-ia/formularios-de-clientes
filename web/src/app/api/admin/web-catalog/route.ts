import { NextResponse, type NextRequest } from "next/server";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { getWebCatalog, saveWebCatalog, type WebCatalog, type WebPlan } from "@/lib/webCatalog";

function preserveCommercialFields(incoming: WebCatalog, current: WebCatalog) {
  const currentPlans = new Map([...current.services.flatMap((service) => service.plans), ...current.kits].map((plan) => [plan.id, plan]));
  const safePlan = (plan: WebPlan): WebPlan => {
    const stored = currentPlans.get(plan.id);
    return stored ? { ...plan, price: stored.price, approvalStatus: stored.approvalStatus, publicationStatus: stored.publicationStatus } : { ...plan, price: 0, approvalStatus: "draft", publicationStatus: "draft" };
  };
  return { ...incoming, services: incoming.services.map((service) => ({ ...service, plans: service.plans.map(safePlan) })), kits: incoming.kits.map(safePlan) };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const session = adminSessionFromRequest(request)!;
  return NextResponse.json({ catalog: await getWebCatalog(), canApprove: session.role === "owner" || session.role === "admin" });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  try {
    const session = adminSessionFromRequest(request)!;
    const incoming = await request.json() as WebCatalog;
    const canApprove = session.role === "owner" || session.role === "admin";
    const saved = await saveWebCatalog(canApprove ? incoming : preserveCommercialFields(incoming, await getWebCatalog()));
    return NextResponse.json({ catalog: saved, canApprove });
  } catch (error) {
    console.error("web catalog save failed", error);
    return NextResponse.json({ error: "Revisa los textos, estados y archivos antes de guardar." }, { status: 400 });
  }
}
