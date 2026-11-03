import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumb, CatalogFooter, CatalogHeader } from "@/components/CatalogChrome";
import { getSiteContent } from "@/lib/siteContent";
import { getWebCatalog, isPlanPublic } from "@/lib/webCatalog";
import styles from "../../catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Kits combinados", description: "Soluciones coordinadas de fotografía, video, contenido y streaming de Crisdal Agency.", alternates: { canonical: "/servicios/kits-combinados" } };
export default async function KitsPage(){
  const [catalog,site]=await Promise.all([getWebCatalog(),getSiteContent()]); const kits=catalog.kits.filter(isPlanPublic); const whatsapp=`https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, quiero una propuesta de servicios combinados.")}`;
  return <main className={styles.page}><CatalogHeader whatsapp={site.whatsappNumber}/><Breadcrumb><Link href="/servicios">Servicios</Link><span>/</span><span>Kits combinados</span></Breadcrumb><section className={styles.indexHero}><span className={styles.eyebrow}>KITS COMBINADOS</span><h1>Una producción. Varias piezas listas para comunicar.</h1><p>Coordinamos formatos complementarios cuando el objetivo necesita fotografía, video o transmisión dentro de una misma ruta.</p></section><section className={styles.section}>{kits.length?<div className={styles.planGrid}>{kits.map((plan)=><article className={styles.planCard} key={plan.id}><span>Kit aprobado</span><h3>{plan.name}</h3><strong className={styles.price}>S/{plan.price}</strong><p>{plan.headline}</p><p>{plan.includes}</p><p>{plan.limit}</p></article>)}</div>:<div className={styles.honestState}><strong>Alcances y precios en validación</strong><p>Los kits permanecen en borrador hasta su aprobación. Mientras tanto, podemos cotizar una combinación según tu objetivo real.</p><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">Solicitar propuesta <ArrowRight/></a></div>}</section><CatalogFooter whatsapp={site.whatsappNumber}/></main>;
}
