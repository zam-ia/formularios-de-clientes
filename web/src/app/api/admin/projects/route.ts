import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, publicAdminUser, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const checklistSchema = z.object({ id: z.string().min(1).max(80), text: z.string().trim().min(1).max(240), completed: z.boolean() });
const taskSchema = z.object({
  id: z.string().uuid().optional(),
  client_id: z.string().uuid(),
  column_id: z.string().min(1).max(80),
  title: z.string().trim().min(2).max(180),
  description: z.string().trim().max(3000),
  content_type: z.string().trim().min(2).max(80),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.string().date().or(z.literal("")),
  assignees: z.array(z.string().min(1).max(80)).max(20),
  labels: z.array(z.string().trim().min(1).max(40)).max(12),
  checklist: z.array(checklistSchema).max(40),
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const actor = adminSessionFromRequest(request)!;
  const data = await readAdminData();
  const users = data.users.filter((user) => user.active).map(publicAdminUser);
  if (!users.some((user) => user.id === actor.id)) users.unshift({ id: actor.id, username: actor.username, displayName: actor.displayName, email: null, role: actor.role, active: true, lastLoginAt: null, createdAt: "" });
  const tasks = actor.role === "collaborator" ? data.project_tasks.filter((task) => task.assignees.includes(actor.id)) : data.project_tasks;
  return NextResponse.json({
    columns: data.project_columns.toSorted((a, b) => a.order - b.order),
    tasks: tasks.toSorted((a, b) => a.due_date.localeCompare(b.due_date)),
    clients: data.clients.filter((client) => client.status !== "completed").toSorted((a, b) => a.company_name.localeCompare(b.company_name)),
    users: users.toSorted((a, b) => a.displayName.localeCompare(b.displayName)),
    currentUserId: actor.id,
    readOnly: false,
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa los datos de la tarea." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  if (actor.role === "collaborator") return NextResponse.json({ error: "Tu rol permite actualizar tareas asignadas, pero no crear nuevas." }, { status: 403 });
  try {
    const task = await mutateAdminData((data) => {
      if (!data.clients.some((client) => client.id === parsed.data.client_id) || !data.project_columns.some((column) => column.id === parsed.data.column_id)) throw new Error("invalid-link");
      const now = new Date().toISOString();
      const created = { ...parsed.data, id: randomUUID(), created_by: actor.id, created_by_name: actor.displayName, created_at: now, updated_at: now };
      data.project_tasks.push(created);
      return created;
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Selecciona un cliente y una etapa válidos." }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: parsed.success ? "Falta la tarea." : parsed.error.issues[0]?.message }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  try {
    const task = await mutateAdminData((data) => {
      const current = data.project_tasks.find((item) => item.id === parsed.data.id);
      if (!current) throw new Error("missing");
      if (actor.role === "collaborator" && !current.assignees.includes(actor.id)) throw new Error("forbidden");
      if (!data.project_columns.some((column) => column.id === parsed.data.column_id)) throw new Error("invalid-column");
      Object.assign(current, parsed.data, { updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error && error.message === "forbidden" ? "Solo puedes actualizar tareas que tengas asignadas." : "No encontramos esa tarea." }, { status: error instanceof Error && error.message === "forbidden" ? 403 : 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const actor = adminSessionFromRequest(request)!;
  if (actor.role === "collaborator") return NextResponse.json({ error: "Tu rol no permite eliminar tareas." }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Tarea inválida." }, { status: 400 });
  await mutateAdminData((data) => { data.project_tasks = data.project_tasks.filter((task) => task.id !== parsed.data.id); });
  return NextResponse.json({ success: true });
}
