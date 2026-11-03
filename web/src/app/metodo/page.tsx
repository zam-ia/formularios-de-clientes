import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CatalogFooter, CatalogHeader } from "@/components/CatalogChrome";
import { getSiteContent } from "@/lib/siteContent";
import styles from "../catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Método de trabajo", description: "Diagnóstico, planificación, producción y entrega: una ruta clara para cada proyecto de Crisdal Agency.", alternates: { canonical: "/metodo" } };
const steps = [
  ["01", "Diagnóstico", "Entendemos qué vendes, a quién y qué debe lograr la pieza.", "/brochure/story/strategy.webp", "Sesión de diagnóstico y estrategia del equipo Crisdal"],
  ["02", "Ruta creativa", "Definimos mensaje, formatos, logística y responsables.", "/brochure/team/equipo-crisdal-2026.webp", "Equipo Crisdal planificando una ruta creativa"],
  ["03", "Producción", "Grabamos, diseñamos o implementamos el alcance acordado.", "/catalog/services/video-hero.webp", "Ilustración editorial de producción audiovisual"],
  ["04", "Entrega y mejora", "Entregamos el material y recomendamos su uso. Revisamos aprendizajes cuando aplica.", "/catalog/services/marketing-hero.webp", "Ilustración editorial del seguimiento y mejora del proyecto"],
];
export default async function MethodPage() {
  const site = await getSiteContent();
  const whatsapp = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, quiero conversar sobre mi proyecto.")}`;
  return <main className={styles.page}><CatalogHeader whatsapp={site.whatsappNumber}/><section className={styles.indexHero}><span className={styles.eyebrow}>MÉTODO CRISDAL</span><h1>Primero entendemos el objetivo. Después decidimos qué producir.</h1><p>Un proceso claro que conecta diagnóstico, planificación, ejecución y revisión para que sepas exactamente qué vamos a entregar.</p></section><section className={`${styles.section} ${styles.darkSection}`}><div className={styles.methodSteps}>{steps.map(([number,title,copy,image,alt])=><article key={number}><div><Image src={image} alt={alt} fill unoptimized sizes="(max-width: 700px) 100vw, 25vw"/></div><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section><section className={styles.cta}><h2>Conversemos sobre tu proyecto.</h2><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">Empezar por el diagnóstico <ArrowRight/></a></section><CatalogFooter whatsapp={site.whatsappNumber}/></main>;
}
