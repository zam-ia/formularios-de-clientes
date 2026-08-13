import nodemailer from "nodemailer";
import { Resend } from "resend";
import type { IntakePayload } from "@/lib/intake";

const escapeHtml = (value: unknown) =>
  String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function emailHtml(submission: IntakePayload) {
  const rows: Array<[string, unknown]> = [
    ["Código", submission.submission_code],
    ["Negocio", submission.business_name],
    ["Servicio inicial", submission.service_types.join(", ")],
    ["Prioridad", submission.primary_goal],
    ["Resultado a 4 semanas", submission.four_week_result],
    ["Cliente ideal", submission.ideal_customer],
    ["Oferta estrella", submission.star_offer],
    ["Contacto", submission.contact_name],
    ["WhatsApp", submission.contact_whatsapp],
    ["Correo", submission.contact_email],
    ["Fecha objetivo", submission.deadline_date],
  ];

  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f7f7f5;padding:24px;color:#11100e">
    <div style="max-width:680px;margin:auto;background:#fff;border-radius:20px;padding:28px;border:1px solid #eee4d2">
      <p style="color:#9a6800;font-weight:700;margin:0 0 8px">NUEVA RADIOGRAFÍA DE MARCA</p>
      <h1 style="font-size:26px;margin:0 0 22px">${escapeHtml(submission.business_name)}</h1>
      <table style="width:100%;border-collapse:collapse">${rows.map(([label, value]) => `<tr><td style="padding:10px 12px;border-top:1px solid #eee4d2;color:#6f6a61;width:34%">${label}</td><td style="padding:10px 12px;border-top:1px solid #eee4d2"><strong>${escapeHtml(value)}</strong></td></tr>`).join("")}</table>
      <p style="margin:22px 0 0;color:#6f6a61">Revisa la respuesta completa y sus archivos privados en Supabase.</p>
    </div>
  </body></html>`;
}

export async function sendSubmissionNotification(submission: IntakePayload) {
  const to = process.env.NOTIFY_EMAIL || "crisdalagency@gmail.com";
  const subject = `Nueva Radiografía — ${submission.business_name} — ${submission.submission_code}`;
  const html = emailHtml(submission);

  return sendEmail({
    to,
    subject,
    html,
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
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM,
      to,
      subject,
      html,
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
      replyTo,
    });
    return { provider: "smtp" as const, id: result.messageId };
  }

  throw new Error("No hay un proveedor de correo configurado.");
}
