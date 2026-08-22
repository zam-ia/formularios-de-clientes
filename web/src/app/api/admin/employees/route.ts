import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, publicAdminUser, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const employeeSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().max(80),
  full_name: z.string().trim().min(2).max(140),
  email: z.string().trim().email().max(180).or(z.literal("")),
  phone: z.string().trim().max(30),
  role_title: z.string().trim().min(2).max(120),
  area: z.string().trim().min(2).max(100),
  contract_type: z.enum(["payroll", "freelance", "intern", "partner"]),
  start_date: z.string().date(),
  rate: z.number().min(0).max(10_000_000),
  currency: z.enum(["PEN", "USD"]),
  status: z.enum(["active", "leave", "inactive"]),
  notes: z.string().trim().max(2000),
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAdminData();
  const finalColumnId = data.project_columns.toSorted((a, b) => b.order - a.order)[0]?.id;
  const workload = Object.fromEntries(data.employees.map((employee) => [employee.id, data.project_tasks.filter((task) => task.column_id !== finalColumnId && (task.assignees.includes(employee.user_id) || task.assignees.includes(employee.id))).length]));
  return NextResponse.json({ employees: data.employees.toSorted((a, b) => a.full_name.localeCompare(b.full_name)), users: data.users.filter((user) => user.active).map(publicAdminUser), workload });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = employeeSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Revisa los datos del colaborador." }, { status: 400 });
  const employee = await mutateAdminData((data) => {
    const now = new Date().toISOString();
    const created = { ...parsed.data, id: randomUUID(), created_at: now, updated_at: now };
    data.employees.push(created);
    return created;
  });
  return NextResponse.json({ employee }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = employeeSchema.safeParse(await request.json());
  if (!parsed.success || !parsed.data.id) return NextResponse.json({ error: "Revisa los datos del colaborador." }, { status: 400 });
  try {
    const employee = await mutateAdminData((data) => {
      const current = data.employees.find((item) => item.id === parsed.data.id);
      if (!current) throw new Error("missing");
      Object.assign(current, parsed.data, { updated_at: new Date().toISOString() });
      return current;
    });
    return NextResponse.json({ employee });
  } catch {
    return NextResponse.json({ error: "No encontramos ese colaborador." }, { status: 404 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Colaborador inválido." }, { status: 400 });
  await mutateAdminData((data) => { data.employees = data.employees.filter((employee) => employee.id !== parsed.data.id); });
  return NextResponse.json({ success: true });
}
