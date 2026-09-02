"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LoaderCircle, Plus, ShieldCheck, UserRoundCog, UsersRound, X } from "lucide-react";
import type { AdminSession } from "@/lib/adminAuth";
import type { AdminRole } from "@/lib/adminData";
import styles from "../os.module.css";

type UserView = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: AdminRole;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};
type FormState = { id?: string; username: string; displayName: string; email: string; role: AdminRole; active: boolean; password: string };
const emptyForm: FormState = { username: "milagros", displayName: "Milagros", email: "", role: "admin", active: true, password: "" };
const roleLabels: Record<AdminRole, string> = { owner: "Propietario", admin: "Administración", editor: "Contenido y cotizaciones", calendar: "Solo agenda", project_manager: "Project Manager", collaborator: "Colaborador creativo", finance: "Finanzas", hr: "Recursos Humanos", sales: "Asesor comercial", supervisor: "Supervisor comercial" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No pudimos completar la acción.");
  return result as T;
}

export default function UsersAdmin({ currentUser }: { currentUser: AdminSession }) {
  const [users, setUsers] = useState<UserView[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const result = await api<{ users: UserView[] }>("/api/admin/users");
    setUsers(result.users);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void api<{ users: UserView[] }>("/api/admin/users")
      .then((result) => {
        if (!cancelled) setUsers(result.users);
      })
      .catch((error) => {
        if (!cancelled) setNotice(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  function startCreate() {
    setForm(emptyForm);
    setNotice("");
    setOpen(true);
  }
  function startEdit(user: UserView) {
    setForm({ id: user.id, username: user.username, displayName: user.displayName, email: user.email || "", role: user.role, active: user.active, password: "" });
    setNotice("");
    setOpen(true);
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await api("/api/admin/users", { method: form.id ? "PUT" : "POST", body: JSON.stringify(form) });
      await load();
      setOpen(false);
      setNotice(form.id ? "Usuario actualizado." : "Usuario creado. Ya puede iniciar sesión en el panel.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos guardar el usuario.");
    } finally { setBusy(false); }
  }

  return <main className={styles.osPage}>
    <header className={styles.osHeader}>
      <div><Link href="/panel"><ArrowLeft size={17} /> Volver al panel</Link><p>CRISDAL OS · SEGURIDAD</p><h1>Usuarios del equipo</h1><span>Crea accesos individuales y evita compartir la contraseña principal.</span></div>
      <button className={styles.primaryAction} onClick={startCreate}><Plus size={18} /> Crear usuario</button>
    </header>

    <section className={styles.metricStrip}>
      <article><UsersRound /><div><strong>{users.length + 1}</strong><span>Accesos registrados</span></div></article>
      <article><ShieldCheck /><div><strong>{users.filter((user) => user.active).length + 1}</strong><span>Usuarios activos</span></div></article>
      <article><UserRoundCog /><div><strong>{currentUser.displayName}</strong><span>Sesión propietaria</span></div></article>
    </section>

    {notice && <div className={styles.notice}>{notice}</div>}
    {loading ? <div className={styles.loadingBlock}><LoaderCircle className={styles.spin} /> Cargando accesos…</div> : <section className={styles.cardGrid}>
      <article className={styles.userCard}>
        <div className={styles.avatarMark}>CA</div><div className={styles.userMain}><strong>Crisdal Agency</strong><span>@{currentUser.username}</span></div><span className={styles.roleBadge}>Propietario</span>
        <p>Acceso maestro configurado mediante las variables privadas del proyecto.</p><small><CheckCircle2 size={14} /> Activo</small>
      </article>
      {users.map((user) => <button type="button" className={styles.userCard} key={user.id} onClick={() => startEdit(user)}>
        <div className={styles.avatarMark}>{user.displayName.slice(0, 2).toUpperCase()}</div><div className={styles.userMain}><strong>{user.displayName}</strong><span>@{user.username}</span></div><span className={styles.roleBadge}>{roleLabels[user.role]}</span>
        <p>{user.email || "Sin correo asociado"}</p><small className={user.active ? "" : styles.inactive}><CheckCircle2 size={14} /> {user.active ? "Activo" : "Desactivado"}</small>
      </button>)}
    </section>}

    {open && <div className={styles.modalBackdrop} role="dialog" aria-modal="true" aria-labelledby="user-form-title">
      <form className={styles.modalCard} onSubmit={save}>
        <button type="button" className={styles.iconClose} onClick={() => setOpen(false)} aria-label="Cerrar"><X /></button>
        <div className={styles.modalHeading}><span><KeyRound /></span><div><p>Acceso administrativo</p><h2 id="user-form-title">{form.id ? "Editar usuario" : "Nuevo usuario"}</h2></div></div>
        <div className={styles.formGrid}>
          <label>Nombre completo<input value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} required minLength={2} /></label>
          <label>Usuario<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase().replace(/\s/g, "") })} required minLength={3} /></label>
          <label>Correo<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Permiso<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as AdminRole })}><option value="admin">Administración</option><option value="supervisor">Supervisor comercial</option><option value="sales">Asesor comercial</option><option value="project_manager">Project Manager / Cuentas</option><option value="collaborator">Colaborador creativo</option><option value="editor">Contenido y cotizaciones</option><option value="finance">Finanzas</option><option value="hr">Recursos Humanos</option><option value="calendar">Solo agenda</option><option value="owner">Propietario</option></select></label>
          <label className={styles.fullField}>{form.id ? "Nueva contraseña (déjala vacía para conservarla)" : "Contraseña temporal"}<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!form.id} minLength={form.password ? 12 : undefined} autoComplete="new-password" /><small>Mínimo 12 caracteres. Compártela con la persona por un canal privado.</small></label>
          {form.id && <label className={styles.checkField}><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Permitir acceso al panel</label>}
        </div>
        <div className={styles.modalActions}><button type="button" onClick={() => setOpen(false)}>Cancelar</button><button className={styles.primaryAction} disabled={busy}>{busy && <LoaderCircle className={styles.spin} />} Guardar usuario</button></div>
      </form>
    </div>}
  </main>;
}
