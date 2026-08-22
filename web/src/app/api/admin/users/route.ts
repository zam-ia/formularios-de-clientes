import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { adminSessionFromRequest, getAdminUsername, hashAdminPassword, isAdminRequest } from "@/lib/adminAuth";
import { mutateAdminData, publicAdminUser, readAdminData } from "@/lib/adminData";

export const runtime = "nodejs";

const usernameSchema = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/);
const roleSchema = z.enum(["owner", "admin", "editor", "calendar", "project_manager", "collaborator", "finance", "hr"]);
const createSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(180).or(z.literal("")),
  role: roleSchema,
  password: z.string().min(12).max(128),
});
const updateSchema = z.object({
  id: z.string().uuid(),
  username: usernameSchema,
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(180).or(z.literal("")),
  role: roleSchema,
  active: z.boolean(),
  password: z.string().min(12).max(128).or(z.literal("")),
});

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAdminData();
  return NextResponse.json({ users: data.users.map(publicAdminUser).toSorted((a, b) => a.displayName.localeCompare(b.displayName)) });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "Solo el propietario puede crear usuarios." }, { status: 403 });
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos. La contraseña debe tener al menos 12 caracteres." }, { status: 400 });
  const passwordHash = await hashAdminPassword(parsed.data.password);
  const actor = adminSessionFromRequest(request)!;
  try {
    const user = await mutateAdminData((data) => {
      if (parsed.data.username === getAdminUsername() || data.users.some((item) => item.username === parsed.data.username)) throw new Error("duplicate");
      const now = new Date().toISOString();
      const created = {
        id: randomUUID(),
        username: parsed.data.username,
        display_name: parsed.data.displayName,
        email: parsed.data.email || null,
        role: parsed.data.role,
        password_hash: passwordHash,
        active: true,
        last_login_at: null,
        created_by: actor.id,
        created_at: now,
        updated_at: now,
      };
      data.users.push(created);
      return publicAdminUser(created);
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    const duplicate = error instanceof Error && error.message === "duplicate";
    return NextResponse.json({ error: duplicate ? "Ese nombre de usuario ya existe." : "No pudimos crear el usuario." }, { status: duplicate ? 409 : 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true)) return NextResponse.json({ error: "Solo el propietario puede editar usuarios." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del usuario." }, { status: 400 });
  const actor = adminSessionFromRequest(request)!;
  if (actor.id === parsed.data.id && !parsed.data.active) return NextResponse.json({ error: "No puedes desactivar tu propia sesión." }, { status: 400 });
  const nextHash = parsed.data.password ? await hashAdminPassword(parsed.data.password) : null;
  try {
    const user = await mutateAdminData((data) => {
      if (parsed.data.username === getAdminUsername() || data.users.some((item) => item.id !== parsed.data.id && item.username === parsed.data.username)) throw new Error("duplicate");
      const current = data.users.find((item) => item.id === parsed.data.id);
      if (!current) throw new Error("missing");
      Object.assign(current, {
        username: parsed.data.username,
        display_name: parsed.data.displayName,
        email: parsed.data.email || null,
        role: parsed.data.role,
        active: parsed.data.active,
        updated_at: new Date().toISOString(),
      });
      if (nextHash) current.password_hash = nextHash;
      return publicAdminUser(current);
    });
    return NextResponse.json({ user });
  } catch (error) {
    const duplicate = error instanceof Error && error.message === "duplicate";
    return NextResponse.json({ error: duplicate ? "Ese nombre de usuario ya existe." : "No pudimos actualizar el usuario." }, { status: duplicate ? 409 : 404 });
  }
}
