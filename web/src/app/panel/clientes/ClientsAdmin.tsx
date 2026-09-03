"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarClock, CircleDollarSign, LoaderCircle, MessageCircle, Pencil, Plus, Save, Search, Trash2, UserRoundCheck, UsersRound, X } from "lucide-react";
import type { AgencyClient, ClientStatus, FinanceAccount, QuotePlan } from "@/lib/adminData";
import styles from "../os.module.css";

type ClientForm = Omit<AgencyClient, "id" | "created_by" | "created_at" | "updated_at" | "monthly_fee"> & { id?: string; monthly_fee: number | "" };
type AdvisorOption = { id: string; displayName: string; role: string };
type ClientDataResponse = { clients: AgencyClient[]; plans: QuotePlan[]; advisors: AdvisorOption[]; canAssign: boolean };
const statusLabels: Record<ClientStatus, string> = { lead: "Prospecto", active: "Activo", paused: "Pausado", completed: "Finalizado" };
const accountLabels: Record<FinanceAccount, string> = { bcp: "BCP", bbva: "BBVA", interbank: "Interbank", cash: "Efectivo", other: "Otra cuenta" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No pudimos completar la acción.");
  return result as T;
}
function dateString(value: Date) { return value.toISOString().slice(0, 10); }
function blankClient(): ClientForm {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { company_name: "", contact_name: "", whatsapp: "", email: "", plan_name: "", monthly_fee: "", currency: "PEN", payment_account: "bcp", start_date: dateString(start), end_date: dateString(end), status: "active", notes: "", advisor_id: "", advisor_name: "" };
}
function money(value: number, currency: "PEN" | "USD") { return new Intl.NumberFormat("es-PE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value); }

export default function ClientsAdmin({ readOnly = false }: { readOnly?: boolean }) {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [plans, setPlans] = useState<QuotePlan[]>([]);
  const [advisors, setAdvisors] = useState<AdvisorOption[]>([]);
  const [canAssign, setCanAssign] = useState(false);
  const [form, setForm] = useState<ClientForm | null>(null);
  const [query, setQuery] = useState("");
  const [advisorFilter, setAdvisorFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [openedAt] = useState(() => Date.now());

  const load = useCallback(async () => {
    const result = await api<ClientDataResponse>("/api/admin/clients");
    setClients(result.clients);
    setPlans(result.plans);
    setAdvisors(result.advisors);
    setCanAssign(result.canAssign);
  }, []);
  useEffect(() => {
    let cancelled = false;
    void api<ClientDataResponse>("/api/admin/clients").then((result) => {
      if (!cancelled) { setClients(result.clients); setPlans(result.plans); setAdvisors(result.advisors); setCanAssign(result.canAssign); }
    }).catch((error) => { if (!cancelled) setNotice(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return clients.filter((client) => {
      const matchesAdvisor = advisorFilter === "all" || (advisorFilter === "unassigned" ? !client.advisor_id : client.advisor_id === advisorFilter);
      const matchesQuery = !needle || `${client.company_name} ${client.contact_name} ${client.plan_name} ${client.advisor_name || ""}`.toLowerCase().includes(needle);
      return matchesAdvisor && matchesQuery;
    });
  }, [advisorFilter, clients, query]);
  const active = clients.filter((client) => client.status === "active");
  const expiring = active.filter((client) => {
    const remaining = new Date(`${client.end_date}T23:59:59`).getTime() - openedAt;
    return remaining >= 0 && remaining <= 30 * 86400000;
  });

  async function save() {
    if (!form) return;
    setBusy(true); setNotice("");
    try {
      const result = await api<{ client: AgencyClient }>("/api/admin/clients", { method: form.id ? "PUT" : "POST", body: JSON.stringify({ ...form, monthly_fee: Math.round(Number(form.monthly_fee)) }) });
      setClients((current) => [...current.filter((client) => client.id !== result.client.id), result.client].toSorted((a, b) => a.company_name.localeCompare(b.company_name)));
      setForm(null); setNotice("Cliente guardado y actualizado en todo el sistema."); void load().catch(() => undefined);
    } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar el cliente."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!form?.id || !confirm("¿Eliminar este cliente?")) return;
    setBusy(true);
    try { await api("/api/admin/clients", { method: "DELETE", body: JSON.stringify({ id: form.id }) }); await load(); setForm(null); setNotice("Cliente eliminado."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos eliminarlo."); }
    finally { setBusy(false); }
  }
  function choosePlan(name: string) {
    const plan = plans.find((item) => item.name === name);
    setForm((current) => current ? { ...current, plan_name: name, monthly_fee: plan?.price ?? current.monthly_fee } : current);
  }

  return <main className={styles.osPage}>
    <header className={styles.osHeader}><div><Link href="/panel/dashboard"><ArrowLeft size={17} /> Volver al dashboard</Link><p>CRISDAL OS · CLIENTES</p><h1>Clientes y planes</h1><span>Centraliza contactos, servicios, mensualidades y fechas de renovación.</span></div>{readOnly ? null : <button className={styles.primaryAction} onClick={() => setForm(blankClient())}><Plus /> Registrar cliente</button>}</header>
    <section className={styles.metricStrip}>
      <article><UsersRound /><div><strong>{clients.length}</strong><span>clientes registrados</span></div></article>
      <article><UserRoundCheck /><div><strong>{active.length}</strong><span>planes activos</span></div></article>
      <article><CalendarClock /><div><strong>{expiring.length}</strong><span>vencen en 30 días</span></div></article>
    </section>
    <div className={styles.clientToolbar}><div className={styles.searchBar}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar empresa, contacto, plan o asesor…" /></div><select value={advisorFilter} onChange={(event) => setAdvisorFilter(event.target.value)}><option value="all">Todos los asesores</option><option value="unassigned">Sin asesor asignado</option>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.displayName}</option>)}</select></div>
    {notice ? <div className={styles.notice}>{notice}</div> : null}
    {loading ? <div className={styles.loadingBlock}><LoaderCircle className={styles.spin} /> Cargando clientes…</div> : visible.length ? <section className={styles.clientGrid}>{visible.map((client) => <article className={styles.clientCard} key={client.id}><header><span className={styles.clientAvatar}>{client.company_name.slice(0, 2).toUpperCase()}</span><div><strong>{client.company_name}</strong><small>{client.contact_name}</small></div><em className={styles[client.status]}>{statusLabels[client.status]}</em></header><div className={styles.clientAdvisor}><UserRoundCheck /><span><small>ASESOR RESPONSABLE</small><strong>{client.advisor_name || "Sin asignar"}</strong></span></div><div className={styles.clientPlan}><span>PLAN ACTUAL</span><strong>{client.plan_name}</strong><small>{money(client.monthly_fee, client.currency)} · {accountLabels[client.payment_account]}</small></div><div className={styles.clientDates}><span><small>Inicio</small>{client.start_date}</span><span><small>Finaliza</small>{client.end_date}</span></div><footer>{client.whatsapp ? <a href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle /> WhatsApp</a> : <span /> }<Link href="/panel/finanzas"><CircleDollarSign /> Finanzas</Link>{readOnly ? null : <button onClick={() => setForm({ ...client })}><Pencil /> Editar</button>}</footer></article>)}</section> : <div className={styles.emptyState}><UsersRound /><h2>No encontramos clientes.</h2><p>Prueba otro asesor o término de búsqueda.</p>{readOnly || clients.length ? null : <button className={styles.primaryAction} onClick={() => setForm(blankClient())}><Plus /> Registrar cliente</button>}</div>}
    {form ? <div className={styles.modalBackdrop}><section className={`${styles.modalCard} ${styles.wideModal}`}><button className={styles.iconClose} onClick={() => setForm(null)} aria-label="Cerrar"><X /></button><div className={styles.modalHeading}><span><UsersRound /></span><div><p>Ficha comercial</p><h2>{form.id ? "Editar cliente" : "Nuevo cliente"}</h2></div></div><div className={styles.formGrid}>
      <label>Empresa / marca<input value={form.company_name} onChange={(event) => setForm({ ...form, company_name: event.target.value })} /></label><label>Persona de contacto<input value={form.contact_name} onChange={(event) => setForm({ ...form, contact_name: event.target.value })} /></label>
      <label>WhatsApp<input value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} placeholder="519…" /></label><label>Correo<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
      <label>Plan<input list="client-plan-options" value={form.plan_name} onChange={(event) => choosePlan(event.target.value)} /><datalist id="client-plan-options">{plans.map((plan) => <option key={plan.id} value={plan.name} />)}</datalist></label><label>Mensualidad<input type="number" min="0" step="1" value={form.monthly_fee} placeholder="Ej. 850" onChange={(event) => setForm({ ...form, monthly_fee: event.target.value === "" ? "" : Number(event.target.value) })} /></label>
      <label>Moneda<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as ClientForm["currency"] })}><option value="PEN">Soles</option><option value="USD">Dólares</option></select></label><label>Cuenta de ingreso<select value={form.payment_account} onChange={(event) => setForm({ ...form, payment_account: event.target.value as FinanceAccount })}>{Object.entries(accountLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {canAssign ? <label>Asesor responsable<select value={form.advisor_id || ""} onChange={(event) => { const advisor = advisors.find((item) => item.id === event.target.value); setForm({ ...form, advisor_id: event.target.value, advisor_name: advisor?.displayName || "" }); }}><option value="">Sin asignar</option>{advisors.map((advisor) => <option key={advisor.id} value={advisor.id}>{advisor.displayName}</option>)}</select><small>Puedes reasignarlo sin perder quién registró la ficha.</small></label> : form.advisor_name ? <label>Asesor responsable<input value={form.advisor_name} disabled /></label> : null}
      <label>Inicio del plan<input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /></label><label>Fin del plan<input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} /></label>
      <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ClientStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.fullField}>Notas<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
    </div><div className={styles.modalActions}>{form.id ? <button className={styles.dangerAction} onClick={() => void remove()}><Trash2 /> Eliminar</button> : null}<span /><button onClick={() => setForm(null)}>Cancelar</button><button className={styles.primaryAction} disabled={busy || !form.company_name || !form.contact_name || !form.plan_name || form.monthly_fee === ""} onClick={() => void save()}>{busy ? <LoaderCircle className={styles.spin} /> : <Save />} Guardar</button></div></section></div> : null}
  </main>;
}
