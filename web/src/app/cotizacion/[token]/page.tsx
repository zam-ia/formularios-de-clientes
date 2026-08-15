import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { getQuoteByToken, type Quote } from "@/lib/adminData";
import QuoteActions from "./QuoteActions";
import styles from "./quote.module.css";

export const dynamic = "force-dynamic";

function totals(quote: Quote) {
  const subtotal = quote.items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100), 0);
  const discount = quote.global_discount_type === "percent" ? subtotal * quote.global_discount_value / 100 : Math.min(subtotal, quote.global_discount_value);
  return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}
function money(value: number, currency: "PEN" | "USD") { return new Intl.NumberFormat("es-PE", { style: "currency", currency }).format(value); }

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const quote = await getQuoteByToken((await params).token);
  if (!quote) return { title: "Cotización no disponible | Crisdal Agency" };
  return { title: `${quote.quote_number} · ${quote.company_name} | Crisdal Agency`, description: quote.title, robots: { index: false, follow: false } };
}

export default async function PublicQuotePage({ params }: { params: Promise<{ token: string }> }) {
  const quote = await getQuoteByToken((await params).token);
  if (!quote) notFound();
  const amount = totals(quote);
  const expired = quote.status === "expired";
  const whatsapp = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "51987088359").replace(/\D/g, "");
  const message = `Hola, revisé la cotización ${quote.quote_number} para ${quote.company_name} y quisiera conversar sobre la propuesta.`;

  return <main className={styles.quotePage}>
    <header className={styles.hero}>
      <nav><Image src="/logo.svg" alt="Crisdal Agency" width={138} height={60} priority /><span>PROPUESTA {quote.quote_number}</span></nav>
      <div className={styles.heroGrid}><div><p>PROPUESTA COMERCIAL + ESTRATEGIA</p><h1>{quote.title}</h1><span>Preparada para <strong>{quote.company_name}</strong> · {quote.client_name}</span></div><aside><span>Inversión propuesta</span><strong>{money(amount.total, quote.currency)}</strong>{amount.discount > 0 && <small>Incluye {money(amount.discount, quote.currency)} de descuento</small>}<em className={expired ? styles.expired : ""}>{expired ? "Propuesta vencida" : `Válida hasta ${quote.valid_until}`}</em></aside></div>
      <div className={styles.heroGlow} />
    </header>

    <div className={styles.quoteContent}>
      <section className={styles.intro}><span><Sparkles /></span><div><p>UN PLAN CON DIRECCIÓN</p><h2>La propuesta responde a una prioridad concreta.</h2><p>{quote.introduction}</p></div></section>

      {quote.strategies.length > 0 && <section className={styles.section}><div className={styles.sectionHeading}><p>01 · ESTRATEGIA</p><h2>Cómo vamos a mover la marca.</h2></div><div className={styles.strategyGrid}>{quote.strategies.map((strategy, index) => <article key={strategy.id}><span>{String(index + 1).padStart(2, "0")}</span><Compass /><h3>{strategy.title}</h3><p>{strategy.description}</p></article>)}</div></section>}

      <section className={styles.section}><div className={styles.sectionHeading}><p>02 · ALCANCE</p><h2>Qué incluye esta propuesta.</h2></div><div className={styles.serviceStack}>{quote.items.map((item) => <article key={item.id}><div><p>SERVICIO / PLAN</p><h3>{item.name}</h3><span>{item.description}</span>{item.features.length > 0 && <ul>{item.features.map((feature) => <li key={feature}><Check /> {feature}</li>)}</ul>}</div><aside><span>{item.quantity !== 1 ? `${item.quantity} × ` : ""}{money(item.unit_price, quote.currency)}</span>{item.discount_percent > 0 && <small>-{item.discount_percent}% en este servicio</small>}<strong>{money(item.quantity * item.unit_price * (1 - item.discount_percent / 100), quote.currency)}</strong></aside></article>)}</div></section>

      <section className={styles.investment}><div><p>03 · INVERSIÓN</p><h2>Un alcance claro, sin costos escondidos.</h2><span>La propuesta puede ajustarse antes de la confirmación final.</span></div><aside><p><span>Subtotal</span><strong>{money(amount.subtotal, quote.currency)}</strong></p>{amount.discount > 0 && <p><span>Descuento especial</span><strong>-{money(amount.discount, quote.currency)}</strong></p>}<div><span>Inversión total</span><strong>{money(amount.total, quote.currency)}</strong></div></aside></section>

      <section className={styles.terms}><div className={styles.sectionHeading}><p>04 · CONDICIONES</p><h2>Antes de empezar.</h2></div><ul>{quote.terms.map((term) => <li key={term}><ShieldCheck /> <span>{term}</span></li>)}</ul>{quote.notes && <blockquote>{quote.notes}</blockquote>}</section>

      <section className={styles.closing}><Image src="/logo.svg" alt="Crisdal Agency" width={112} height={48} /><p>¿Avanzamos juntos?</p><h2>Convirtamos esta propuesta en movimiento.</h2><QuoteActions whatsapp={`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`} /></section>
    </div>
    <footer className={styles.publicFooter}><span>CRISDAL AGENCY</span><p>Propuesta privada para {quote.company_name} · {quote.quote_number}</p></footer>
  </main>;
}
