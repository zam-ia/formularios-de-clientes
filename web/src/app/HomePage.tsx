"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Bot, BrainCircuit, Check, ChevronDown, Clapperboard, Code2, GraduationCap, Handshake, HeartPulse, Menu, MessageCircle, Palette, Play, Sparkles, Target, TrendingUp, Workflow, X } from "lucide-react";
import type { SiteContent } from "@/lib/siteContent";
import styles from "./home.module.css";

const serviceIcons = [BrainCircuit, MessageCircle, Clapperboard, Code2, Workflow, Palette];
const faqs = [
  ["¿El bot realmente entiende a mis pacientes o alumnos?", "Diseñamos flujos con lenguaje natural, contexto de tu negocio y rutas claras para derivar a una persona cuando corresponde."],
  ["¿Qué pasa si la IA no sabe responder algo?", "No improvisa. El sistema reconoce límites, registra la consulta y la entrega al responsable adecuado con todo el contexto."],
  ["¿Tengo que contratar todos los servicios?", "No. Empezamos con un diagnóstico y priorizamos lo que hoy genera más fricción o pérdida de oportunidades."],
  ["¿Trabajan de manera presencial en Huancayo?", "Sí. La producción audiovisual y las reuniones clave pueden realizarse en sitio; la operación y el seguimiento también funcionan de forma remota."],
];

export default function HomePage({ content }: { content: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsapp = `https://wa.me/${content.whatsappNumber}?text=Hola%20Crisdal%2C%20quiero%20agendar%20un%20diagn%C3%B3stico%20gratis.`;
  const aboutImage = content.aboutImage === "/brand/crisdal-agency-logo.png" ? "/team/equipo-crisdal.webp" : content.aboutImage;
  return <main className={styles.site}>
    <header className={styles.header}>
      <Link href="#inicio" className={styles.brand} aria-label="Crisdal Agency, inicio"><Image src={content.logoUrl} alt="Crisdal Agency" width={1080} height={1080} priority unoptimized /></Link>
      <nav className={menuOpen ? styles.navOpen : ""} aria-label="Navegación principal">
        <a href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a>
        <div className={styles.dropdown}><a href="#servicios">Servicios <ChevronDown /></a><div><a href="#servicios">IA & WhatsApp</a><a href="#servicios">Contenido audiovisual</a><a href="#servicios">Web, apps y branding</a></div></div>
        <div className={styles.dropdown}><a href="#rubros">Rubros <ChevronDown /></a><div><a href="#salud">Salud & Estética</a><a href="#educacion">Educación</a></div></div>
        <Link href="/aliados">Red de Aliados <span>PRIVADA</span></Link><a href="#resultados">Resultados</a><a href="#nosotros">Nosotros</a>
      </nav>
      <a className={styles.headerCta} href={whatsapp} target="_blank" rel="noreferrer">Agenda tu diagnóstico <ArrowRight /></a>
      <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <section id="inicio" className={styles.hero}>
      <div className={styles.heroGrid} />
      <div className={styles.heroCopy}><p className={styles.kicker}><i /> {content.heroKicker}</p><h1><HighlightedTitle value={content.heroTitle} /></h1><p>{content.heroLead}</p><div className={styles.heroActions}><a href={whatsapp} target="_blank" rel="noreferrer">Agenda tu diagnóstico gratis <ArrowRight /></a><a href="#metodo"><Play /> Ver cómo trabajamos</a></div><div className={styles.heroProof}><span><Check /> Especialistas en dos rubros</span><span><Check /> Producción propia</span><span><Check /> IA integrada</span></div></div>
      <div className={styles.heroVisual} aria-label="Sistema de atención automatizada de Crisdal"><div className={styles.orbit}><BrainCircuit /><span>IA activa</span></div><div className={styles.phone}><div className={styles.phoneHead}><b>C</b><span>Asistente CRISDAL<small>En línea ahora</small></span></div><div className={styles.chatIncoming}>Hola, quisiera información sobre una cita.</div><div className={styles.chatOutgoing}>¡Claro! Te ayudo a encontrar el horario ideal. ¿Qué servicio necesitas?</div><div className={styles.chatStatus}><Sparkles /> Respuesta enviada en 4 s</div></div><div className={styles.metric}><TrendingUp /><span><small>Conversaciones atendidas</small><strong>24 / 7</strong></span></div><Image src={content.heroImage} alt="Imagen principal de Crisdal" width={620} height={620} priority unoptimized /></div>
    </section>

    <section className={styles.why}><div className={styles.sectionHead}><p className={styles.kicker}>Por qué Crisdal</p><h2>{content.whyTitle}</h2></div><div className={styles.whyGrid}><article><Target /><span>01</span><h3>Especialización real</h3><p>Hablamos el idioma de salud, estética y educación; no intentamos servir a todos de la misma manera.</p></article><article><Bot /><span>02</span><h3>IA dentro del servicio</h3><p>La automatización forma parte de la estrategia desde el inicio, no aparece como un extra desconectado.</p></article><article><Clapperboard /><span>03</span><h3>Producción propia</h3><p>Grabamos tu equipo, tus instalaciones y tu valor real. Nada de construir una marca con imágenes genéricas.</p></article></div></section>

    <section id="rubros" className={styles.sectors}><div className={styles.sectionHead}><p className={styles.kicker}>Dos rubros. Un enfoque profundo.</p><h2>{content.sectorsTitle}</h2></div><div className={styles.sectorGrid}><article id="salud"><HeartPulse /><p>SALUD & ESTÉTICA</p><h3>{content.healthTitle}</h3><span>{content.healthText}</span><a href={whatsapp} target="_blank" rel="noreferrer">Explorar solución <ArrowRight /></a></article><article id="educacion"><GraduationCap /><p>EDUCACIÓN</p><h3>{content.educationTitle}</h3><span>{content.educationText}</span><a href={whatsapp} target="_blank" rel="noreferrer">Explorar solución <ArrowRight /></a></article></div></section>

    <section id="servicios" className={styles.services}><div className={styles.sectionHead}><p className={styles.kicker}>Servicios conectados</p><h2>{content.servicesTitle}</h2><p>{content.servicesLead}</p></div><div className={styles.serviceGrid}>{content.services.map(({ id, title, text }, index) => { const Icon = serviceIcons[index]; const featured = index === 0; return <article key={id} className={featured ? styles.featuredService : ""}><span>{String(index + 1).padStart(2, "0")}</span><Icon /><h3>{title}</h3><p>{text}</p>{featured ? <b>LA BANDERA CRISDAL</b> : null}</article>; })}</div></section>

    <section id="metodo" className={styles.method}><div className={styles.sectionHead}><p className={styles.kicker}>Cómo trabajamos</p><h2>Primero entendemos.<br />Después conectamos.</h2></div><div className={styles.steps}>{[["01", "Diagnóstico", "Detectamos dónde se enfrían las oportunidades."], ["02", "Estrategia", "Definimos mensajes, recorrido y prioridades."], ["03", "Implementación", "Activamos contenido, sistemas y automatización."], ["04", "Optimización", "Medimos, aprendemos y mejoramos cada ciclo."]].map(([n, t, x]) => <article key={n}><strong>{n}</strong><div><h3>{t}</h3><p>{x}</p></div></article>)}</div></section>

    <section className={styles.alliesTeaser}><div><p className={styles.kicker}>Una ventaja solo para clientes</p><h2>Crecer también es saber<br />con quién conectarte.</h2><p>Nuestros clientes acceden a una red privada de aliados y proveedores verificados para generar nuevas oportunidades.</p><Link href="/aliados">Conocer la Red de Aliados <ArrowRight /></Link></div><div className={styles.alliesMap}><Handshake /><i /><i /><i /><span>NEGOCIOS CONECTADOS</span></div></section>

    <section id="resultados" className={styles.results}><div className={styles.sectionHead}><p className={styles.kicker}>Resultados que importan</p><h2>{content.resultsTitle}</h2></div><div className={styles.caseCard}><div><span>CASO DESTACADO</span><h3>{content.caseTitle}</h3><p>{content.caseText}</p></div><div><strong>{content.metricValue}</strong><span>{content.metricLabel}</span></div><Link href="/brochure">Ver brochure y proyectos <ArrowRight /></Link></div></section>

    <section id="nosotros" className={styles.about}><div><p className={styles.kicker}>Nosotros</p><h2>{content.aboutTitle}</h2><p>{content.aboutText}</p><a href={whatsapp} target="_blank" rel="noreferrer">Conversemos sobre tu proyecto <ArrowRight /></a></div><div className={styles.aboutVisual}><Image src={aboutImage} alt="Equipo de Crisdal Agency" width={1600} height={1600} unoptimized /><span>HUANCAYO · PERÚ</span></div></section>

    <section className={styles.faq}><div className={styles.sectionHead}><p className={styles.kicker}>Preguntas frecuentes</p><h2>Antes de empezar.</h2></div><div>{faqs.map(([question, answer], index) => <details key={question} open={index === 0}><summary>{question}<ChevronDown /></summary><p>{answer}</p></details>)}</div></section>

    <section className={styles.finalCta}><Image src={content.finalImage} alt="Crisdal" width={500} height={500} unoptimized /><div><p className={styles.kicker}>{content.finalKicker}</p><h2>{content.finalTitle}</h2><a href={whatsapp} target="_blank" rel="noreferrer">Agenda tu diagnóstico gratis <ArrowRight /></a></div></section>
    <footer className={styles.footer}><div className={styles.footerBrand}><Image src={content.logoUrl} alt="Crisdal Agency" width={1080} height={1080} unoptimized /><p>Transformamos ideas en resultados.</p></div><div><strong>Explora</strong><a href="#servicios">Servicios</a><a href="#rubros">Rubros</a><Link href="/aliados">Red de Aliados</Link><Link href="/brochure">Brochure</Link></div><div><strong>Contacto</strong><a href={whatsapp}>WhatsApp</a><a href="mailto:crisdalagency@gmail.com">crisdalagency@gmail.com</a><span>Huancayo, Perú</span></div><div className={styles.footerBottom}><span>© 2026 Crisdal Agency</span><Link href="/formulario">Formulario para clientes</Link></div></footer>
    <a className={styles.floatingWa} href={whatsapp} target="_blank" rel="noreferrer" aria-label="Escribir a Crisdal por WhatsApp"><MessageCircle /><span>WhatsApp</span></a>
  </main>;
}

function HighlightedTitle({ value }: { value: string }) {
  const lines = value.split("\n");
  return <>{lines.map((line, lineIndex) => <span key={`${line}-${lineIndex}`}>{line.split(/(PACIENTE)/i).map((part, index) => part.toLowerCase() === "paciente" ? <em key={index}>{part}</em> : part)}{lineIndex < lines.length - 1 ? <br /> : null}</span>)}</>;
}
