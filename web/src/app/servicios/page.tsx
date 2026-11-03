import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CatalogFooter, CatalogHeader, ServiceCard } from "@/components/CatalogChrome";
import { getSiteContent } from "@/lib/siteContent";
import { getWebCatalog, isPlanPublic } from "@/lib/webCatalog";
import styles from "../catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Servicios", description: "Fotografía, contenido, video, streaming, eventos y publicidad para comunicar mejor el valor de tu negocio.", alternates: { canonical: "/servicios" } };

export default async function ServicesPage() {
  const [catalog, site] = await Promise.all([getWebCatalog(), getSiteContent()]);
  const services = catalog.services.filter((item) => item.visible);
  const kits = catalog.kits.filter(isPlanPublic);
  const whatsapp = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, quiero una recomendación para mi negocio.")}`;
  return <main className={styles.page}>
    <CatalogHeader whatsapp={site.whatsappNumber} />
    <section className={styles.indexHero}><span className={styles.eyebrow}>SERVICIOS CRISDAL</span><h1>{catalog.servicesTitle}</h1><p>{catalog.servicesLead}</p></section>
    <section className={styles.serviceGrid} aria-label="Servicios disponibles">{services.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}</section>
    <section className={styles.section}>
      <div className={styles.sectionHead}><span className={styles.eyebrow}>KITS COMBINADOS</span><h2>Una propuesta coordinada cuando necesitas más de una pieza.</h2><p>Los precios solo aparecen cuando Dirección los aprueba y publica.</p></div>
      {kits.length ? <div className={styles.planGrid}>{kits.map((plan) => <article className={styles.planCard} key={plan.id}><span>Kit aprobado</span><h3>{plan.name}</h3><strong className={styles.price}>S/{plan.price}</strong><p>{plan.headline}</p><p>{plan.includes}</p></article>)}</div> : <div className={styles.honestState}><strong>Kits en revisión interna</strong><p>Estamos terminando de validar alcances y condiciones. Cuéntanos el objetivo y te preparamos una propuesta clara.</p><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">Solicitar propuesta <ArrowRight /></a></div>}
    </section>
    <section className={styles.cta}><h2>¿No sabes qué servicio encaja mejor?</h2><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">Quiero una recomendación <ArrowRight /></a></section>
    <CatalogFooter whatsapp={site.whatsappNumber} />
  </main>;
}
