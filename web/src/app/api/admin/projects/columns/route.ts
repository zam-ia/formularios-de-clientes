import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData } from "@/lib/adminData";

export const runtime = "nodejs";
const columnSchema = z.object({ id: z.string().min(1).max(80).optional(), name: z.string().trim().min(2).max(80), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) });

function canConfigure(request: NextRequest) { return adminSessionFromRequest(request)?.role !== "collaborator"; }

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canConfigure(request)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = columnSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa el nombre y color de la etapa." }, { status: 400 });
  const column = await mutateAdminData((data) => {
    const created = { id: randomUUID(), name: parsed.data.name, color: parsed.data.color, order: data.project_columns.length };
    data.project_columns.push(created);
    return created;
  });
  return NextResponse.json({ column }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canConfigure(request)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = columnSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
  try {
    const column = await mutateAdminData((data) => {
      const current = data.project_columns.find((item) => item.id === parsed.data.id);
      if (!current) throw new Error("missing");
      Object.assign(current, { name: parsed.data.name, color: parsed.data.color });
      return current;
    });
    return NextResponse.json({ column });
  } catch {
    return NextResponse.json({ error: "No encontramos esa etapa." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true) || !canConfigure(request)) return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  const parsed = z.object({ id: z.string().min(1).max(80) }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
  try {
    await mutateAdminData((data) => {
      if (data.project_columns.length <= 2) throw new Error("minimum");
      const fallback = data.project_columns.find((column) => column.id !== parsed.data.id);
      if (!fallback) throw new Error("minimum");
      data.project_tasks.forEach((task) => { if (task.column_id === parsed.data.id) task.column_id = fallback.id; });
      data.project_columns = data.project_columns.filter((column) => column.id !== parsed.data.id).map((column, index) => ({ ...column, order: index }));
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "El flujo debe conservar al menos dos etapas." }, { status: 409 });
  }
}
