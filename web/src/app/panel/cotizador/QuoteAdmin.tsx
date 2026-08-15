"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgePercent, Check, Copy, ExternalLink, FilePlus2, Layers3, LoaderCircle, Pencil, Plus, Save, Send, Sparkles, Trash2, X } from "lucide-react";
import type { Quote, QuoteItem, QuotePlan, QuoteStatus, QuoteStrategy } from "@/lib/adminData";
import styles from "../os.module.css";

type QuoteView = Quote & { public_url: string };
type DataResponse = { quotes: QuoteView[]; plans: QuotePlan[] };
type QuoteForm = Omit<Quote, "id" | "public_token" | "quote_number" | "created_by" | "created_by_name" | "created_at" | "updated_at"> & { id?: string };
type PlanForm = Omit<QuotePlan, "created_at" | "updated_at">;
const statusLabels: Record<QuoteStatus, string> = { draft: "Borrador", sent: "Enviada", accepted: "Aceptada", rejected: "Rechazada", expired: "Vencida" };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "No pudimos completar la acción.");
  return result as T;
}
function dateAfter(days: number) { const value = new Date(); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); }
function blankItem(): QuoteItem { return { id: crypto.randomUUID(), name: "Servicio", description: "Describe el alcance de este servicio.", quantity: 1, unit_price: 0, discount_percent: 0, features: [] }; }
function blankStrategy(): QuoteStrategy { return { id: crypto.randomUUID(), title: "Estrategia propuesta", description: "Explica qué se hará, por qué y qué resultado busca." }; }
function blankQuote(): QuoteForm { return { client_name: "", company_name: "", client_whatsapp: "", client_email: "", title: "Propuesta comercial y estratégica", introduction: "Preparamos esta propuesta para convertir las prioridades del negocio en un plan de acción claro, medible y sostenible.", currency: "PEN", items: [blankItem()], strategies: [blankStrategy()], global_discount_type: "percent", global_discount_value: 0, valid_until: dateAfter(15), terms: ["La propuesta tiene la vigencia indicada.", "El inicio se programa después de confirmar el primer pago.", "La inversión publicitaria no está incluida salvo que se indique expresamente."], notes: "", status: "draft" }; }
function money(value: number, currency: "PEN" | "USD") { return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value); }
function quoteTotals(quote: QuoteForm) { const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0); const discount = quote.global_discount_type === "percent" ? subtotal * quote.global_discount_value / 100 : Math.min(subtotal, quote.global_discount_value); return { subtotal, discount, total: Math.max(0, subtotal - discount) }; }

export default function QuoteAdmin() {
  const [quotes, setQuotes] = useState<QuoteView[]>([]);
  const [plans, setPlans] = useState<QuotePlan[]>([]);
  const [tab, setTab] = useState<"quotes" | "plans">("quotes");
  const [editor, setEditor] = useState<QuoteForm | null>(null);
  const [planEditor, setPlanEditor] = useState<PlanForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => { const data = await api<DataResponse>("/api/admin/quotes"); setQuotes(data.quotes); setPlans(data.plans); }, []);
  useEffect(() => {
    let cancelled = false;
    void api<DataResponse>("/api/admin/quotes")
      .then((data) => {
        if (!cancelled) {
          setQuotes(data.quotes);
          setPlans(data.plans);
        }
      })
      .catch((error) => {
        if (!cancelled) setNotice(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);
  const totals = useMemo(() => editor ? quoteTotals(editor) : null, [editor]);

  function editQuote(quote: QuoteView) {
    const { id, client_name, company_name, client_whatsapp, client_email, title, introduction, currency, items, strategies, global_discount_type, global_discount_value, valid_until, terms, notes, status } = quote;
    setEditor({ id, client_name, company_name, client_whatsapp, client_email, title, introduction, currency, items, strategies, global_discount_type, global_discount_value, valid_until, terms, notes, status });
  }
  function addPlanToQuote(plan: QuotePlan) {
    setEditor((current) => current ? { ...current, items: [...current.items, { id: crypto.randomUUID(), name: plan.name, description: plan.description, quantity: 1, unit_price: plan.price, discount_percent: 0, features: plan.features }] } : current);
  }
  function updateItem(id: string, patch: Partial<QuoteItem>) { setEditor((current) => current ? { ...current, items: current.items.map((item) => item.id === id ? { ...item, ...patch } : item) } : current); }
  function updateStrategy(id: string, patch: Partial<QuoteStrategy>) { setEditor((current) => current ? { ...current, strategies: current.strategies.map((item) => item.id === id ? { ...item, ...patch } : item) } : current); }

  async function saveQuote() {
    if (!editor) return;
    setBusy(true); setNotice("");
    try {
      const method = editor.id ? "PUT" : "POST";
      const result = await api<{ quote: QuoteView }>("/api/admin/quotes", { method, body: JSON.stringify({ kind: "quote", data: editor }) });
      await load(); setEditor(null); setNotice(`${result.quote.quote_number} guardada. El enlace ya está listo para compartir.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar la cotización."); }
    finally { setBusy(false); }
  }
  async function removeQuote(id: string) {
    if (!confirm("¿Eliminar esta cotización? Esta acción no se puede deshacer.")) return;
    await api("/api/admin/quotes", { method: "DELETE", body: JSON.stringify({ kind: "quote", id }) });
    await load(); setNotice("Cotización eliminada.");
  }
  async function savePlan() {
    if (!planEditor) return;
    setBusy(true); setNotice("");
    try { await api("/api/admin/quotes", { method: plans.some((plan) => plan.id === planEditor.id) ? "PUT" : "POST", body: JSON.stringify({ kind: "plan", data: planEditor }) }); await load(); setPlanEditor(null); setNotice("Plan guardado y disponible en el cotizador."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos guardar el plan."); }
    finally { setBusy(false); }
  }
  async function copyLink(url: string) { await navigator.clipboard.writeText(url); setNotice("Enlace público copiado."); }

  return <main className={styles.osPage}>
    <header className={styles.osHeader}><div><Link href="/panel"><ArrowLeft size={17} /> Volver al panel</Link><p>CRISDAL OS · COMERCIAL</p><h1>Cotizador inteligente</h1><span>Planes, descuentos y estrategia en una propuesta clara para cada cliente.</span></div><button className={styles.primaryAction} onClick={() => setEditor(blankQuote())}><FilePlus2 size={18} /> Nueva cotización</button></header>
    <div className={styles.segmented}><button className={tab === "quotes" ? styles.activeSegment : ""} onClick={() => setTab("quotes")}><Send size={17} /> Cotizaciones</button><button className={tab === "plans" ? styles.activeSegment : ""} onClick={() => setTab("plans")}><Layers3 size={17} /> Planes y ofertas</button></div>
    {notice && <div className={styles.notice}>{notice}</div>}
    {loading ? <div className={styles.loadingBlock}><LoaderCircle className={styles.spin} /> Preparando cotizador…</div> : tab === "quotes" ? <section className={styles.quoteList}>
      {quotes.length === 0 && <div className={styles.emptyState}><Sparkles /><h2>Tu primera propuesta empieza aquí.</h2><p>Crea una cotización, agrega planes o servicios y comparte un enlace elegante con el cliente.</p><button className={styles.primaryAction} onClick={() => setEditor(blankQuote())}>Crear cotización</button></div>}
      {quotes.map((quote) => { const quoteTotal = quoteTotals(quote); return <article className={styles.quoteRow} key={quote.id}><div className={styles.quoteNumber}>{quote.quote_number}</div><div><strong>{quote.company_name}</strong><span>{quote.client_name} · Válida hasta {quote.valid_until}</span></div><div className={styles.quoteValue}><strong>{money(quoteTotal.total, quote.currency)}</strong><span className={`${styles.statusPill} ${styles[quote.status]}`}>{statusLabels[quote.status]}</span></div><div className={styles.rowActions}><button onClick={() => editQuote(quote)} title="Editar"><Pencil /></button><button onClick={() => copyLink(quote.public_url)} title="Copiar enlace"><Copy /></button><a href={quote.public_url} target="_blank" rel="noreferrer" title="Abrir cotización"><ExternalLink /></a><button onClick={() => void removeQuote(quote.id)} title="Eliminar"><Trash2 /></button></div></article>; })}
    </section> : <section className={styles.planGrid}>
      <button className={styles.addPlanCard} onClick={() => setPlanEditor({ id: crypto.randomUUID(), name: "Nuevo plan", description: "", price: 0, billing_label: "por mes", features: [], badge: "", active: true })}><Plus /><strong>Agregar plan u oferta</strong><span>Úsalo después como base en cualquier cotización.</span></button>
      {plans.map((plan) => <button className={styles.planCard} key={plan.id} onClick={() => setPlanEditor({ id: plan.id, name: plan.name, description: plan.description, price: plan.price, billing_label: plan.billing_label, features: plan.features, badge: plan.badge, active: plan.active })}><span>{plan.badge || "Plan"}</span><h2>{plan.name}</h2><strong>{money(plan.price, "PEN")} <small>{plan.billing_label}</small></strong><p>{plan.description}</p><ul>{plan.features.slice(0, 5).map((feature) => <li key={feature}><Check />{feature}</li>)}</ul><em>{plan.active ? "Disponible" : "Oculto"}</em></button>)}
    </section>}

    {editor && <div className={styles.editorOverlay}><section className={styles.editorPanel}>
      <header className={styles.editorHeader}><div><p>{editor.id ? "Editar propuesta" : "Nueva propuesta"}</p><h2>{editor.company_name || "Cotización sin nombre"}</h2></div><button onClick={() => setEditor(null)} aria-label="Cerrar"><X /></button></header>
      <div className={styles.editorBody}>
        <section className={styles.formSection}><div className={styles.sectionTitle}><span>01</span><div><h3>Cliente y enfoque</h3><p>Datos que verá el cliente al abrir el enlace.</p></div></div><div className={styles.formGrid}><label>Empresa<input value={editor.company_name} onChange={(event) => setEditor({ ...editor, company_name: event.target.value })} /></label><label>Persona de contacto<input value={editor.client_name} onChange={(event) => setEditor({ ...editor, client_name: event.target.value })} /></label><label>WhatsApp<input value={editor.client_whatsapp} onChange={(event) => setEditor({ ...editor, client_whatsapp: event.target.value })} /></label><label>Correo<input type="email" value={editor.client_email} onChange={(event) => setEditor({ ...editor, client_email: event.target.value })} /></label><label className={styles.fullField}>Título<input value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} /></label><label className={styles.fullField}>Introducción<textarea value={editor.introduction} onChange={(event) => setEditor({ ...editor, introduction: event.target.value })} /></label></div></section>
        <section className={styles.formSection}><div className={styles.sectionTitle}><span>02</span><div><h3>Servicios e inversión</h3><p>Agrega un plan como base o crea servicios a medida.</p></div></div><div className={styles.planChips}>{plans.filter((plan) => plan.active).map((plan) => <button key={plan.id} onClick={() => addPlanToQuote(plan)}><Plus /> {plan.name}</button>)}<button onClick={() => setEditor({ ...editor, items: [...editor.items, blankItem()] })}><Plus /> Servicio libre</button></div><div className={styles.itemStack}>{editor.items.map((item, index) => <article className={styles.itemEditor} key={item.id}><div className={styles.itemHead}><strong>Servicio {index + 1}</strong><button onClick={() => setEditor({ ...editor, items: editor.items.filter((current) => current.id !== item.id) })} disabled={editor.items.length === 1}><Trash2 /></button></div><div className={styles.formGrid}><label className={styles.fullField}>Nombre<input value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} /></label><label className={styles.fullField}>Descripción<textarea value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></label><label>Cantidad<input type="number" min="0.1" step="0.1" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} /></label><label>Precio unitario<input type="number" min="0" step="10" value={item.unit_price} onChange={(event) => updateItem(item.id, { unit_price: Number(event.target.value) })} /></label><label>Descuento del servicio (%)<input type="number" min="0" max="100" value={item.discount_percent} onChange={(event) => updateItem(item.id, { discount_percent: Number(event.target.value) })} /></label><label className={styles.fullField}>Incluye (una línea por beneficio)<textarea value={item.features.join("\n")} onChange={(event) => updateItem(item.id, { features: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label></div></article>)}</div></section>
        <section className={styles.formSection}><div className={styles.sectionTitle}><span>03</span><div><h3>Estrategia recomendada</h3><p>Explica el criterio detrás de la propuesta.</p></div></div>{editor.strategies.map((strategy) => <article className={styles.strategyEditor} key={strategy.id}><input value={strategy.title} onChange={(event) => updateStrategy(strategy.id, { title: event.target.value })} /><textarea value={strategy.description} onChange={(event) => updateStrategy(strategy.id, { description: event.target.value })} /><button onClick={() => setEditor({ ...editor, strategies: editor.strategies.filter((item) => item.id !== strategy.id) })}><Trash2 /></button></article>)}<button className={styles.secondaryAction} onClick={() => setEditor({ ...editor, strategies: [...editor.strategies, blankStrategy()] })}><Plus /> Agregar estrategia</button></section>
        <section className={styles.formSection}><div className={styles.sectionTitle}><span>04</span><div><h3>Condiciones y cierre</h3><p>Descuento final, vigencia y términos de trabajo.</p></div></div><div className={styles.formGrid}><label>Descuento global<select value={editor.global_discount_type} onChange={(event) => setEditor({ ...editor, global_discount_type: event.target.value as "percent" | "fixed" })}><option value="percent">Porcentaje</option><option value="fixed">Monto fijo</option></select></label><label>Valor del descuento<input type="number" min="0" value={editor.global_discount_value} onChange={(event) => setEditor({ ...editor, global_discount_value: Number(event.target.value) })} /></label><label>Válida hasta<input type="date" value={editor.valid_until} onChange={(event) => setEditor({ ...editor, valid_until: event.target.value })} /></label><label>Estado<select value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value as QuoteStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className={styles.fullField}>Términos (uno por línea)<textarea value={editor.terms.join("\n")} onChange={(event) => setEditor({ ...editor, terms: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label><label className={styles.fullField}>Nota final<textarea value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} /></label></div></section>
      </div>
      <footer className={styles.editorFooter}><div className={styles.totalBox}><span>Inversión final</span><strong>{totals ? money(totals.total, editor.currency) : "—"}</strong>{totals && totals.discount > 0 && <small>Descuento: {money(totals.discount, editor.currency)}</small>}</div><button className={styles.primaryAction} onClick={() => void saveQuote()} disabled={busy || !editor.company_name || !editor.client_name}>{busy ? <LoaderCircle className={styles.spin} /> : <Save />} Guardar y generar enlace</button></footer>
    </section></div>}

    {planEditor && <div className={styles.modalBackdrop}><section className={styles.modalCard}><button className={styles.iconClose} onClick={() => setPlanEditor(null)}><X /></button><div className={styles.modalHeading}><span><BadgePercent /></span><div><p>Plantilla comercial</p><h2>Editar plan u oferta</h2></div></div><div className={styles.formGrid}><label>Nombre<input value={planEditor.name} onChange={(event) => setPlanEditor({ ...planEditor, name: event.target.value })} /></label><label>Precio<input type="number" min="0" value={planEditor.price} onChange={(event) => setPlanEditor({ ...planEditor, price: Number(event.target.value) })} /></label><label>Etiqueta de precio<input value={planEditor.billing_label} onChange={(event) => setPlanEditor({ ...planEditor, billing_label: event.target.value })} /></label><label>Distintivo<input value={planEditor.badge} onChange={(event) => setPlanEditor({ ...planEditor, badge: event.target.value })} placeholder="Ej. Más elegido" /></label><label className={styles.fullField}>Descripción<textarea value={planEditor.description} onChange={(event) => setPlanEditor({ ...planEditor, description: event.target.value })} /></label><label className={styles.fullField}>Beneficios (uno por línea)<textarea value={planEditor.features.join("\n")} onChange={(event) => setPlanEditor({ ...planEditor, features: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label><label className={styles.checkField}><input type="checkbox" checked={planEditor.active} onChange={(event) => setPlanEditor({ ...planEditor, active: event.target.checked })} /> Disponible para cotizar</label></div><div className={styles.modalActions}><button onClick={() => setPlanEditor(null)}>Cancelar</button><button className={styles.primaryAction} onClick={() => void savePlan()} disabled={busy}>{busy && <LoaderCircle className={styles.spin} />} Guardar plan</button></div></section></div>}
  </main>;
}
