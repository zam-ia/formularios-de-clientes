import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { defaultBrochureCases, defaultBrochureMedia } from "@/lib/brochure";
import { getWebCatalog } from "@/lib/webCatalog";
import styles from "../case.module.css";

const slugToId: Record<string,string> = {
  "personal-training": "personal-training",
  "corporacion-henko": "corporacion-henko",
  "change-the-slim-studio": "change",
  "colegio-san-juan": "san-juan",
};

export function generateStaticParams() { return Object.keys(slugToId).map((slug) => ({ slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = (await getWebCatalog()).projects.find((item) => item.slug === slug && item.visible);
  if (!project) return {};
  return { title: project.seoTitle || project.title, description: project.seoDescription || project.summary, alternates: { canonical: `/casos/${slug}` } };
}

export default async function CasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const legacyProject = defaultBrochureCases.find((item) => item.id === slugToId[slug]);
  const catalogProject = (await getWebCatalog()).projects.find((item) => item.slug === slug && item.visible);
  if (!legacyProject && !catalogProject) notFound();
  const legacyMedia = legacyProject?.mediaIds.map((id) => defaultBrochureMedia.find((item) => item.id === id)).filter(Boolean) || [];
  const media = catalogProject?.gallery.length ? catalogProject.gallery : legacyMedia.map((item) => ({ id: item!.id, url: item!.url, alt: item!.title || catalogProject?.title || legacyProject!.client, kind: "image" as const }));
  const client = catalogProject?.title || legacyProject!.client;
  const summary = catalogProject?.summary || legacyProject!.summary;
  const eyebrow = catalogProject?.industry || legacyProject!.eyebrow;
  const stages = legacyProject?.stages || ["Diagnóstico", "Producción", "Entrega"];
  const fallback = "/brochure/story/strategy.webp";
  return <main className={styles.page}>
    <Link className={styles.back} href="/portafolio"><ArrowLeft size={16}/> Volver al portafolio</Link>
    <section className={styles.hero}>
      {/\.(mp4|webm)(\?|$)/i.test(catalogProject?.heroMedia || media[0]?.url || "") ? <video src={catalogProject?.heroMedia || media[0]?.url} controls muted playsInline /> : <Image src={catalogProject?.heroMedia || media[0]?.url || fallback} alt={catalogProject?.heroAlt || client} fill priority unoptimized sizes="100vw" />}
      <span className={styles.shade}/>
      <div className={styles.heroCopy}><p className={styles.eyebrow}>{eyebrow}</p><h1>{client}</h1><p>{legacyProject?.title || catalogProject?.summary}</p></div>
    </section>
    <section className={styles.facts}><div><small>Proyecto</small><strong>{client}</strong></div><div><small>Intervención</small><strong>{eyebrow}</strong></div><div><small>Enfoque</small><strong>Trabajo real · Evidencia responsable</strong></div></section>
    <section className={styles.story}><h2>Del reto a una presencia que se puede sostener.</h2><div><p>{summary}</p><ol className={styles.stages}>{stages.map((stage,index)=><li key={stage}><span>0{index+1}</span><strong>{stage}</strong></li>)}</ol></div></section>
    {media.length ? <section className={styles.gallery}>{media.slice(0,3).map((item,index)=><figure key={item!.id}>{item!.kind === "video" ? <video src={item!.url} controls playsInline preload="metadata" /> : <Image src={item!.url} alt={item!.alt || `${client} · ${index+1}`} fill unoptimized sizes="(max-width:680px) 92vw, 55vw" />}</figure>)}</section> : null}
    <section className={styles.cta}><h2>¿Quieres construir una presencia más clara para tu negocio?</h2><Link href="/servicios">Explorar servicios</Link></section>
  </main>;
}
