"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock3,
  Handshake,
  LoaderCircle,
  Network,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { allyCategories } from "@/lib/allies";
import styles from "./admin.module.css";

type Ally = {
  id: string;
  document_type: "DNI" | "RUC";
  document_number: string;
  business_name: string;
  category: string;
  description: string;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string | null;
  status: "pending" | "approved" | "suspended" | "rejected";
  visible: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
};
type Data = { allies: Ally[]; metrics: { total: number; pending: number; active: number; connections: number } };
type Editor = Ally | "new" | null;

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Ocurrió un error.");
  return data as T;
}

export default function AlliesAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [editor, setEditor] = useState<Editor>(null);
  const load = useCallback(() => api<Data>("/api/admin/allies").then(setData).catch((reason) => setError(reason.message)), []);
  useEffect(() => { void load(); }, [load]);

  async function update(id: string, status: Ally["status"]) {
    setBusy(id); setError("");
    try { await api("/api/admin/allies", { method: "PATCH", body: JSON.stringify({ id, status }) }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos actualizar."); }
    finally { setBusy(""); }
  }

  async function remove(ally: Ally) {
    if (!window.confirm(`¿Eliminar definitivamente a ${ally.business_name}?`)) return;
    setBusy(ally.id);
    try { await api("/api/admin/allies", { method: "DELETE", body: JSON.stringify({ id: ally.id }) }); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos eliminar."); }
    finally { setBusy(""); }
  }

  if (!data && !error) return <main className={styles.loading}><LoaderCircle /> Cargando red…</main>;
  return (
    <main className={styles.page}>
      <header>
        <Link href="/panel"><ArrowLeft /> Volver al panel</Link>
        <div><Network /><span>CRISDAL<small>RED DE ALIADOS</small></span></div>
        <button onClick={() => void load()}><RefreshCw /> Actualizar</button>
      </header>
      <section className={styles.content}>
        <div className={styles.titleRow}>
          <div><p className={styles.eyebrow}>Administración</p><h1>Una red que cuidamos juntos.</h1></div>
          <button className={styles.newButton} onClick={() => setEditor("new")}><Plus /> Crear aliado</button>
        </div>
        <div className={styles.metrics}>
          <Metric icon={<Users />} label="Solicitudes" value={data?.metrics.total || 0} />
          <Metric icon={<Clock3 />} label="Pendientes" value={data?.metrics.pending || 0} />
          <Metric icon={<ShieldCheck />} label="Activos" value={data?.metrics.active || 0} />
          <Metric icon={<Handshake />} label="Conexiones" value={data?.metrics.connections || 0} />
        </div>
        {error ? <div className={styles.error}>{error}<button onClick={() => setError("")}><X /></button></div> : null}
        <div className={styles.list}>
          <div className={styles.listHead}><h2>Aliados registrados</h2><span>{data?.allies.length || 0} perfiles</span></div>
          {data?.allies.map((ally) => (
            <article key={ally.id}>
              <div className={styles.avatar}>{ally.business_name.charAt(0)}</div>
              <div className={styles.info}><span>{ally.category}</span><h3>{ally.business_name}</h3><p>{ally.document_type} ••••{ally.document_number.slice(-4)} · {ally.contact_name} · {ally.contact_whatsapp}</p></div>
              <Status value={ally.status} />
              <div className={styles.actions}>
                <button className={styles.editButton} onClick={() => setEditor(ally)}><Pencil /> Editar</button>
                {ally.status !== "approved" ? <button className={styles.approve} disabled={busy === ally.id} onClick={() => void update(ally.id, "approved")}><Check /> Aprobar</button> : <button disabled={busy === ally.id} onClick={() => void update(ally.id, "suspended")}>Suspender</button>}
                <button className={styles.deleteButton} disabled={busy === ally.id} onClick={() => void remove(ally)} aria-label={`Eliminar ${ally.business_name}`}><Trash2 /></button>
              </div>
            </article>
          ))}
          {!data?.allies.length ? <p className={styles.empty}>Todavía no hay perfiles. Puedes crear el primero manualmente.</p> : null}
        </div>
      </section>
      {editor ? <AllyEditor ally={editor === "new" ? null : editor} close={() => setEditor(null)} saved={async () => { setEditor(null); await load(); }} /> : null}
    </main>
  );
}

function AllyEditor({ ally, close, saved }: { ally: Ally | null; close: () => void; saved: () => Promise<void> }) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setWorking(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api("/api/admin/allies", {
        method: ally ? "PUT" : "POST",
        body: JSON.stringify({
          id: ally?.id,
          documentType: form.get("documentType"), documentNumber: form.get("documentNumber"),
          businessName: form.get("businessName"), category: form.get("category"), description: form.get("description"),
          contactName: form.get("contactName"), whatsapp: form.get("whatsapp"), email: form.get("email"),
          status: form.get("status"), visible: form.get("visible") === "on",
        }),
      });
      await saved();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "No pudimos guardar."); }
    finally { setWorking(false); }
  }
  return (
    <div className={styles.editorBackdrop} role="dialog" aria-modal="true" aria-label={ally ? "Editar aliado" : "Crear aliado"}>
      <form className={styles.editor} onSubmit={submit}>
        <header><div><span>{ally ? "EDITAR PERFIL" : "NUEVO PERFIL"}</span><h2>{ally ? ally.business_name : "Crear aliado"}</h2></div><button type="button" onClick={close} aria-label="Cerrar"><X /></button></header>
        <p>El DNI o RUC será su usuario y contraseña temporal. Al ingresar deberá crear una contraseña privada.</p>
        <div className={styles.editorGrid}>
          <label>Documento<select name="documentType" defaultValue={ally?.document_type || "DNI"}><option>DNI</option><option>RUC</option></select></label>
          <label>Número<input name="documentNumber" inputMode="numeric" defaultValue={ally?.document_number || ""} required minLength={8} maxLength={11} /></label>
          <label className={styles.full}>Negocio o empresa<input name="businessName" defaultValue={ally?.business_name || ""} required /></label>
          <label>Rubro<select name="category" defaultValue={ally?.category || allyCategories[0]}>{allyCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
          <label>Estado<select name="status" defaultValue={ally?.status || "approved"}><option value="approved">Activo</option><option value="pending">Pendiente</option><option value="suspended">Suspendido</option><option value="rejected">Rechazado</option></select></label>
          <label>Persona de contacto<input name="contactName" defaultValue={ally?.contact_name || ""} required /></label>
          <label>WhatsApp<input name="whatsapp" defaultValue={ally?.contact_whatsapp || ""} required /></label>
          <label className={styles.full}>Correo<input name="email" type="email" defaultValue={ally?.contact_email || ""} /></label>
          <label className={styles.full}>Descripción<textarea name="description" rows={4} maxLength={500} defaultValue={ally?.description || ""} /></label>
          <label className={`${styles.full} ${styles.visibleCheck}`}><input name="visible" type="checkbox" defaultChecked={ally?.visible ?? true} /> Mostrar este perfil en el directorio privado.</label>
        </div>
        {error ? <div className={styles.error}>{error}</div> : null}
        <footer><button type="button" onClick={close}>Cancelar</button><button className={styles.newButton} disabled={working}>{working ? <LoaderCircle /> : <Check />} Guardar aliado</button></footer>
      </form>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) { return <article>{icon}<span>{label}</span><strong>{value}</strong></article>; }
function Status({ value }: { value: Ally["status"] }) { const labels = { pending: "Pendiente", approved: "Activo", suspended: "Suspendido", rejected: "Rechazado" }; return <span className={`${styles.status} ${styles[value]}`}>{labels[value]}</span>; }
