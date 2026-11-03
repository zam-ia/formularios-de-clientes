import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { notFound } from "next/navigation";
import { Breadcrumb, CatalogFooter, CatalogHeader, MediaVisual, ProjectCard } from "@/components/CatalogChrome";
import { getSiteContent } from "@/lib/siteContent";
import { defaultWebCatalog, getWebCatalog, isPlanPublic, serviceBySlug } from "@/lib/webCatalog";
import styles from "../../catalog.module.css";

export const dynamic = "force-dynamic";
export function generateStaticParams() { return defaultWebCatalog.services.map(({ slug }) => ({ slug })); }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = serviceBySlug(await getWebCatalog(), (await params).slug);
  if (!service) return {};
  return { title: service.seoTitle || service.title, description: service.seoDescription || service.sub, alternates: { canonical: `/servicios/${service.slug}` } };
}

export default async function ServicePage({ params }: Props) {
  const [{ slug }, catalog, site] = await Promise.all([params, getWebCatalog(), getSiteContent()]);
  const service = serviceBySlug(catalog, slug);
  if (!service) notFound();
  const plans = service.plans.filter(isPlanPublic);
  const projects = catalog.projects.filter((project) => project.visible && project.serviceIds.includes(service.id)).slice(0, 6);
  const message = `Hola Crisdal, me interesa ${service.title}. Quiero conocer el alcance adecuado para mi proyecto.`;
  const whatsapp = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent(message)}`;
  const steps = [
    ["01", "Diagnóstico", "Alineamos objetivo, público y uso esperado del material."],
    ["02", "Preproducción", "Definimos mensajes, formatos, responsables y logística."],
    ["03", "Ejecución", "Producimos con un alcance claro y cuidando la realidad de tu marca."],
    ["04", "Entrega", "Recibes el material acordado y recomendaciones prácticas de uso."],
  ];
  return <main className={styles.page}>
    <CatalogHeader whatsapp={site.whatsappNumber} />
    <Breadcrumb><Link href="/servicios">Servicios</Link><span>/</span><span>{service.title}</span></Breadcrumb>
    <section className={styles.hero}>
      <div className={styles.heroCopy}><span>{service.eyebrow}</span><h1>{service.headline}</h1><p>{service.sub}</p><div className={styles.heroActions}><a className={styles.primaryButton} href="#planes">Ver planes <ArrowRight /></a><a className={styles.secondaryButton} href="#trabajos">Ver trabajos</a></div></div>
      <MediaVisual className={styles.heroVisual} src={service.heroMedia} alt={service.heroAlt || service.title} />
    </section>
    <section className={styles.section}>
      <div className={styles.sectionHead}><span className={styles.eyebrow}>QUÉ RESOLVEMOS</span><h2>{service.purpose}</h2><p>Definimos el objetivo antes de producir. Los entregables respaldan cada beneficio sin prometer resultados que dependen de otros factores.</p></div>
      <div className={styles.benefitGrid}>{service.benefits.slice(0, 6).map((benefit, index) => <article key={benefit}><span>0{index + 1}</span><h3>{benefit}</h3></article>)}</div>
    </section>
    <section className={`${styles.section} ${styles.darkSection}`}><div className={styles.sectionHead}><span className={styles.eyebrow}>CÓMO TRABAJAMOS</span><h2>Primero entendemos. Luego producimos con intención.</h2></div><div className={styles.steps}>{steps.map(([number, title, copy]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className={styles.section} id="planes">
      <div className={styles.sectionHead}><span className={styles.eyebrow}>PLANES</span><h2>Un alcance claro antes de empezar.</h2><p>Solo mostramos precios y paquetes aprobados formalmente por Dirección.</p></div>
      {plans.length ? <div className={styles.planGrid}>{plans.map((plan) => <article className={`${styles.planCard} ${service.recommended && plan.name === service.recommended ? styles.recommended : ""}`} key={plan.id}><span>{plan.name === service.recommended ? "Recomendado para este servicio" : "Plan aprobado"}</span><h3>{plan.name}</h3><strong className={styles.price}>S/{plan.price}</strong><p>{plan.headline}</p><p>{plan.includes}</p>{plan.bonuses.length ? <ul>{plan.bonuses.map((bonus) => <li key={bonus}><Check size={13} /> {bonus}</li>)}</ul> : null}<p><strong>Límite:</strong> {plan.limit}</p></article>)}</div> : <div className={styles.honestState}><strong>Planes en revisión</strong><p>Los alcances y precios aún no están publicados. Podemos preparar una recomendación según el objetivo, fecha y complejidad de tu proyecto.</p><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">{service.aim} <ArrowRight /></a></div>}
    </section>
    <section className={styles.section} id="trabajos"><div className={styles.sectionHead}><span className={styles.eyebrow}>PORTAFOLIO RELACIONADO</span><h2>Trabajo auténtico de esta categoría.</h2></div>{projects.length ? <div className={styles.portfolioGrid}>{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</div> : <div className={styles.honestState}><strong>Próximamente trabajos de esta categoría</strong><p>Este espacio solo mostrará proyectos reales con autorización. No usamos stock para simular experiencia.</p><Link className={styles.primaryButton} href="/portafolio">Explorar portafolio <ArrowRight /></Link></div>}</section>
    {service.faqs.length ? <section className={styles.section}><div className={styles.sectionHead}><span className={styles.eyebrow}>PREGUNTAS FRECUENTES</span><h2>Lo que debes saber antes de contratar.</h2></div><div className={styles.faq}>{service.faqs.map((faq) => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section> : null}
    <section className={styles.cta}><h2>Tu siguiente proyecto merece una propuesta clara.</h2><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">{service.aim} <ArrowRight /></a></section>
    <CatalogFooter whatsapp={site.whatsappNumber} />
  </main>;
}
