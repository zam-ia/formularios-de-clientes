import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CatalogFooter, CatalogHeader } from "@/components/CatalogChrome";
import { getBrochureContent } from "@/lib/brochure";
import { getSiteContent } from "@/lib/siteContent";
import styles from "../catalog.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Nosotros", description: "Equipo de Crisdal Agency en Huancayo: creatividad, producción y criterio comercial dentro de una misma ruta.", alternates: { canonical: "/nosotros" } };
export default async function AboutPage() {
  const [site, brochure] = await Promise.all([getSiteContent(), getBrochureContent()]);
  const team = brochure.teamMembers.filter((item) => item.visible);
  const whatsapp = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, quiero conocer cómo pueden ayudar a mi negocio.")}`;
  return <main className={styles.page}><CatalogHeader whatsapp={site.whatsappNumber}/><section className={styles.hero}><div className={styles.heroCopy}><span>EQUIPO CRISDAL</span><h1>{site.aboutTitle}</h1><p>{site.aboutText}</p></div><div className={`${styles.mediaVisual} ${styles.heroVisual}`}><Image src={site.aboutImage} alt="Equipo de Crisdal Agency en Huancayo" fill unoptimized sizes="(max-width:760px) 100vw, 50vw"/></div></section><section className={styles.section}><div className={styles.sectionHead}><span className={styles.eyebrow}>QUIÉNES SOMOS</span><h2>Personas reales detrás de cada proyecto.</h2><p>Los perfiles y roles se mantienen desde el editor del brochure.</p></div><div className={styles.teamGrid}>{team.map((person)=><article key={person.id}><div><Image src={person.imageUrl} alt={person.name} fill unoptimized sizes="(max-width:600px) 100vw, 25vw" style={{objectPosition:`${person.positionX}% ${person.positionY}%`}}/></div><span>{person.role}</span><h3>{person.name}</h3><p>{person.focus}</p></article>)}</div></section><section className={styles.cta}><h2>Una sola ruta. Menos improvisación.</h2><a className={styles.primaryButton} href={whatsapp} target="_blank" rel="noreferrer">Conoce cómo podemos ayudarte <ArrowRight/></a></section><CatalogFooter whatsapp={site.whatsappNumber}/></main>;
}
