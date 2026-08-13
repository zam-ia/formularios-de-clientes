import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/adminAuth";
import { hashAllyPassword, isValidDocument, normalizeDocument } from "@/lib/allyAuth";
import {
  allyCategories,
  createAlly,
  mutateAlliesData,
  readAlliesData,
} from "@/lib/allies";

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "approved", "suspended", "rejected"]),
  visible: z.boolean().optional(),
});

const profileSchema = z.object({
  id: z.string().uuid().optional(),
  documentType: z.enum(["DNI", "RUC"]),
  documentNumber: z.string(),
  businessName: z.string().trim().min(2).max(120),
  category: z.enum(allyCategories as [string, ...string[]]),
  description: z.string().trim().max(500).default(""),
  contactName: z.string().trim().min(2).max(100),
  whatsapp: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(180).or(z.literal("")),
  status: z.enum(["pending", "approved", "suspended", "rejected"]),
  visible: z.boolean(),
});

function parseProfile(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return null;
  const documentNumber = normalizeDocument(parsed.data.documentNumber);
  if (!isValidDocument(parsed.data.documentType, documentNumber)) return null;
  return { ...parsed.data, documentNumber };
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const data = await readAlliesData();
  const allies = data.allies
    .toSorted((a, b) => b.created_at.localeCompare(a.created_at))
    .map((a) => ({
      id: a.id,
      document_type: a.document_type,
      document_number: a.document_number,
      business_name: a.business_name,
      category: a.category,
      description: a.description,
      contact_name: a.contact_name,
      contact_whatsapp: a.contact_whatsapp,
      contact_email: a.contact_email,
      logo_url: a.logo_url,
      status: a.status,
      visible: a.visible,
      must_change_password: a.must_change_password,
      last_login_at: a.last_login_at,
      created_at: a.created_at,
    }));
  return NextResponse.json({
    allies,
    contacts: data.contacts,
    metrics: {
      total: allies.length,
      pending: allies.filter((a) => a.status === "pending").length,
      active: allies.filter((a) => a.status === "approved").length,
      connections: data.contacts.length,
    },
  });
}

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request, true))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const profile = parseProfile(await request.json());
  if (!profile)
    return NextResponse.json({ error: "Revisa los datos del aliado." }, { status: 400 });
  const passwordHash = await hashAllyPassword(profile.documentNumber);
  try {
    await mutateAlliesData((data) => {
      if (data.allies.some((ally) => ally.document_number === profile.documentNumber))
        throw new Error("duplicate");
      const ally = createAlly({
          document_type: profile.documentType,
          document_number: profile.documentNumber,
          business_name: profile.businessName,
          category: profile.category,
          description: profile.description,
          contact_name: profile.contactName,
          contact_whatsapp: profile.whatsapp,
          contact_email: profile.email || null,
          logo_url: null,
          password_hash: passwordHash,
          status: profile.status,
          visible: profile.visible,
          must_change_password: true,
        });
      if (profile.status === "approved") ally.approved_at = new Date().toISOString();
      data.allies.push(ally);
    });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const duplicate = error instanceof Error && error.message === "duplicate";
    return NextResponse.json(
      { error: duplicate ? "Este DNI o RUC ya está registrado." : "No pudimos crear el aliado." },
      { status: duplicate ? 409 : 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isAdminRequest(request, true))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const profile = parseProfile(await request.json());
  if (!profile?.id)
    return NextResponse.json({ error: "Revisa los datos del aliado." }, { status: 400 });
  const temporaryPasswordHash = await hashAllyPassword(profile.documentNumber);
  try {
    await mutateAlliesData((data) => {
      if (data.allies.some((ally) => ally.id !== profile.id && ally.document_number === profile.documentNumber))
        throw new Error("duplicate");
      const ally = data.allies.find((item) => item.id === profile.id);
      if (!ally) throw new Error("missing");
      const documentChanged = ally.document_number !== profile.documentNumber;
      Object.assign(ally, {
        document_type: profile.documentType,
        document_number: profile.documentNumber,
        business_name: profile.businessName,
        category: profile.category,
        description: profile.description,
        contact_name: profile.contactName,
        contact_whatsapp: profile.whatsapp,
        contact_email: profile.email || null,
        status: profile.status,
        visible: profile.visible,
        approved_at: profile.status === "approved" ? ally.approved_at || new Date().toISOString() : ally.approved_at,
        updated_at: new Date().toISOString(),
      });
      if (documentChanged && ally.must_change_password) {
        ally.password_hash = temporaryPasswordHash;
      }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    const duplicate = error instanceof Error && error.message === "duplicate";
    return NextResponse.json(
      { error: duplicate ? "Ese documento pertenece a otro aliado." : "No pudimos editar el aliado." },
      { status: duplicate ? 409 : 400 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAdminRequest(request, true))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Cambio inválido." }, { status: 400 });
  await mutateAlliesData((data) => {
    const ally = data.allies.find((item) => item.id === parsed.data.id);
    if (!ally) throw new Error("missing");
    ally.status = parsed.data.status;
    if (parsed.data.visible !== undefined) ally.visible = parsed.data.visible;
    if (parsed.data.status === "approved") {
      ally.approved_at = ally.approved_at || new Date().toISOString();
      ally.visible = parsed.data.visible ?? true;
    }
    ally.updated_at = new Date().toISOString();
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!isAdminRequest(request, true))
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const parsed = z.object({ id: z.string().uuid() }).safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Registro inválido." }, { status: 400 });
  await mutateAlliesData((data) => {
    data.allies = data.allies.filter((ally) => ally.id !== parsed.data.id);
    data.contacts = data.contacts.filter(
      (contact) => contact.sender_id !== parsed.data.id && contact.recipient_id !== parsed.data.id,
    );
  });
  return NextResponse.json({ success: true });
}
