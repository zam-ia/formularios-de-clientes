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
  RefreshCw,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import styles from "./admin.module.css";
type Ally = {
  id: string;
  document_type: string;
  document_number: string;
  business_name: string;
  category: string;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string | null;
  status: "pending" | "approved" | "suspended" | "rejected";
  visible: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
};
type Data = {
  allies: Ally[];
  metrics: {
    total: number;
    pending: number;
    active: number;
    connections: number;
  };
};
async function api<T>(url: string, init?: RequestInit) {
  const r = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || "Ocurrió un error.");
  return d as T;
}
export default function AlliesAdmin() {
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState("");
  const load = useCallback(
    () =>
      api<Data>("/api/admin/allies")
        .then(setData)
        .catch((e) => setError(e.message)),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function update(id: string, status: Ally["status"]) {
    setBusy(id);
    setError("");
    try {
      await api("/api/admin/allies", {
        method: "PATCH",
        body: JSON.stringify({ id, status }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos actualizar.");
    } finally {
      setBusy("");
    }
  }
  if (!data && !error)
    return (
      <main className={styles.loading}>
        <LoaderCircle /> Cargando red…
      </main>
    );
  return (
    <main className={styles.page}>
      <header>
        <Link href="/panel">
          <ArrowLeft /> Volver al panel
        </Link>
        <div>
          <Network />
          <span>
            CRISDAL<small>RED DE ALIADOS</small>
          </span>
        </div>
        <button onClick={() => void load()}>
          <RefreshCw /> Actualizar
        </button>
      </header>
      <section className={styles.content}>
        <p className={styles.eyebrow}>Administración</p>
        <h1>Una red que cuidamos juntos.</h1>
        <div className={styles.metrics}>
          <Metric
            icon={<Users />}
            label="Solicitudes"
            value={data?.metrics.total || 0}
          />
          <Metric
            icon={<Clock3 />}
            label="Pendientes"
            value={data?.metrics.pending || 0}
          />
          <Metric
            icon={<ShieldCheck />}
            label="Activos"
            value={data?.metrics.active || 0}
          />
          <Metric
            icon={<Handshake />}
            label="Conexiones"
            value={data?.metrics.connections || 0}
          />
        </div>
        {error ? (
          <div className={styles.error}>
            {error}
            <button onClick={() => setError("")}>
              <X />
            </button>
          </div>
        ) : null}
        <div className={styles.list}>
          <div className={styles.listHead}>
            <h2>Clientes registrados</h2>
            <span>{data?.allies.length || 0} perfiles</span>
          </div>
          {data?.allies.map((ally) => (
            <article key={ally.id}>
              <div className={styles.avatar}>
                {ally.business_name.charAt(0)}
              </div>
              <div className={styles.info}>
                <span>{ally.category}</span>
                <h3>{ally.business_name}</h3>
                <p>
                  {ally.document_type} {ally.document_number} ·{" "}
                  {ally.contact_name} · {ally.contact_whatsapp}
                </p>
              </div>
              <Status value={ally.status} />
              <div className={styles.actions}>
                {ally.status !== "approved" ? (
                  <button
                    className={styles.approve}
                    disabled={busy === ally.id}
                    onClick={() => void update(ally.id, "approved")}
                  >
                    <Check /> Aprobar
                  </button>
                ) : (
                  <button
                    disabled={busy === ally.id}
                    onClick={() => void update(ally.id, "suspended")}
                  >
                    Suspender
                  </button>
                )}
                {ally.status === "pending" ? (
                  <button
                    disabled={busy === ally.id}
                    onClick={() => void update(ally.id, "rejected")}
                  >
                    Rechazar
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article>
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
function Status({ value }: { value: Ally["status"] }) {
  const labels = {
    pending: "Pendiente",
    approved: "Activo",
    suspended: "Suspendido",
    rejected: "Rechazado",
  };
  return (
    <span className={`${styles.status} ${styles[value]}`}>{labels[value]}</span>
  );
}
