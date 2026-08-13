"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BarChart3, Check, Coins, Gift, LoaderCircle, Plus, RefreshCw, Save, Snowflake, Sparkles, X } from "lucide-react";
import styles from "./loyalty.module.css";

type Ally = { id: string; businessName: string; status: string; loyaltyStatus: "active" | "frozen"; balance: number; reserved: number; available: number; services: number; metrics: number };
type Reward = { id: string; title: string; description: string; category: string; points: number; active: boolean; stock: number | null; image_url: string | null };
type Redemption = { id: string; ally_id: string; reward_title: string; points: number; status: "pending" | "approved" | "rejected" | "delivered"; requested_at: string; note: string };
type Data = { allies: Ally[]; rewards: Reward[]; redemptions: Redemption[]; movements: Array<{ id: string; ally_id: string; points: number; reference: string; created_at: string }>; services: Array<{ id: string; ally_id: string; period: string; plan: string; amount_paid: number; points_awarded: number }>; metrics: Array<{ id: string; ally_id: string; period: string; reach: number; audience: number; leads: number; roi: number | null }> };
type Tab = "clients" | "rewards" | "redemptions";

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No pudimos completar la acción.");
  return data as T;
}
function number(form: FormData, key: string, nullable = false) {
  const value = String(form.get(key) || "").trim();
  return nullable && !value ? null : Number(value || 0);
}

export default function LoyaltyAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>("clients");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [rewardEditor, setRewardEditor] = useState<Reward | "new" | null>(null);
  const load = useCallback(async () => {
    try {
      const next = await api<Data>("/api/admin/loyalty");
      setData(next);
      setSelectedId((current) => current || next.allies.find((ally) => ally.status === "approved")?.id || next.allies[0]?.id || "");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos cargar el módulo."); }
  }, []);
  useEffect(() => {
    void api<Data>("/api/admin/loyalty")
      .then((next) => {
        setData(next);
        setSelectedId(next.allies.find((ally) => ally.status === "approved")?.id || next.allies[0]?.id || "");
      })
      .catch((error) => setNotice(error instanceof Error ? error.message : "No pudimos cargar el módulo."));
  }, []);
  const selected = data?.allies.find((ally) => ally.id === selectedId) || null;
  const allyName = useCallback((id: string) => data?.allies.find((ally) => ally.id === id)?.businessName || "Aliado", [data]);
  const monthlyPoints = useMemo(() => data?.services.filter((item) => item.ally_id === selectedId).reduce((total, item) => total + item.points_awarded, 0) || 0, [data, selectedId]);

  async function send(payload: object, success: string) {
    setBusy(true); setNotice("");
    try { await api("/api/admin/loyalty", { method: "POST", body: JSON.stringify(payload) }); await load(); setNotice(success); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar."); }
    finally { setBusy(false); }
  }
  async function addService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await send({ action: "service", allyId: selectedId, period: form.get("period"), plan: form.get("plan"), services: form.get("services"), amountPaid: number(form, "amountPaid"), notes: form.get("notes") }, "Servicio registrado y puntos acreditados.");
    event.currentTarget.reset();
  }
  async function addMetric(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await send({ action: "metric", allyId: selectedId, period: form.get("period"), reach: number(form, "reach"), audience: number(form, "audience"), audienceGrowth: number(form, "audienceGrowth"), organicGrowth: number(form, "organicGrowth"), engagement: number(form, "engagement"), leads: number(form, "leads"), sales: number(form, "sales", true), revenue: number(form, "revenue", true), adSpend: number(form, "adSpend", true), notes: form.get("notes") }, "Métricas del periodo actualizadas.");
  }
  async function addAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    await send({ action: "adjustment", allyId: selectedId, points: number(form, "points"), reference: form.get("reference") }, "Ajuste de puntos registrado.");
    event.currentTarget.reset();
  }
  if (!data) return <main className={styles.loading}><LoaderCircle /> Cargando fidelización…</main>;
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/panel/aliados"><ArrowLeft /> Red de aliados</Link>
        <div><Coins /><span>CRISDAL<small>PUNTOS & RESULTADOS</small></span></div>
        <button onClick={() => void load()}><RefreshCw /> Actualizar</button>
      </header>
      <section className={styles.content}>
        <div className={styles.hero}><div><p>FIDELIZACIÓN CRISDAL</p><h1>Lo que crece, se reconoce.</h1><span>Registra servicios pagados, resultados y beneficios desde un solo lugar.</span></div><Coins /></div>
        <nav className={styles.tabs}>
          <button className={tab === "clients" ? styles.active : ""} onClick={() => setTab("clients")}><BarChart3 /> Clientes y métricas</button>
          <button className={tab === "rewards" ? styles.active : ""} onClick={() => setTab("rewards")}><Gift /> Premios</button>
          <button className={tab === "redemptions" ? styles.active : ""} onClick={() => setTab("redemptions")}><Sparkles /> Canjes <b>{data.redemptions.filter((item) => item.status === "pending").length}</b></button>
        </nav>
        {notice ? <div className={styles.notice}>{notice}<button onClick={() => setNotice("")}><X /></button></div> : null}

        {tab === "clients" ? (
          <div className={styles.clientLayout}>
            <aside className={styles.clientList}><h2>Clientes</h2>{data.allies.map((ally) => <button key={ally.id} className={selectedId === ally.id ? styles.selected : ""} onClick={() => setSelectedId(ally.id)}><span>{ally.businessName.charAt(0)}</span><div><strong>{ally.businessName}</strong><small>{ally.available} puntos disponibles</small></div></button>)}</aside>
            {selected ? <div className={styles.clientPanel}>
              <div className={styles.clientHead}><div><p>CUENTA DEL ALIADO</p><h2>{selected.businessName}</h2></div><button className={selected.loyaltyStatus === "frozen" ? styles.unfreeze : styles.freeze} onClick={() => void send({ action: "loyalty-status", allyId: selected.id, status: selected.loyaltyStatus === "active" ? "frozen" : "active" }, selected.loyaltyStatus === "active" ? "Puntos congelados." : "Cuenta reactivada.")}><Snowflake /> {selected.loyaltyStatus === "active" ? "Congelar" : "Reactivar"}</button></div>
              <div className={styles.balanceGrid}><article><span>Disponibles</span><strong>{selected.available}</strong><small>puntos</small></article><article><span>Reservados</span><strong>{selected.reserved}</strong><small>en canjes</small></article><article><span>Histórico ganado</span><strong>{monthlyPoints}</strong><small>por servicios</small></article></div>
              <div className={styles.forms}>
                <form onSubmit={addService}><div className={styles.formTitle}><Plus /><div><h3>Registrar servicio pagado</h3><p>El sistema acredita 1 punto por cada S/10.</p></div></div><div className={styles.grid}><label>Mes<input name="period" type="month" required /></label><label>Plan<input name="plan" required placeholder="Plan Automatización IA" /></label><label className={styles.full}>Servicios adquiridos<input name="services" required placeholder="Contenido, pauta, automatización…" /></label><label>Monto pagado (S/)<input name="amountPaid" type="number" min="0" step="0.01" required /></label><label>Nota<input name="notes" placeholder="Opcional" /></label></div><button disabled={busy}><Save /> Registrar y acreditar</button></form>
                <form onSubmit={addAdjustment}><div className={styles.formTitle}><Coins /><div><h3>Ajuste manual</h3><p>Para bonos, correcciones o vencimientos.</p></div></div><div className={styles.grid}><label>Puntos<input name="points" type="number" required placeholder="Ej. 100 o -50" /></label><label>Motivo<input name="reference" required placeholder="Bono de campaña" /></label></div><button disabled={busy}><Save /> Guardar ajuste</button></form>
              </div>
              <form className={styles.metricForm} onSubmit={addMetric}><div className={styles.formTitle}><BarChart3 /><div><h3>Resultados del mes</h3><p>Actualiza alcance, crecimiento, oportunidades, ventas y ROI.</p></div></div><div className={styles.metricGrid}><label>Mes<input name="period" type="month" required /></label><label>Alcance<input name="reach" type="number" min="0" required /></label><label>Audiencia total<input name="audience" type="number" min="0" required /></label><label>Crec. audiencia %<input name="audienceGrowth" type="number" step="0.1" required /></label><label>Crec. orgánico %<input name="organicGrowth" type="number" step="0.1" required /></label><label>Engagement %<input name="engagement" type="number" min="0" max="100" step="0.1" required /></label><label>Leads<input name="leads" type="number" min="0" required /></label><label>Ventas <small>opcional</small><input name="sales" type="number" min="0" /></label><label>Ingresos (S/) <small>opcional</small><input name="revenue" type="number" min="0" step="0.01" /></label><label>Inversión Ads (S/) <small>opcional</small><input name="adSpend" type="number" min="0" step="0.01" /></label><label className={styles.full}>Lectura del periodo<textarea name="notes" rows={3} placeholder="Qué funcionó, qué aprendimos y siguiente prioridad." /></label></div><button disabled={busy}><Save /> Guardar resultados</button></form>
            </div> : null}
          </div>
        ) : null}

        {tab === "rewards" ? <section className={styles.rewardSection}><div className={styles.sectionHead}><div><h2>Catálogo de premios</h2><p>Configura puntos, disponibilidad y stock sin tocar código.</p></div><button onClick={() => setRewardEditor("new")}><Plus /> Nuevo premio</button></div><div className={styles.rewardGrid}>{data.rewards.map((reward) => <article key={reward.id} className={!reward.active ? styles.inactive : ""}><span>{reward.category}</span><h3>{reward.title}</h3><p>{reward.description}</p><strong>{reward.points.toLocaleString("es-PE")} <small>PTS</small></strong><button onClick={() => setRewardEditor(reward)}>Editar premio</button></article>)}</div></section> : null}
        {tab === "redemptions" ? <section className={styles.redemptionSection}><div className={styles.sectionHead}><div><h2>Solicitudes de canje</h2><p>Cada beneficio requiere aprobación antes de hacerse efectivo.</p></div></div><div className={styles.redemptionList}>{data.redemptions.map((item) => <article key={item.id}><div><span>{new Date(item.requested_at).toLocaleDateString("es-PE")}</span><h3>{item.reward_title}</h3><p>{allyName(item.ally_id)} · {item.points} puntos</p></div><b className={styles[item.status]}>{item.status}</b><div>{item.status === "pending" ? <><button onClick={() => void send({ action: "redemption", id: item.id, status: "rejected", note: "No aprobado" }, "Canje rechazado.")}>Rechazar</button><button onClick={() => void send({ action: "redemption", id: item.id, status: "approved", note: "Aprobado por Crisdal" }, "Canje aprobado y puntos descontados.")}><Check /> Aprobar</button></> : item.status === "approved" ? <button onClick={() => void send({ action: "redemption", id: item.id, status: "delivered", note: "Beneficio entregado" }, "Canje marcado como entregado.")}>Marcar entregado</button> : null}</div></article>)}</div>{!data.redemptions.length ? <div className={styles.empty}>Aún no hay solicitudes de canje.</div> : null}</section> : null}
      </section>
      {rewardEditor ? <RewardEditor reward={rewardEditor === "new" ? null : rewardEditor} busy={busy} close={() => setRewardEditor(null)} save={async (payload) => { await send(payload, "Premio guardado."); setRewardEditor(null); }} /> : null}
    </main>
  );
}

function RewardEditor({ reward, busy, close, save }: { reward: Reward | null; busy: boolean; close: () => void; save: (payload: object) => Promise<void> }) {
  function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); void save({ action: "reward", id: reward?.id, title: form.get("title"), description: form.get("description"), category: form.get("category"), points: Number(form.get("points")), active: form.get("active") === "on", stock: form.get("stock") ? Number(form.get("stock")) : null, imageUrl: null }); }
  return <div className={styles.modal} role="dialog" aria-modal="true"><form onSubmit={submit}><header><div><span>CATÁLOGO DE CANJE</span><h2>{reward ? "Editar premio" : "Nuevo premio"}</h2></div><button type="button" onClick={close}><X /></button></header><label>Nombre<input name="title" defaultValue={reward?.title || ""} required /></label><label>Descripción<textarea name="description" rows={3} defaultValue={reward?.description || ""} required /></label><div className={styles.grid}><label>Categoría<input name="category" defaultValue={reward?.category || "Contenido"} required /></label><label>Puntos<input name="points" type="number" min="1" defaultValue={reward?.points || 500} required /></label><label>Stock <small>vacío = ilimitado</small><input name="stock" type="number" min="0" defaultValue={reward?.stock ?? ""} /></label><label className={styles.check}><input name="active" type="checkbox" defaultChecked={reward?.active ?? true} /> Premio activo</label></div><footer><button type="button" onClick={close}>Cancelar</button><button disabled={busy}><Save /> Guardar premio</button></footer></form></div>;
}
