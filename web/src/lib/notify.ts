import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { IntakePayload } from "@/lib/intake";
import { getSupabaseServer } from "@/lib/supabaseServer";

const FILE_LINK_TTL_SECONDS = 60 * 60 * 24 * 7;

type EmailField = [label: string, value: unknown];
type EmailSection = { title: string; fields: EmailField[] };
type SubmissionFileLink = IntakePayload["files"][number] & { url?: string };

const escapeHtml = (value: unknown) =>
  String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "No respondió";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (value === null || value === undefined || String(value).trim() === "") return "No respondió";
  return String(value);
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function submissionSections(submission: IntakePayload): EmailSection[] {
  return [
    {
      title: "1. Negocio y servicio",
      fields: [
        ["Servicio(s) solicitado(s)", submission.service_types],
        ["Nombre del negocio", submission.business_name],
        ["Rubro", submission.sector],
        ["Ubicación principal", submission.location],
        ["Tiempo funcionando", submission.business_age],
        ["Redes sociales o web", submission.social_links],
      ],
    },
    {
      title: "2. Personalidad de marca",
      fields: [
        ["Tres palabras de marca", submission.brand_words],
        ["Estado de la identidad", submission.brand_assets_status],
        ["Colores o estilos preferidos", submission.brand_colors_text],
        ["Tono de marca", submission.brand_tone],
        ["Qué no quiere que hagamos o digamos", submission.brand_avoid],
      ],
    },
    {
      title: "3. Prioridad y acción",
      fields: [
        ["Objetivo principal", submission.primary_goal],
        ["Resultado esperado en 4 semanas", submission.four_week_result],
        ["Acción esperada del público", submission.primary_cta],
      ],
    },
    {
      title: "4. Cliente ideal",
      fields: [
        ["Descripción del cliente ideal", submission.ideal_customer],
        ["Problema que resuelve", submission.customer_problem],
        ["Canales donde lo encuentran", submission.customer_channels],
        ["Objeción principal", submission.main_objection],
      ],
    },
    {
      title: "5. Oferta y competencia",
      fields: [
        ["Producto o servicio estrella", submission.star_offer],
        ["Precio promedio", submission.average_price],
        ["Diferenciador", submission.differentiator],
        ["Promoción vigente", submission.current_promo],
        ["Competidores directos", submission.competitors],
        ["Qué admira o no quiere copiar", submission.competitor_notes],
      ],
    },
    {
      title: "6. Experiencia y recursos",
      fields: [
        ["Ya invirtió en marketing", submission.marketing_invested],
        ["Resultados y aprendizajes anteriores", submission.marketing_history],
        ["Presupuesto mensual de pauta", submission.ad_budget],
        ["Material propio disponible", submission.own_materials],
        ["Enlace de materiales", submission.materials_link],
      ],
    },
    {
      title: "7. Fecha y contacto",
      fields: [
        ["Tipo de fecha", submission.deadline_type],
        ["Fecha objetivo", submission.deadline_date],
        ["Fecha comercial importante", submission.key_date],
        ["Persona de contacto", submission.contact_name],
        ["WhatsApp", submission.contact_whatsapp],
        ["Correo", submission.contact_email],
        ["Mejor horario de contacto", submission.best_contact_time],
        ["Autorización de contacto", submission.consent],
      ],
    },
  ];
}

function fileLabel(category: SubmissionFileLink["category"]) {
  return category === "brand_assets" ? "Logo o identidad de marca" : "Muestra de material";
}

async function createPrivateFileLinks(files: IntakePayload["files"]): Promise<SubmissionFileLink[]> {
  if (!files.length) return [];

  try {
    const supabase = getSupabaseServer();
    const bucket = process.env.SUPABASE_FILES_BUCKET || "brand-intake-files";
    return await Promise.all(files.map(async (file) => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(file.storage_path, FILE_LINK_TTL_SECONDS, { download: file.original_name });

      if (error) {
        console.error("Private file link failed", { path: file.storage_path, code: error.name });
        return file;
      }

      return { ...file, url: data.signedUrl };
    }));
  } catch (error) {
    console.error("Private file links failed", { message: error instanceof Error ? error.message : "unknown" });
    return files;
  }
}

function sectionHtml(section: EmailSection) {
  return `<section style="margin:0 0 28px">
    <h2 style="font-size:17px;line-height:1.3;margin:0;padding:13px 16px;background:#11100e;color:#ffbd18;border-radius:12px 12px 0 0">${escapeHtml(section.title)}</h2>
    <table role="presentation" style="width:100%;border-collapse:collapse;border:1px solid #eee4d2;border-top:0">${section.fields.map(([label, value]) => `<tr>
      <td style="padding:11px 13px;border-top:1px solid #eee4d2;color:#6f6a61;width:34%;vertical-align:top;font-size:13px">${escapeHtml(label)}</td>
      <td style="padding:11px 13px;border-top:1px solid #eee4d2;color:#11100e;vertical-align:top;font-size:14px;line-height:1.55;white-space:pre-wrap"><strong>${escapeHtml(displayValue(value))}</strong></td>
    </tr>`).join("")}</table>
  </section>`;
}

function filesHtml(files: SubmissionFileLink[]) {
  if (!files.length) {
    return `<section style="margin:0 0 28px"><h2 style="font-size:17px;margin:0 0 10px">8. Archivos</h2><p style="margin:0;color:#6f6a61">El cliente no adjuntó archivos.</p></section>`;
  }

  return `<section style="margin:0 0 28px">
    <h2 style="font-size:17px;line-height:1.3;margin:0;padding:13px 16px;background:#11100e;color:#ffbd18;border-radius:12px 12px 0 0">8. Archivos adjuntos</h2>
    <div style="border:1px solid #eee4d2;border-top:0;padding:8px 16px">${files.map((file) => `<div style="padding:12px 0;border-bottom:1px solid #eee4d2">
      <p style="margin:0 0 4px;font-size:13px;color:#6f6a61">${escapeHtml(fileLabel(file.category))} · ${escapeHtml(formatBytes(file.size_bytes))}</p>
      <p style="margin:0 0 10px;font-size:14px"><strong>${escapeHtml(file.original_name)}</strong></p>
      ${file.url ? `<a href="${escapeHtml(file.url)}" style="display:inline-block;background:#ffbd18;color:#11100e;text-decoration:none;font-weight:700;padding:9px 14px;border-radius:999px">Descargar archivo privado</a>` : `<p style="margin:0;color:#a23a2a">No se pudo generar el enlace. El archivo continúa guardado de forma privada.</p>`}
    </div>`).join("")}</div>
    <p style="margin:9px 0 0;color:#6f6a61;font-size:12px">Por seguridad, los enlaces privados vencen en 7 días.</p>
  </section>`;
}

export function buildSubmissionEmail(submission: IntakePayload, files: SubmissionFileLink[] = []) {
  const sections = submissionSections(submission);
  const whatsapp = submission.contact_whatsapp.replace(/\D/g, "");
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Nueva Radiografía de Marca</title></head>
  <body style="font-family:Arial,sans-serif;background:#f7f7f5;padding:24px;color:#11100e;margin:0">
    <div style="display:none;max-height:0;overflow:hidden">Todas las respuestas de ${escapeHtml(submission.business_name)} · ${escapeHtml(submission.submission_code)}</div>
    <div style="max-width:760px;margin:auto;background:#fff;border-radius:20px;padding:28px;border:1px solid #eee4d2">
      <p style="color:#9a6800;font-weight:700;margin:0 0 8px;font-size:12px;letter-spacing:.06em">NUEVA RADIOGRAFÍA DE MARCA</p>
      <h1 style="font-size:28px;line-height:1.2;margin:0 0 8px">${escapeHtml(submission.business_name)}</h1>
      <p style="margin:0 0 22px;color:#6f6a61">Código <strong style="color:#11100e">${escapeHtml(submission.submission_code)}</strong> · Formulario ${escapeHtml(submission.form_version)}</p>
      <div style="margin:0 0 26px"><a href="https://wa.me/${escapeHtml(whatsapp)}" style="display:inline-block;background:#25d366;color:#0b2b17;text-decoration:none;font-weight:700;padding:11px 17px;border-radius:999px">Escribir por WhatsApp</a></div>
      ${sections.map(sectionHtml).join("")}
      ${filesHtml(files)}
      <p style="margin:22px 0 0;color:#6f6a61;font-size:12px">Información recibida mediante el formulario privado de Crisdal Agency. No compartas este correo ni sus enlaces fuera del equipo autorizado.</p>
    </div>
  </body></html>`;

  const text = [
    `NUEVA RADIOGRAFÍA DE MARCA`,
    `${submission.business_name} · ${submission.submission_code}`,
    "",
    ...sections.flatMap((section) => [section.title, ...section.fields.map(([label, value]) => `${label}: ${displayValue(value)}`), ""]),
    "8. Archivos adjuntos",
    ...(files.length ? files.map((file) => `${fileLabel(file.category)}: ${file.original_name} (${formatBytes(file.size_bytes)})${file.url ? `\n${file.url}` : ""}`) : ["El cliente no adjuntó archivos."]),
    "",
    "Los enlaces privados vencen en 7 días.",
  ].join("\n");

  return { html, text };
}

export async function sendSubmissionNotification(submission: IntakePayload) {
  const to = process.env.NOTIFY_EMAIL || "crisdalagency@gmail.com";
  const subject = `Nueva Radiografía — ${submission.business_name} — ${submission.submission_code}`;
  const files = await createPrivateFileLinks(submission.files);
  const { html, text } = buildSubmissionEmail(submission, files);

  return sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: submission.contact_email || undefined,
  });
}

export async function sendBrochureContactNotification(contact: {
  name: string;
  company: string;
  whatsapp: string;
  message: string;
}) {
  const to = process.env.NOTIFY_EMAIL || "crisdalagency@gmail.com";
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f7f5;padding:24px;color:#11100e">
    <div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;padding:28px;border:1px solid #eee4d2">
      <p style="color:#9a6800;font-weight:700;margin:0 0 8px">NUEVA CONSULTA DESDE EL BROCHURE</p>
      <h1 style="font-size:26px;margin:0 0 22px">${escapeHtml(contact.company)}</h1>
      <p><strong>Nombre:</strong> ${escapeHtml(contact.name)}</p>
      <p><strong>WhatsApp:</strong> ${escapeHtml(contact.whatsapp)}</p>
      <p style="margin-top:20px"><strong>Mensaje</strong></p>
      <p style="white-space:pre-wrap;line-height:1.65">${escapeHtml(contact.message)}</p>
    </div>
  </body></html>`;
  return sendEmail({
    to,
    subject: `Consulta brochure — ${contact.company}`,
    html,
  });
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}) {
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
      text,
      replyTo,
    });
    if (result.error) throw new Error(result.error.message);
    return { provider: "resend" as const, id: result.data?.id };
  }

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const result = await transport.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text,
      replyTo,
    });
    return { provider: "smtp" as const, id: result.messageId };
  }

  throw new Error("No hay un proveedor de correo configurado.");
}
