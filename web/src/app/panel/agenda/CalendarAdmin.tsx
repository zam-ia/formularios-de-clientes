"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, ArrowLeft, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Copy, ExternalLink, LoaderCircle, MapPin, MessageCircle, Plus, Save, Search, Trash2, UsersRound, X } from "lucide-react";
import type { AgencyClient, CalendarEvent, CalendarEventType } from "@/lib/adminData";
import styles from "../os.module.css";

type View = "month" | "week" | "day";
type EventView = CalendarEvent & { share_text: string; share_url: string };
type EventForm = Omit<CalendarEvent, "id" | "created_by" | "created_by_name" | "created_at" | "updated_at" | "start_at" | "end_at"> & { id?: string; start_at: string; end_at: string; assignees_text: string };
type TimePickerState = { field: "start_at" | "end_at"; hour: number; minute: number; period: "AM" | "PM" };
type ConflictPrompt = { conflicts: EventView[] };
type CalendarResponse = { events: EventView[]; clients: AgencyClient[]; groupUrl: string };

const groupFallback = "https://chat.whatsapp.com/LcCDKVyxMwRJvP1WYhoui5";
const typeLabels: Record<CalendarEventType, string> = { recording: "Grabación", meeting: "Reunión", delivery: "Entrega", publication: "Publicación", vacation: "Vacaciones", internal: "Actividad interna", other: "Otro" };
const monthNames = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const weekdayNames = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const clockHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

class ApiError extends Error {
  constructor(message: string, readonly status: number, readonly payload: Record<string, unknown>) { super(message); }
}
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const result = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new ApiError(String(result.error || "No pudimos completar la acción."), response.status, result);
  return result as T;
}
function startOfWeek(value: Date) { const date = new Date(value); const day = date.getDay() || 7; date.setDate(date.getDate() - day + 1); date.setHours(0, 0, 0, 0); return date; }
function dateKey(value: Date | string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function localInput(value: Date | string) { const date = new Date(value); const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return shifted.toISOString().slice(0, 16); }
function displayTime(value: string) { return new Intl.DateTimeFormat("es-PE", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(value)); }
function fullDate(value: Date) { return new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(value); }
function localDate(value: string) { return value.slice(0, 10); }
function localTime(value: string) { return value.slice(11, 16); }
function withDate(value: string, date: string) { return `${date}T${localTime(value) || "09:00"}`; }
function withTime(value: string, time: string) { return `${localDate(value)}T${time}`; }
function timeParts(value: string): Omit<TimePickerState, "field"> {
  const [rawHour, rawMinute] = localTime(value).split(":").map(Number);
  const period = rawHour >= 12 ? "PM" : "AM";
  return { hour: rawHour % 12 || 12, minute: rawMinute || 0, period };
}
function to24Hour(hour: number, period: "AM" | "PM") { return hour % 12 + (period === "PM" ? 12 : 0); }
function formatLocalTime(value: string) { const parts = timeParts(value); return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")} ${parts.period}`; }
function freshEvent(date = new Date(), currentUser = "Crisdal"): EventForm {
  const start = new Date(date); start.setMinutes(0, 0, 0); if (start.getTime() < Date.now()) start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 3600000);
  return { client_id: "", title: "", client_name: "", type: "meeting", start_at: localInput(start), end_at: localInput(end), all_day: false, location: "", assignees: [], assignees_text: currentUser, description: "", status: "scheduled", drive_url: "", notify_whatsapp: true };
}
function overlaps(form: EventForm, event: EventView) {
  if (event.id === form.id || !["scheduled", "confirmed"].includes(event.status) || form.status === "cancelled") return false;
  return new Date(form.start_at).getTime() < new Date(event.end_at).getTime() && new Date(form.end_at).getTime() > new Date(event.start_at).getTime();
}

export default function CalendarAdmin({ currentUser }: { currentUser: string }) {
  const [events, setEvents] = useState<EventView[]>([]); const [clients, setClients] = useState<AgencyClient[]>([]); const [groupUrl, setGroupUrl] = useState(groupFallback); const [view, setView] = useState<View>("month"); const [cursor, setCursor] = useState(new Date()); const [form, setForm] = useState<EventForm | null>(null); const [selected, setSelected] = useState<EventView | null>(null); const [timePicker, setTimePicker] = useState<TimePickerState | null>(null); const [conflictPrompt, setConflictPrompt] = useState<ConflictPrompt | null>(null); const [shareReady, setShareReady] = useState<EventView | null>(null); const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(""); const [openedAt] = useState(() => Date.now());
  const load = useCallback(async () => { const result = await api<CalendarResponse>("/api/admin/calendar"); setEvents(result.events); setClients(result.clients); if (result.groupUrl) setGroupUrl(result.groupUrl); }, []);
  useEffect(() => { let cancelled = false; void api<CalendarResponse>("/api/admin/calendar").then((result) => { if (!cancelled) { setEvents(result.events); setClients(result.clients); if (result.groupUrl) setGroupUrl(result.groupUrl); } }).catch((error) => { if (!cancelled) setNotice(error.message); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);

  const calendarDays = useMemo(() => { const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1); const offset = (first.getDay() + 6) % 7; const start = new Date(first); start.setDate(first.getDate() - offset); return Array.from({ length: 42 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; }); }, [cursor]);
  const weekDays = useMemo(() => { const start = startOfWeek(cursor); return Array.from({ length: 7 }, (_, index) => { const date = new Date(start); date.setDate(start.getDate() + index); return date; }); }, [cursor]);
  const eventsFor = (date: Date) => events.filter((event) => dateKey(event.start_at) === dateKey(date));
  const visibleDates = view === "month" ? calendarDays : view === "week" ? weekDays : [cursor]; const visibleEvents = visibleDates.flatMap(eventsFor); const upcoming = events.filter((event) => new Date(event.start_at).getTime() >= openedAt && event.status !== "cancelled").slice(0, 6);
  function move(direction: -1 | 1) { const next = new Date(cursor); if (view === "month") next.setMonth(next.getMonth() + direction); else if (view === "week") next.setDate(next.getDate() + direction * 7); else next.setDate(next.getDate() + direction); setCursor(next); }
  function openCreate(date = cursor) { setSelected(null); setShareReady(null); setForm(freshEvent(date, currentUser)); }
  function openEdit(event: EventView) { setSelected(event); setForm({ id: event.id, client_id: event.client_id || "", title: event.title, client_name: event.client_name, type: event.type, start_at: localInput(event.start_at), end_at: localInput(event.end_at), all_day: event.all_day, location: event.location, assignees: event.assignees, assignees_text: event.assignees.join(", "), description: event.description, status: event.status, drive_url: event.drive_url, notify_whatsapp: event.notify_whatsapp }); }
  function chooseClient(value: string) { const client = clients.find((item) => item.company_name.toLowerCase() === value.toLowerCase()); setForm((current) => current ? { ...current, client_id: client?.id || "", client_name: value } : current); }
  function toggleAllDay(checked: boolean) { setForm((current) => { if (!current) return current; const startDate = localDate(current.start_at); return { ...current, all_day: checked, start_at: `${startDate}T${checked ? "00:00" : "09:00"}`, end_at: `${startDate}T${checked ? "23:59" : "10:00"}` }; }); }
  function openClock(field: "start_at" | "end_at") { if (!form || form.all_day) return; setTimePicker({ field, ...timeParts(form[field]) }); }
  function acceptClock() { if (!timePicker) return; const hour = String(to24Hour(timePicker.hour, timePicker.period)).padStart(2, "0"); const minute = String(timePicker.minute).padStart(2, "0"); setForm((current) => current ? { ...current, [timePicker.field]: withTime(current[timePicker.field], `${hour}:${minute}`) } : current); setTimePicker(null); }
  async function save(allowConflict = false) {
    if (!form) return;
    if (new Date(form.end_at).getTime() <= new Date(form.start_at).getTime()) { setNotice("La fecha y hora final deben ser posteriores al inicio."); return; }
    const localConflicts = events.filter((event) => overlaps(form, event));
    if (!allowConflict && localConflicts.length) { setConflictPrompt({ conflicts: localConflicts }); return; }
    setBusy(true); setNotice("");
    try {
      const { assignees_text: assigneesText, ...values } = form;
      const payload = { ...values, start_at: new Date(form.start_at).toISOString(), end_at: new Date(form.end_at).toISOString(), assignees: assigneesText.split(",").map((value) => value.trim()).filter(Boolean), allow_conflict: allowConflict };
      const result = await api<{ event: EventView; notification: { delivered: boolean } }>("/api/admin/calendar", { method: form.id ? "PUT" : "POST", body: JSON.stringify(payload) });
      await load(); setForm(null); setSelected(result.event); setShareReady(result.event); setConflictPrompt(null); setNotice(result.notification.delivered ? "Actividad guardada y aviso automático enviado." : "Actividad guardada. El mensaje para WhatsApp está listo.");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && Array.isArray(error.payload.conflicts)) setConflictPrompt({ conflicts: error.payload.conflicts as EventView[] });
      else setNotice(error instanceof Error ? error.message : "No pudimos guardar la actividad.");
    } finally { setBusy(false); }
  }
  async function remove() { if (!form?.id || !confirm("¿Eliminar esta actividad de la agenda?")) return; setBusy(true); try { await api("/api/admin/calendar", { method: "DELETE", body: JSON.stringify({ id: form.id }) }); await load(); setForm(null); setSelected(null); setNotice("Actividad eliminada."); } finally { setBusy(false); } }
  async function copyEvent(event: EventView) { await navigator.clipboard.writeText(event.share_text); setNotice("Resumen copiado. Ya puedes pegarlo en el grupo."); }

  return <main className={styles.osPage}>
    <header className={styles.osHeader}><div><Link href="/panel"><ArrowLeft size={17} /> Volver al panel</Link><p>CRISDAL OS · OPERACIONES</p><h1>Agenda de la agencia</h1><span>Grabaciones, reuniones, entregas, publicaciones y vacaciones en un solo lugar.</span></div><button className={styles.primaryAction} onClick={() => openCreate(new Date())}><Plus /> Nueva actividad</button></header>
    <section className={styles.calendarToolbar}><div className={styles.segmented}><button className={view === "month" ? styles.activeSegment : ""} onClick={() => setView("month")}>Mes</button><button className={view === "week" ? styles.activeSegment : ""} onClick={() => setView("week")}>Semana</button><button className={view === "day" ? styles.activeSegment : ""} onClick={() => setView("day")}>Día</button></div><div className={styles.calendarNav}><button onClick={() => move(-1)} aria-label="Periodo anterior"><ChevronLeft /></button><button onClick={() => setCursor(new Date())}>Hoy</button><strong>{view === "month" ? `${monthNames[cursor.getMonth()]} ${cursor.getFullYear()}` : fullDate(cursor)}</strong><button onClick={() => move(1)} aria-label="Periodo siguiente"><ChevronRight /></button></div><a className={styles.whatsappGroup} href={groupUrl} target="_blank" rel="noreferrer"><MessageCircle /> Abrir grupo</a></section>
    {notice ? <div className={styles.notice}>{notice}</div> : null}
    {shareReady ? <div className={styles.quickShareNotice}><div><MessageCircle /><span><strong>Mensaje listo para WhatsApp</strong><small>En móvil se abrirá WhatsApp para elegir el grupo o contacto.</small></span></div><button onClick={() => void copyEvent(shareReady)}><Copy /> Copiar</button><a href={shareReady.share_url} target="_blank" rel="noreferrer"><MessageCircle /> Compartir ahora</a><button aria-label="Cerrar aviso" onClick={() => setShareReady(null)}><X /></button></div> : null}
    {loading ? <div className={styles.loadingBlock}><LoaderCircle className={styles.spin} /> Organizando agenda…</div> : <div className={styles.calendarLayout}><section className={styles.calendarMain}>
      {view === "month" ? <div className={styles.monthCalendar}><div className={styles.weekdayRow}>{weekdayNames.map((day) => <span key={day}>{day}</span>)}</div><div className={styles.monthGrid}>{calendarDays.map((date) => <button key={date.toISOString()} className={`${styles.dayCell} ${date.getMonth() !== cursor.getMonth() ? styles.outsideMonth : ""} ${dateKey(date) === dateKey(new Date()) ? styles.today : ""}`} onDoubleClick={() => openCreate(date)} onClick={() => { setCursor(date); setView("day"); }}><span>{date.getDate()}</span><div>{eventsFor(date).slice(0, 3).map((event) => <em key={event.id} className={styles[event.type]}>{!event.all_day ? <small>{displayTime(event.start_at)}</small> : null}{event.title}</em>)}{eventsFor(date).length > 3 ? <i>+{eventsFor(date).length - 3} más</i> : null}</div></button>)}</div></div> : null}
      {view === "week" ? <div className={styles.weekCalendar}>{weekDays.map((date) => <section key={date.toISOString()}><button className={dateKey(date) === dateKey(new Date()) ? styles.todayHeader : ""} onClick={() => { setCursor(date); setView("day"); }}><span>{weekdayNames[(date.getDay() + 6) % 7]}</span><strong>{date.getDate()}</strong></button><div>{eventsFor(date).map((event) => <EventCard key={event.id} event={event} onClick={() => openEdit(event)} />)}<button className={styles.quickAdd} onClick={() => openCreate(date)}><Plus /> Agregar</button></div></section>)}</div> : null}
      {view === "day" ? <div className={styles.dayAgenda}><header><div><p>AGENDA DEL DÍA</p><h2>{fullDate(cursor)}</h2></div><button className={styles.secondaryAction} onClick={() => openCreate(cursor)}><Plus /> Agregar actividad</button></header>{eventsFor(cursor).length ? eventsFor(cursor).map((event) => <EventCard key={event.id} event={event} detailed onClick={() => openEdit(event)} />) : <div className={styles.emptyDay}><CalendarDays /><h3>Día disponible</h3><p>No hay actividades registradas.</p></div>}</div> : null}
    </section><aside className={styles.calendarAside}><p>PRÓXIMAMENTE</p><h2>{visibleEvents.length} actividades en esta vista</h2>{upcoming.map((event) => <button key={event.id} onClick={() => openEdit(event)}><span className={styles[event.type]}>{typeLabels[event.type]}</span><strong>{event.title}</strong><small>{new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(event.start_at))}</small></button>)}{!upcoming.length ? <p className={styles.muted}>No hay próximas actividades.</p> : null}</aside></div>}

    {form ? <div className={styles.modalBackdrop}><section className={`${styles.modalCard} ${styles.wideModal}`}><button className={styles.iconClose} onClick={() => setForm(null)} aria-label="Cerrar"><X /></button><div className={styles.modalHeading}><span><CalendarDays /></span><div><p>Agenda compartida</p><h2>{form.id ? "Editar actividad" : "Nueva actividad"}</h2></div></div><div className={styles.formGrid}>
      <label className={styles.fullField}>Título<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Grabación de campaña agosto" /></label>
      <label className={styles.clientSearchField}>Cliente registrado<span><Search /><input list="calendar-client-list" value={form.client_name} onChange={(event) => chooseClient(event.target.value)} placeholder="Buscar por nombre o empresa…" /></span><datalist id="calendar-client-list">{clients.map((client) => <option key={client.id} value={client.company_name}>{client.contact_name} · {client.plan_name}</option>)}</datalist><small>{form.client_id ? "Cliente vinculado a esta actividad." : "Puedes escribir un nombre libre o registrar uno nuevo."} <Link href="/panel/clientes">Gestionar clientes</Link></small></label>
      <label>Tipo<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as CalendarEventType })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className={`${styles.checkField} ${styles.allDayToggle}`}><input type="checkbox" checked={form.all_day} onChange={(event) => toggleAllDay(event.target.checked)} /><span><strong>Todo el día</strong><small>{form.all_day ? "Las horas están bloqueadas y el día completo se reservará." : "Actívalo para bloquear cualquier otra reserva durante esas fechas."}</small></span></label>
      <DateTimeField label="Inicio" value={form.start_at} allDay={form.all_day} onDate={(date) => setForm({ ...form, start_at: withDate(form.start_at, date) })} onClock={() => openClock("start_at")} />
      <DateTimeField label="Fin" value={form.end_at} allDay={form.all_day} onDate={(date) => setForm({ ...form, end_at: withDate(form.end_at, date) })} onClock={() => openClock("end_at")} />
      <label>Lugar / enlace<input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder="Dirección o Google Meet" /></label><label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as EventForm["status"] })}><option value="scheduled">Programada</option><option value="confirmed">Confirmada</option><option value="completed">Completada</option><option value="cancelled">Cancelada</option></select></label>
      <label className={styles.fullField}>Responsables<input value={form.assignees_text} onChange={(event) => setForm({ ...form, assignees_text: event.target.value })} placeholder="Milagros, Aldair, Audiovisual" /><small>Separa los nombres con comas.</small></label><label className={styles.fullField}>Detalle<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className={styles.fullField}>Drive / material<input type="url" value={form.drive_url} onChange={(event) => setForm({ ...form, drive_url: event.target.value })} /></label><label className={styles.checkField}><input type="checkbox" checked={form.notify_whatsapp} onChange={(event) => setForm({ ...form, notify_whatsapp: event.target.checked })} /> Preparar aviso para WhatsApp</label>
    </div><div className={styles.modalActions}>{form.id ? <button className={styles.dangerAction} onClick={() => void remove()}><Trash2 /> Eliminar</button> : null}<span /><button onClick={() => setForm(null)}>Cancelar</button><button className={styles.primaryAction} onClick={() => void save()} disabled={busy || !form.title}>{busy ? <LoaderCircle className={styles.spin} /> : <Save />} Guardar</button></div>{selected ? <div className={styles.shareBar}><div><MessageCircle /><span><strong>Compartir actualización</strong><small>Abre WhatsApp y elige el grupo de Crisdal.</small></span></div><button onClick={() => void copyEvent(selected)}><Copy /> Copiar</button><a href={selected.share_url} target="_blank" rel="noreferrer"><ExternalLink /> Compartir</a></div> : null}</section></div> : null}
    {timePicker ? <TimePickerModal value={timePicker} onChange={setTimePicker} onCancel={() => setTimePicker(null)} onAccept={acceptClock} /> : null}
    {conflictPrompt ? <ConflictModal conflicts={conflictPrompt.conflicts} allDay={Boolean(form?.all_day)} onCancel={() => setConflictPrompt(null)} onAccept={() => void save(true)} busy={busy} /> : null}
  </main>;
}

function DateTimeField({ label, value, allDay, onDate, onClock }: { label: string; value: string; allDay: boolean; onDate: (date: string) => void; onClock: () => void }) {
  return <div className={styles.dateTimeField}><span>{label}</span><div><label><small>Fecha</small><input type="date" value={localDate(value)} onChange={(event) => onDate(event.target.value)} /></label><label><small>Hora</small><button type="button" className={styles.timeButton} onClick={onClock} disabled={allDay}><Clock3 /> {allDay ? "Todo el día" : formatLocalTime(value)}</button></label></div></div>;
}
function TimePickerModal({ value, onChange, onCancel, onAccept }: { value: TimePickerState; onChange: (value: TimePickerState) => void; onCancel: () => void; onAccept: () => void }) {
  return <div className={`${styles.modalBackdrop} ${styles.nestedBackdrop}`}><section className={styles.timePickerCard}><button className={styles.iconClose} onClick={onCancel} aria-label="Cerrar reloj"><X /></button><p>{value.field === "start_at" ? "HORA DE INICIO" : "HORA DE FIN"}</p><h2>{String(value.hour).padStart(2, "0")}:{String(value.minute).padStart(2, "0")} <small>{value.period}</small></h2><div className={styles.clockFace}>{clockHours.map((hour, index) => <button type="button" key={hour} className={value.hour === hour ? styles.clockHourActive : ""} style={{ "--clock-index": index } as CSSProperties} onClick={() => onChange({ ...value, hour })}>{hour}</button>)}<Clock3 /></div><div className={styles.timePickerControls}><div><span>Minutos</span>{[0, 15, 30, 45].map((minute) => <button key={minute} className={value.minute === minute ? styles.activeTimeChoice : ""} onClick={() => onChange({ ...value, minute })}>{String(minute).padStart(2, "0")}</button>)}</div><div><span>Periodo</span>{(["AM", "PM"] as const).map((period) => <button key={period} className={value.period === period ? styles.activeTimeChoice : ""} onClick={() => onChange({ ...value, period })}>{period}</button>)}</div></div><div className={styles.timePickerActions}><button onClick={onCancel}>Cancelar</button><button className={styles.primaryAction} onClick={onAccept}><Check /> Aceptar</button></div></section></div>;
}
function ConflictModal({ conflicts, allDay, onCancel, onAccept, busy }: { conflicts: EventView[]; allDay: boolean; onCancel: () => void; onAccept: () => void; busy: boolean }) {
  return <div className={`${styles.modalBackdrop} ${styles.nestedBackdrop}`}><section className={styles.conflictCard}><span><AlertTriangle /></span><p>CONFLICTO DE AGENDA</p><h2>{allDay ? "Ese día ya tiene reservas." : "Ese horario ya está ocupado."}</h2><p className={styles.conflictCopy}>{allDay ? "Al marcar Todo el día bloquearás estas actividades durante toda la fecha." : "Revisa las actividades antes de guardar para evitar dos reservas simultáneas."}</p><div>{conflicts.slice(0, 4).map((event) => <article key={event.id}><strong>{event.title}</strong><span>{event.client_name || "Actividad interna"}</span><small>{fullDate(new Date(event.start_at))} · {event.all_day ? "Todo el día" : `${displayTime(event.start_at)} – ${displayTime(event.end_at)}`}</small></article>)}</div><footer><button onClick={onCancel}>Volver y cambiar</button><button className={styles.dangerAction} disabled={busy} onClick={onAccept}>{busy ? <LoaderCircle className={styles.spin} /> : <AlertTriangle />} Guardar de todas formas</button></footer></section></div>;
}
function EventCard({ event, detailed = false, onClick }: { event: EventView; detailed?: boolean; onClick: () => void }) { return <button className={`${styles.eventCard} ${styles[event.type]} ${detailed ? styles.detailedEvent : ""}`} onClick={onClick}><div><span>{typeLabels[event.type]}</span><strong>{event.title}</strong>{event.client_name ? <small>{event.client_name}</small> : null}</div><aside><span><Clock3 /> {event.all_day ? "Todo el día" : `${displayTime(event.start_at)} – ${displayTime(event.end_at)}`}</span>{event.location ? <span><MapPin /> {event.location}</span> : null}{detailed && event.assignees.length > 0 ? <span><UsersRound /> {event.assignees.join(", ")}</span> : null}</aside></button>; }
