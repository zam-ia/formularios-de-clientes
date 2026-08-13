import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import styles from "../../casos/case.module.css";

const industries: Record<string,{title:string;lead:string;image:string;projects:string[]}> = {
  "fitness-bienestar": { title:"Fitness & bienestar", lead:"Contenido que convierte disciplina, comunidad y transformación en una marca que se reconoce.", image:"/brochure/portfolio/personal-training-full.webp", projects:["Personal Training Perú","Change The Slim Studio"] },
  educacion: { title:"Educación", lead:"Campañas e identidad que ayudan a explicar una propuesta educativa y acompañan la decisión de las familias.", image:"/brochure/portfolio/san-juan-campaign.webp", projects:["Colegio San Juan"] },
  inmobiliaria: { title:"Inmobiliaria", lead:"Narrativa y producción para hacer comprensible una decisión de alto valor y sostener su presencia comercial.", image:"/brochure/portfolio/corporacion-henko.webp", projects:["Corporación Henko"] },
  "salud-estetica": { title:"Salud & estética", lead:"Identidad y experiencias digitales que transmiten confianza antes de la primera consulta.", image:"/brochure/portfolio/clinica-vitalis.webp", projects:["Clínica Vitalis","Sonríe Dental","Aura Skin Studio"] },
};
export function generateStaticParams(){return Object.keys(industries).map(slug=>({slug}));}
export default async function IndustryPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const item=industries[slug]; if(!item)notFound();
  return <main className={styles.page}>
    <Link className={styles.back} href="/brochure"><ArrowLeft size={16}/> Volver al brochure</Link>
    <section className={styles.hero}><Image src={item.image} alt={item.title} fill priority unoptimized sizes="100vw"/><span className={styles.shade}/><div className={styles.heroCopy}><p className={styles.eyebrow}>Experiencia por industria</p><h1>{item.title}</h1><p>{item.lead}</p></div></section>
    <section className={styles.story}><h2>Entendemos el contexto antes de producir.</h2><div><p>No usamos una fórmula idéntica para todos. Partimos de la oferta, el lenguaje de su audiencia y el momento comercial del negocio.</p><ol className={styles.stages}>{item.projects.map((project,index)=><li key={project}><span>0{index+1}</span><strong>{project}</strong></li>)}</ol></div></section>
    <section className={styles.cta}><h2>Construyamos una ruta proporcional a tu negocio.</h2><Link href="/brochure#contacto">Conversemos <ArrowRight size={16}/></Link></section>
  </main>;
}
