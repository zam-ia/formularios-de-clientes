import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { defaultBrochureCases, defaultBrochureMedia } from "@/lib/brochure";
import styles from "../case.module.css";

const slugToId: Record<string,string> = {
  "personal-training": "personal-training",
  "corporacion-henko": "corporacion-henko",
  "change-the-slim-studio": "change",
  "colegio-san-juan": "san-juan",
};

export function generateStaticParams() { return Object.keys(slugToId).map((slug) => ({ slug })); }

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = defaultBrochureCases.find((item) => item.id === slugToId[slug]);
  if (!project) notFound();
  const media = project.mediaIds.map((id) => defaultBrochureMedia.find((item) => item.id === id)).filter(Boolean);
  const fallback = "/brochure/story/strategy.webp";
  return <main className={styles.page}>
    <Link className={styles.back} href="/brochure#caso"><ArrowLeft size={16}/> Volver a casos</Link>
    <section className={styles.hero}>
      <Image src={media[0]?.url || fallback} alt={project.client} fill priority unoptimized sizes="100vw" />
      <span className={styles.shade}/>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>{project.eyebrow}</p><h1>{project.client}</h1><p>{project.title}</p></div>
    </section>
    <section className={styles.facts}><div><small>Proyecto</small><strong>{project.client}</strong></div><div><small>Intervención</small><strong>{project.eyebrow}</strong></div><div><small>Enfoque</small><strong>Trabajo real · Evidencia responsable</strong></div></section>
    <section className={styles.story}><h2>Del reto a una presencia que se puede sostener.</h2><div><p>{project.summary}</p><ol className={styles.stages}>{project.stages.map((stage,index)=><li key={stage}><span>0{index+1}</span><strong>{stage}</strong></li>)}</ol></div></section>
    {media.length ? <section className={styles.gallery}>{media.slice(0,3).map((item,index)=><figure key={item!.id}><Image src={item!.url} alt={`${project.client} · ${index+1}`} fill unoptimized sizes="(max-width:680px) 92vw, 55vw" /></figure>)}</section> : null}
    <section className={styles.cta}><h2>¿Quieres construir una presencia más clara para tu negocio?</h2><Link href="/brochure#planes">Conocer planes</Link></section>
  </main>;
}
