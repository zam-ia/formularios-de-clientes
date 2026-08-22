"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, LoaderCircle, Mail, Pencil, Plus, Save, Search, Trash2, UserRoundCheck, UsersRound, X } from "lucide-react";
import type { Employee } from "@/lib/adminData";
import styles from "../os.module.css";

type UserOption = { id: string; displayName: string; email: string | null };
type EmployeeForm = Omit<Employee, "id" | "created_at" | "updated_at" | "rate"> & { id?: string; rate: number | "" };
const contractLabels: Record<Employee["contract_type"], string> = { payroll: "Planilla", freelance: "Freelance", intern: "Practicante", partner: "Socio/a" };
const statusLabels: Record<Employee["status"], string> = { active: "Activo", leave: "De permiso", inactive: "Inactivo" };

async function api<T>(url: string, init?: RequestInit): Promise<T> { const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "No pudimos completar la acción."); return result as T; }
function blankEmployee(): EmployeeForm { return { user_id: "", full_name: "", email: "", phone: "", role_title: "", area: "Producción", contract_type: "freelance", start_date: new Date().toISOString().slice(0, 10), rate: "", currency: "PEN", status: "active", notes: "" }; }
function money(value: number, currency: "PEN" | "USD") { return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value); }

export default function PersonnelAdmin() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [workload, setWorkload] = useState<Record<string, number>>({});
  const [form, setForm] = useState<EmployeeForm | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => { const result = await api<{ employees: Employee[]; users: UserOption[]; workload: Record<string, number> }>("/api/admin/employees"); setEmployees(result.employees); setUsers(result.users); setWorkload(result.workload); }, []);
  useEffect(() => { let cancelled = false; void api<{ employees: Employee[]; users: UserOption[]; workload: Record<string, number> }>("/api/admin/employees").then((result) => { if (!cancelled) { setEmployees(result.employees); setUsers(result.users); setWorkload(result.workload); } }).catch((error) => { if (!cancelled) setNotice(error.message); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);
  const visible = useMemo(() => { const needle = query.trim().toLowerCase(); return employees.filter((employee) => !needle || `${employee.full_name} ${employee.role_title} ${employee.area}`.toLowerCase().includes(needle)); }, [employees, query]);
  const active = employees.filter((employee) => employee.status === "active");
  const totalTasks = Object.values(workload).reduce((sum, value) => sum + value, 0);

  function chooseUser(id: string) { const user = users.find((item) => item.id === id); setForm((current) => current ? { ...current, user_id: id, full_name: current.full_name || user?.displayName || "", email: current.email || user?.email || "" } : current); }
  async function save() { if (!form) return; setBusy(true); setNotice(""); try { await api("/api/admin/employees", { method: form.id ? "PUT" : "POST", body: JSON.stringify({ ...form, rate: Number(form.rate) }) }); await load(); setForm(null); setNotice("Ficha de colaborador guardada."); } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar la ficha."); } finally { setBusy(false); } }
  async function remove() { if (!form?.id || !confirm("¿Eliminar esta ficha de personal? El usuario de acceso no se eliminará.")) return; setBusy(true); try { await api("/api/admin/employees", { method: "DELETE", body: JSON.stringify({ id: form.id }) }); await load(); setForm(null); setNotice("Ficha eliminada."); } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos eliminarla."); } finally { setBusy(false); } }

  return <main className={styles.osPage}>
    <header className={styles.osHeader}><div><Link href="/panel/dashboard"><ArrowLeft size={17} /> Volver al dashboard</Link><p>CRISDAL OS · PERSONAS</p><h1>Equipo y carga de trabajo</h1><span>Centraliza roles, contratos, tarifas y la carga activa de cada colaborador.</span></div><button className={styles.primaryAction} onClick={() => setForm(blankEmployee())}><Plus /> Nuevo colaborador</button></header>
    <section className={styles.metricStrip}><article><UsersRound /><div><strong>{employees.length}</strong><span>personas registradas</span></div></article><article><UserRoundCheck /><div><strong>{active.length}</strong><span>colaboradores activos</span></div></article><article><BriefcaseBusiness /><div><strong>{totalTasks}</strong><span>asignaciones activas</span></div></article></section>
    <div className={styles.searchBar}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, cargo o área…" /></div>
    {notice ? <div className={styles.notice}>{notice}</div> : null}
    {loading ? <div className={styles.loadingBlock}><LoaderCircle className={styles.spin} /> Cargando equipo…</div> : visible.length ? <section className={styles.personnelGrid}>{visible.map((employee) => <button key={employee.id} className={styles.personnelCard} onClick={() => setForm({ ...employee })}><header><span>{employee.full_name.slice(0, 2).toUpperCase()}</span><div><strong>{employee.full_name}</strong><small>{employee.role_title}</small></div><em className={styles[employee.status]}>{statusLabels[employee.status]}</em></header><div className={styles.workloadMeter}><span><small>CARGA ACTUAL</small><strong>{workload[employee.id] || 0} tareas</strong></span><i><b style={{ width: `${Math.min(100, (workload[employee.id] || 0) * 12.5)}%` }} /></i></div><dl><div><dt>Área</dt><dd>{employee.area}</dd></div><div><dt>Contrato</dt><dd>{contractLabels[employee.contract_type]}</dd></div><div><dt>Ingreso</dt><dd>{employee.start_date}</dd></div><div><dt>Tarifa</dt><dd>{money(employee.rate, employee.currency)}</dd></div></dl><footer><span>{employee.email ? <><Mail />{employee.email}</> : "Sin correo"}</span><Pencil /></footer></button>)}</section> : <div className={styles.emptyState}><UsersRound /><h2>Aún no registraste al equipo.</h2><p>Crea fichas y enlázalas con sus usuarios para medir la carga de proyectos.</p><button className={styles.primaryAction} onClick={() => setForm(blankEmployee())}><Plus /> Registrar colaborador</button></div>}
    {form ? <div className={styles.modalBackdrop}><section className={`${styles.modalCard} ${styles.wideModal}`}><button className={styles.iconClose} onClick={() => setForm(null)} aria-label="Cerrar"><X /></button><div className={styles.modalHeading}><span><UsersRound /></span><div><p>Ficha de personal</p><h2>{form.id ? "Editar colaborador" : "Nuevo colaborador"}</h2></div></div><div className={styles.formGrid}>
      <label>Usuario del sistema<select value={form.user_id} onChange={(event) => chooseUser(event.target.value)}><option value="">Sin acceso vinculado</option>{users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select></label><label>Nombre completo<input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></label>
      <label>Correo<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label>Teléfono<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
      <label>Cargo<input value={form.role_title} onChange={(event) => setForm({ ...form, role_title: event.target.value })} placeholder="Ej. Editora audiovisual" /></label><label>Área<input list="areas" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} /><datalist id="areas"><option value="Producción" /><option value="Diseño" /><option value="Marketing" /><option value="Cuentas" /><option value="Administración" /></datalist></label>
      <label>Tipo de contrato<select value={form.contract_type} onChange={(event) => setForm({ ...form, contract_type: event.target.value as Employee["contract_type"] })}>{Object.entries(contractLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Fecha de ingreso<input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} /></label>
      <label>Tarifa / sueldo<input type="number" min="0" step="0.01" value={form.rate} placeholder="Ej. 1500" onChange={(event) => setForm({ ...form, rate: event.target.value === "" ? "" : Number(event.target.value) })} /></label><label>Moneda<select value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value as Employee["currency"] })}><option value="PEN">Soles</option><option value="USD">Dólares</option></select></label>
      <label>Estado<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Employee["status"] })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.fullField}>Notas internas<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></label>
    </div><div className={styles.modalActions}>{form.id ? <button className={styles.dangerAction} onClick={() => void remove()}><Trash2 /> Eliminar ficha</button> : null}<span /><button onClick={() => setForm(null)}>Cancelar</button><button className={styles.primaryAction} onClick={() => void save()} disabled={busy || !form.full_name || !form.role_title || !form.area || form.rate === ""}>{busy ? <LoaderCircle className={styles.spin} /> : <Save />} Guardar ficha</button></div></section></div> : null}
  </main>;
}
