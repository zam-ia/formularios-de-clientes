import type { CalendarEvent } from "@/lib/adminData";

const typeLabels: Record<CalendarEvent["type"], string> = {
  recording: "Grabación",
  meeting: "Reunión",
  delivery: "Entrega",
  publication: "Publicación",
  vacation: "Vacaciones",
  internal: "Actividad interna",
  other: "Actividad",
};

const statusLabels: Record<CalendarEvent["status"], string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  completed: "Completada",
  cancelled: "Cancelada",
};

function limaDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(value));
}

export function calendarEventMessage(event: CalendarEvent) {
  return [
    `📅 *${typeLabels[event.type]} · ${statusLabels[event.status]}*`,
    `*${event.title}*`,
    event.client_name ? `Cliente: ${event.client_name}` : "",
    `Inicio: ${limaDate(event.start_at)}`,
    event.all_day ? "Duración: Todo el día" : `Fin: ${limaDate(event.end_at)}`,
    event.location ? `Lugar: ${event.location}` : "",
    event.assignees.length ? `Responsables: ${event.assignees.join(", ")}` : "",
    event.description ? `Detalle: ${event.description}` : "",
    event.drive_url ? `Material: ${event.drive_url}` : "",
    "",
    "— Agenda Crisdal Agency",
  ].filter(Boolean).join("\n");
}

export function calendarShareUrl(event: CalendarEvent) {
  return `https://wa.me/?text=${encodeURIComponent(calendarEventMessage(event))}`;
}

export async function notifyCalendarEvent(event: CalendarEvent) {
  const message = calendarEventMessage(event);
  if (!event.notify_whatsapp) return { mode: "disabled" as const, delivered: false };
  const webhook = process.env.CALENDAR_NOTIFICATION_WEBHOOK_URL;
  if (!webhook) return { mode: "manual" as const, delivered: false };

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        message,
        whatsappGroupUrl: process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "",
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`webhook_${response.status}`);
    return { mode: "webhook" as const, delivered: true };
  } catch (error) {
    console.error("Calendar notification failed", { message: error instanceof Error ? error.message : "unknown" });
    return { mode: "webhook" as const, delivered: false };
  }
}
