"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, CalendarClock, CheckCircle2, Columns3, GripVertical, List, LoaderCircle, Pencil, Plus, Save, Search, Settings2, Trash2, UserRound, X } from "lucide-react";
import type { AdminRole, AgencyClient, ProjectColumn, ProjectTask } from "@/lib/adminData";
import styles from "../os.module.css";

type UserView = { id: string; displayName: string; username: string };
type ProjectsResponse = { columns: ProjectColumn[]; tasks: ProjectTask[]; clients: AgencyClient[]; users: UserView[]; currentUserId: string };
type TaskForm = Omit<ProjectTask, "id" | "created_by" | "created_by_name" | "created_at" | "updated_at"> & { id?: string };
type ColumnForm = Pick<ProjectColumn, "name" | "color"> & { id?: string };
const priorityLabels: Record<ProjectTask["priority"], string> = { low: "Baja", medium: "Media", high: "Alta", urgent: "Urgente" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No pudimos completar la acción.");
  return result as T;
}
function dateAfter(days: number) { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function blankTask(clientId: string, columnId: string): TaskForm { return { client_id: clientId, column_id: columnId, title: "", description: "", content_type: "Reel", priority: "medium", due_date: dateAfter(7), assignees: [], labels: [], checklist: [] }; }

export default function ProjectsAdmin({ role }: { role: AdminRole }) {
  const [data, setData] = useState<ProjectsResponse>({ columns: [], tasks: [], clients: [], users: [], currentUserId: "" });
  const [form, setForm] = useState<TaskForm | null>(null);
  const [columnForm, setColumnForm] = useState<ColumnForm | null>(null);
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"board" | "list">("board");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const canCreate = role !== "collaborator";

  const load = useCallback(async () => { setData(await api<ProjectsResponse>("/api/admin/projects")); }, []);
  useEffect(() => { let cancelled = false; void api<ProjectsResponse>("/api/admin/projects").then((response) => { if (!cancelled) setData(response); }).catch((error) => { if (!cancelled) setNotice(error.message); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return data.tasks.filter((task) => (clientFilter === "all" || task.client_id === clientFilter) && (assigneeFilter === "all" || task.assignees.includes(assigneeFilter)) && (!needle || `${task.title} ${task.description} ${task.content_type} ${task.labels.join(" ")}`.toLowerCase().includes(needle)));
  }, [assigneeFilter, clientFilter, data.tasks, query]);
  const today = new Date().toISOString().slice(0, 10);
  const finalColumnId = data.columns.toSorted((a, b) => b.order - a.order)[0]?.id;
  const overdue = data.tasks.filter((task) => task.due_date && task.due_date < today && task.column_id !== finalColumnId).length;
  const completed = data.tasks.filter((task) => task.column_id === finalColumnId).length;
  const clientName = (id: string) => data.clients.find((client) => client.id === id)?.company_name || "Cliente";
  const assigneeName = (id: string) => data.users.find((user) => user.id === id)?.displayName || "Equipo";

  function startCreate(columnId = data.columns[0]?.id || "todo") { setForm(blankTask(clientFilter === "all" ? data.clients[0]?.id || "" : clientFilter, columnId)); setNotice(""); }
  async function save() {
    if (!form) return;
    setBusy(true); setNotice("");
    try { await api("/api/admin/projects", { method: form.id ? "PUT" : "POST", body: JSON.stringify(form) }); await load(); setForm(null); setNotice(form.id ? "Tarea actualizada." : "Tarea creada en el tablero."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar la tarea."); }
    finally { setBusy(false); }
  }
  async function updateColumn(task: ProjectTask, columnId: string) {
    if (task.column_id === columnId) return;
    setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === task.id ? { ...item, column_id: columnId } : item) }));
    try { await api("/api/admin/projects", { method: "PUT", body: JSON.stringify({ ...task, column_id: columnId }) }); setNotice("Tarea movida."); }
    catch (error) { await load(); setNotice(error instanceof Error ? error.message : "No pudimos mover la tarea."); }
  }
  async function remove() {
    if (!form?.id || !confirm("¿Eliminar esta tarea y su checklist?")) return;
    setBusy(true);
    try { await api("/api/admin/projects", { method: "DELETE", body: JSON.stringify({ id: form.id }) }); await load(); setForm(null); setNotice("Tarea eliminada."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos eliminarla."); }
    finally { setBusy(false); }
  }
  async function saveColumn() {
    if (!columnForm) return;
    setBusy(true); setNotice("");
    try { await api("/api/admin/projects/columns", { method: columnForm.id ? "PUT" : "POST", body: JSON.stringify(columnForm) }); await load(); setColumnForm(null); setNotice("Flujo de trabajo actualizado."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar la etapa."); }
    finally { setBusy(false); }
  }
  async function removeColumn() {
    if (!columnForm?.id || !confirm("¿Eliminar esta etapa? Sus tareas se moverán a la primera etapa disponible.")) return;
    setBusy(true);
    try { await api("/api/admin/projects/columns", { method: "DELETE", body: JSON.stringify({ id: columnForm.id }) }); await load(); setColumnForm(null); setNotice("Etapa eliminada y tareas reubicadas."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos eliminar la etapa."); }
    finally { setBusy(false); }
  }
  function toggleAssignee(id: string) { if (!form) return; setForm({ ...form, assignees: form.assignees.includes(id) ? form.assignees.filter((item) => item !== id) : [...form.assignees, id] }); }

  return <main className={styles.osPage}>
    <header className={styles.osHeader}><div><Link href="/panel/dashboard"><ArrowLeft size={17} /> Volver al dashboard</Link><p>CRISDAL OS · PRODUCCIÓN</p><h1>Proyectos y contenidos</h1><span>Controla el avance de cada pieza, responsable y fecha de entrega en un tablero único.</span></div>{canCreate ? <div className={styles.headerButtonGroup}><button className={styles.secondaryAction} onClick={() => setColumnForm({ name: "", color: "#ffbd18" })}><Settings2 /> Configurar flujo</button><button className={styles.primaryAction} onClick={() => startCreate()} disabled={!data.clients.length}><Plus /> Nueva tarea</button></div> : null}</header>
    <section className={styles.metricStrip}><article><Columns3 /><div><strong>{data.tasks.length}</strong><span>tareas registradas</span></div></article><article><AlertTriangle /><div><strong>{overdue}</strong><span>tareas atrasadas</span></div></article><article><CheckCircle2 /><div><strong>{completed}</strong><span>contenidos publicados</span></div></article></section>
    <section className={styles.projectToolbar}><div className={styles.searchBar}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar tarea, formato o etiqueta…" /></div><select value={clientFilter} onChange={(event) => setClientFilter(event.target.value)}><option value="all">Todos los clientes</option>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.company_name}</option>)}</select><select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}><option value="all">Todo el equipo</option>{data.users.map((user) => <option key={user.id} value={user.id}>{user.displayName}</option>)}</select><div className={styles.segmented}><button className={view === "board" ? styles.activeSegment : ""} onClick={() => setView("board")}><Columns3 /> Tablero</button><button className={view === "list" ? styles.activeSegment : ""} onClick={() => setView("list")}><List /> Lista</button></div></section>
    {notice ? <div className={styles.notice}>{notice}</div> : null}
    {loading ? <div className={styles.loadingBlock}><LoaderCircle className={styles.spin} /> Preparando proyectos…</div> : !data.clients.length ? <div className={styles.emptyState}><Columns3 /><h2>Primero registra un cliente.</h2><p>Cada tarea necesita estar vinculada a una cuenta para mostrar su avance y rentabilidad.</p><Link className={styles.primaryAction} href="/panel/clientes"><Plus /> Ir a clientes</Link></div> : view === "board" ? <section className={styles.kanbanBoard}>{data.columns.map((column) => { const tasks = visible.filter((task) => task.column_id === column.id); return <article className={styles.kanbanColumn} key={column.id} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { const task = data.tasks.find((item) => item.id === event.dataTransfer.getData("text/task-id")); if (task) void updateColumn(task, column.id); }}><header style={{ "--column-color": column.color } as React.CSSProperties}><span><i />{column.name}</span><strong>{tasks.length}</strong></header><div>{tasks.map((task) => <button draggable key={task.id} className={`${styles.taskCard} ${task.due_date && task.due_date < today && task.column_id !== finalColumnId ? styles.taskOverdue : ""}`} onDragStart={(event) => event.dataTransfer.setData("text/task-id", task.id)} onClick={() => setForm({ ...task })}><span className={`${styles.priorityBadge} ${styles[task.priority]}`}>{priorityLabels[task.priority]}</span><h3>{task.title}</h3><p>{clientName(task.client_id)} · {task.content_type}</p>{task.labels.length ? <div>{task.labels.map((label) => <em key={label}>{label}</em>)}</div> : null}<footer><span><CalendarClock />{task.due_date || "Sin fecha"}</span><span>{task.assignees.slice(0, 3).map((id) => <i key={id} title={assigneeName(id)}>{assigneeName(id).slice(0, 2).toUpperCase()}</i>)}</span><GripVertical /></footer></button>)}{canCreate ? <button className={styles.kanbanAdd} onClick={() => startCreate(column.id)}><Plus /> Agregar tarea</button> : null}</div></article>; })}</section> : <section className={styles.taskList}>{visible.map((task) => <button key={task.id} onClick={() => setForm({ ...task })}><span className={`${styles.priorityBadge} ${styles[task.priority]}`}>{priorityLabels[task.priority]}</span><div><strong>{task.title}</strong><small>{clientName(task.client_id)} · {task.content_type}</small></div><em>{data.columns.find((column) => column.id === task.column_id)?.name}</em><span><CalendarClock /> {task.due_date || "Sin fecha"}</span><Pencil /></button>)}</section>}

    {form ? <div className={styles.modalBackdrop}><section className={`${styles.modalCard} ${styles.wideModal}`}><button className={styles.iconClose} onClick={() => setForm(null)} aria-label="Cerrar"><X /></button><div className={styles.modalHeading}><span><Columns3 /></span><div><p>Producción por cliente</p><h2>{form.id ? "Editar tarea" : "Nueva tarea"}</h2></div></div><div className={styles.formGrid}>
      <label>Cliente<select value={form.client_id} onChange={(event) => setForm({ ...form, client_id: event.target.value })}>{data.clients.map((client) => <option key={client.id} value={client.id}>{client.company_name}</option>)}</select></label><label>Etapa<select value={form.column_id} onChange={(event) => setForm({ ...form, column_id: event.target.value })}>{data.columns.map((column) => <option key={column.id} value={column.id}>{column.name}</option>)}</select></label>
      <label className={styles.fullField}>Título<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Ej. Reel: lanzamiento de campaña" /></label><label>Tipo de contenido<input list="content-types" value={form.content_type} onChange={(event) => setForm({ ...form, content_type: event.target.value })} /><datalist id="content-types"><option value="Reel" /><option value="Diseño" /><option value="Fotografía" /><option value="Spot" /><option value="Artículo" /><option value="Campaña" /></datalist></label><label>Prioridad<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as ProjectTask["priority"] })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Fecha límite<input type="date" value={form.due_date} onChange={(event) => setForm({ ...form, due_date: event.target.value })} /></label><label>Etiquetas<input value={form.labels.join(", ")} onChange={(event) => setForm({ ...form, labels: event.target.value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12) })} placeholder="Urgente, Grabación pendiente" /></label>
      <label className={styles.fullField}>Descripción<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><label className={styles.fullField}>Checklist (una línea por punto)<textarea value={form.checklist.map((item) => item.text).join("\n")} onChange={(event) => { const previous = new Map(form.checklist.map((item) => [item.text, item])); setForm({ ...form, checklist: event.target.value.split("\n").map((text) => text.trim()).filter(Boolean).map((text) => previous.get(text) || { id: crypto.randomUUID(), text, completed: false }) }); }} /></label>
      <fieldset className={`${styles.fullField} ${styles.assigneePicker}`}><legend>Responsables</legend>{data.users.map((user) => <label key={user.id}><input type="checkbox" checked={form.assignees.includes(user.id)} onChange={() => toggleAssignee(user.id)} /><span><UserRound />{user.displayName}</span></label>)}</fieldset>
    </div><div className={styles.modalActions}>{form.id && canCreate ? <button className={styles.dangerAction} onClick={() => void remove()}><Trash2 /> Eliminar</button> : null}<span /><button onClick={() => setForm(null)}>Cancelar</button><button className={styles.primaryAction} disabled={busy || !form.client_id || !form.title || !form.content_type} onClick={() => void save()}>{busy ? <LoaderCircle className={styles.spin} /> : <Save />} Guardar tarea</button></div></section></div> : null}
    {columnForm ? <div className={styles.modalBackdrop}><section className={styles.modalCard}><button className={styles.iconClose} onClick={() => setColumnForm(null)} aria-label="Cerrar"><X /></button><div className={styles.modalHeading}><span><Settings2 /></span><div><p>Flujo configurable</p><h2>{columnForm.id ? "Editar etapa" : "Configurar etapas"}</h2></div></div>{!columnForm.id ? <div className={styles.columnPicker}>{data.columns.map((column) => <button key={column.id} onClick={() => setColumnForm({ id: column.id, name: column.name, color: column.color })}><i style={{ background: column.color }} /><span>{column.name}<small>{data.tasks.filter((task) => task.column_id === column.id).length} tareas</small></span><Pencil /></button>)}</div> : null}<div className={styles.formGrid}><label>Nombre de la etapa<input value={columnForm.name} onChange={(event) => setColumnForm({ ...columnForm, name: event.target.value })} placeholder="Ej. Programado" /></label><label>Color<input type="color" value={columnForm.color} onChange={(event) => setColumnForm({ ...columnForm, color: event.target.value })} /></label></div><div className={styles.modalActions}>{columnForm.id ? <button className={styles.dangerAction} onClick={() => void removeColumn()}><Trash2 /> Eliminar</button> : null}<span />{columnForm.id ? <button onClick={() => setColumnForm({ name: "", color: "#ffbd18" })}><Plus /> Nueva etapa</button> : null}<button onClick={() => setColumnForm(null)}>Cancelar</button><button className={styles.primaryAction} disabled={busy || !columnForm.name} onClick={() => void saveColumn()}>{busy ? <LoaderCircle className={styles.spin} /> : <Save />} {columnForm.id ? "Guardar" : "Crear etapa"}</button></div></section></div> : null}
  </main>;
}
