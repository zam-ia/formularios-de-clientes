"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Check,
  ChevronDown,
  Clapperboard,
  Code2,
  GraduationCap,
  Handshake,
  HeartPulse,
  Menu,
  MessageCircle,
  Palette,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  Workflow,
  X,
} from "lucide-react";
import styles from "./home.module.css";

const whatsapp = "https://wa.me/51987088359?text=Hola%20Crisdal%2C%20quiero%20agendar%20un%20diagn%C3%B3stico%20gratis.";

const services = [
  { icon: BrainCircuit, title: "Automatización IA & WhatsApp", text: "Respuestas, seguimiento y derivación sin dejar conversaciones esperando.", featured: true },
  { icon: MessageCircle, title: "Redes & contenido", text: "Estrategia y piezas que sostienen una conversación real con tu mercado." },
  { icon: Clapperboard, title: "Producción audiovisual", text: "Foto y video propio, producido en tu espacio y pensado para vender." },
  { icon: Code2, title: "Diseño web", text: "Sitios rápidos y claros que convierten visitas en oportunidades." },
  { icon: Workflow, title: "Apps & software", text: "Herramientas a medida para ordenar operaciones y atención." },
  { icon: Palette, title: "Branding", text: "Una identidad reconocible, coherente y lista para crecer." },
];

const faqs = [
  ["¿El bot realmente entiende a mis pacientes o alumnos?", "Diseñamos flujos con lenguaje natural, contexto de tu negocio y rutas claras para derivar a una persona cuando corresponde."],
  ["¿Qué pasa si la IA no sabe responder algo?", "No improvisa. El sistema reconoce límites, registra la consulta y la entrega al responsable adecuado con todo el contexto."],
  ["¿Tengo que contratar todos los servicios?", "No. Empezamos con un diagnóstico y priorizamos lo que hoy genera más fricción o pérdida de oportunidades."],
  ["¿Trabajan de manera presencial en Huancayo?", "Sí. La producción audiovisual y las reuniones clave pueden realizarse en sitio; la operación y el seguimiento también funcionan de forma remota."],
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <main className={styles.site}>
      <header className={styles.header}>
        <Link href="#inicio" className={styles.brand} aria-label="Crisdal Agency, inicio">
          <Image src="/brand/crisdal-agency-logo.png" alt="Crisdal Agency" width={1080} height={1080} priority />
        </Link>
        <nav className={menuOpen ? styles.navOpen : ""} aria-label="Navegación principal">
          <a href="#inicio" onClick={() => setMenuOpen(false)}>Inicio</a>
          <div className={styles.dropdown}>
            <a href="#servicios">Servicios <ChevronDown /></a>
            <div><a href="#servicios">IA & WhatsApp</a><a href="#servicios">Contenido audiovisual</a><a href="#servicios">Web, apps y branding</a></div>
          </div>
          <div className={styles.dropdown}>
            <a href="#rubros">Rubros <ChevronDown /></a>
            <div><a href="#salud">Salud & Estética</a><a href="#educacion">Educación</a></div>
          </div>
          <Link href="/aliados">Red de Aliados <span>PRIVADA</span></Link>
          <a href="#resultados">Resultados</a>
          <a href="#nosotros">Nosotros</a>
        </nav>
        <a className={styles.headerCta} href={whatsapp} target="_blank" rel="noreferrer">Agenda tu diagnóstico <ArrowRight /></a>
        <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}>{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <section id="inicio" className={styles.hero}>
        <div className={styles.heroGrid} />
        <div className={styles.heroCopy}>
          <p className={styles.kicker}><i /> Marketing, automatización y sistemas</p>
          <h1>QUE NINGÚN<br /><em>PACIENTE</em> O ALUMNO<br />SE QUEDE ESPERANDO.</h1>
          <p>Conectamos estrategia, contenido y automatización con IA para que tu negocio responda mejor, venda con orden y pueda crecer sin saturar a tu equipo.</p>
          <div className={styles.heroActions}>
            <a href={whatsapp} target="_blank" rel="noreferrer">Agenda tu diagnóstico gratis <ArrowRight /></a>
            <a href="#metodo"><Play /> Ver cómo trabajamos</a>
          </div>
          <div className={styles.heroProof}><span><Check /> Especialistas en dos rubros</span><span><Check /> Producción propia</span><span><Check /> IA integrada</span></div>
        </div>
        <div className={styles.heroVisual} aria-label="Sistema de atención automatizada de Crisdal">
          <div className={styles.orbit}><BrainCircuit /><span>IA activa</span></div>
          <div className={styles.phone}>
            <div className={styles.phoneHead}><b>C</b><span>Asistente CRISDAL<small>En línea ahora</small></span></div>
            <div className={styles.chatIncoming}>Hola, quisiera información sobre una cita.</div>
            <div className={styles.chatOutgoing}>¡Claro! Te ayudo a encontrar el horario ideal. ¿Qué servicio necesitas?</div>
            <div className={styles.chatStatus}><Sparkles /> Respuesta enviada en 4 s</div>
          </div>
          <div className={styles.metric}><TrendingUp /><span><small>Conversaciones atendidas</small><strong>24 / 7</strong></span></div>
          <Image src="/avatar-crisdal-cutout-v2.png" alt="Avatar de Crisdal" width={620} height={620} priority />
        </div>
      </section>

      <section className={styles.why}>
        <div className={styles.sectionHead}><p className={styles.kicker}>Por qué Crisdal</p><h2>No hacemos marketing aislado.<br />Construimos un sistema que responde.</h2></div>
        <div className={styles.whyGrid}>
          <article><Target /><span>01</span><h3>Especialización real</h3><p>Hablamos el idioma de salud, estética y educación; no intentamos servir a todos de la misma manera.</p></article>
          <article><Bot /><span>02</span><h3>IA dentro del servicio</h3><p>La automatización forma parte de la estrategia desde el inicio, no aparece como un extra desconectado.</p></article>
          <article><Clapperboard /><span>03</span><h3>Producción propia</h3><p>Grabamos tu equipo, tus instalaciones y tu valor real. Nada de construir una marca con imágenes genéricas.</p></article>
        </div>
      </section>

      <section id="rubros" className={styles.sectors}>
        <div className={styles.sectionHead}><p className={styles.kicker}>Dos rubros. Un enfoque profundo.</p><h2>Tu cliente necesita sentir que lo entiendes antes de escribirte.</h2></div>
        <div className={styles.sectorGrid}>
          <article id="salud"><HeartPulse /><p>SALUD & ESTÉTICA</p><h3>¿Cuántos pacientes se van porque nadie respondió a tiempo?</h3><span>Automatizamos consultas, citas y seguimiento sin perder el trato humano.</span><a href={whatsapp} target="_blank" rel="noreferrer">Explorar solución <ArrowRight /></a></article>
          <article id="educacion"><GraduationCap /><p>EDUCACIÓN</p><h3>¿Tu equipo de informes se satura durante la matrícula?</h3><span>Ordenamos consultas, registros y seguimiento para que cada interesado avance.</span><a href={whatsapp} target="_blank" rel="noreferrer">Explorar solución <ArrowRight /></a></article>
        </div>
      </section>

      <section id="servicios" className={styles.services}>
        <div className={styles.sectionHead}><p className={styles.kicker}>Servicios conectados</p><h2>Todo lo que tu marca necesita.<br />En el orden correcto.</h2><p>No coordinas cinco proveedores. Diseñamos una ruta y conectamos las piezas.</p></div>
        <div className={styles.serviceGrid}>{services.map(({ icon: Icon, title, text, featured }, index) => <article key={title} className={featured ? styles.featuredService : ""}><span>{String(index + 1).padStart(2,"0")}</span><Icon /><h3>{title}</h3><p>{text}</p>{featured ? <b>LA BANDERA CRISDAL</b> : null}</article>)}</div>
      </section>

      <section id="metodo" className={styles.method}>
        <div className={styles.sectionHead}><p className={styles.kicker}>Cómo trabajamos</p><h2>Primero entendemos.<br />Después conectamos.</h2></div>
        <div className={styles.steps}>{[["01","Diagnóstico","Detectamos dónde se enfrían las oportunidades."],["02","Estrategia","Definimos mensajes, recorrido y prioridades."],["03","Implementación","Activamos contenido, sistemas y automatización."],["04","Optimización","Medimos, aprendemos y mejoramos cada ciclo."]].map(([n,t,x])=><article key={n}><strong>{n}</strong><div><h3>{t}</h3><p>{x}</p></div></article>)}</div>
      </section>

      <section className={styles.alliesTeaser}>
        <div><p className={styles.kicker}>Una ventaja solo para clientes</p><h2>Crecer también es saber<br />con quién conectarte.</h2><p>Nuestros clientes acceden a una red privada de aliados y proveedores verificados para generar nuevas oportunidades.</p><Link href="/aliados">Conocer la Red de Aliados <ArrowRight /></Link></div>
        <div className={styles.alliesMap}><Handshake /><i /><i /><i /><span>NEGOCIOS CONECTADOS</span></div>
      </section>

      <section id="resultados" className={styles.results}>
        <div className={styles.sectionHead}><p className={styles.kicker}>Resultados que importan</p><h2>No mostramos piezas sueltas.<br />Mostramos lo que cambió.</h2></div>
        <div className={styles.caseCard}><div><span>CASO EN CONSTRUCCIÓN</span><h3>De conversaciones dispersas a un seguimiento visible.</h3><p>Los próximos casos mostrarán el problema, la solución implementada y la métrica alcanzada con autorización del cliente.</p></div><div><strong>0</strong><span>mensajes importantes olvidados</span></div><Link href="/brochure">Ver brochure y proyectos <ArrowRight /></Link></div>
      </section>

      <section id="nosotros" className={styles.about}>
        <div><p className={styles.kicker}>Nosotros</p><h2>Creatividad con estructura.<br />Tecnología con propósito.</h2><p>Somos un equipo de Huancayo que conecta comunicación, producción audiovisual y desarrollo para transformar ideas en resultados sostenibles.</p><a href={whatsapp} target="_blank" rel="noreferrer">Conversemos sobre tu proyecto <ArrowRight /></a></div>
        <div className={styles.aboutVisual}><Image src="/brand/crisdal-agency-logo.png" alt="Logo Crisdal Agency" width={1080} height={1080} /><span>HUANCAYO · PERÚ</span></div>
      </section>

      <section className={styles.faq}>
        <div className={styles.sectionHead}><p className={styles.kicker}>Preguntas frecuentes</p><h2>Antes de empezar.</h2></div>
        <div>{faqs.map(([q,a], index)=><details key={q} open={index===0}><summary>{q}<ChevronDown /></summary><p>{a}</p></details>)}</div>
      </section>

      <section className={styles.finalCta}><Image src="/avatar-crisdal-cutout-v2.png" alt="Avatar Crisdal" width={500} height={500} /><div><p className={styles.kicker}>Tu próxima oportunidad ya puede estar escribiéndote</p><h2>Haz que encuentre una respuesta.</h2><a href={whatsapp} target="_blank" rel="noreferrer">Agenda tu diagnóstico gratis <ArrowRight /></a></div></section>

      <footer className={styles.footer}><div className={styles.footerBrand}><Image src="/brand/crisdal-agency-logo.png" alt="Crisdal Agency" width={1080} height={1080} /><p>Transformamos ideas en resultados.</p></div><div><strong>Explora</strong><a href="#servicios">Servicios</a><a href="#rubros">Rubros</a><Link href="/aliados">Red de Aliados</Link><Link href="/brochure">Brochure</Link></div><div><strong>Contacto</strong><a href={whatsapp}>WhatsApp</a><a href="mailto:crisdalagency@gmail.com">crisdalagency@gmail.com</a><span>Huancayo, Perú</span></div><div className={styles.footerBottom}><span>© 2026 Crisdal Agency</span><Link href="/formulario">Formulario para clientes</Link></div></footer>
      <a className={styles.floatingWa} href={whatsapp} target="_blank" rel="noreferrer" aria-label="Escribir a Crisdal por WhatsApp"><MessageCircle /><span>WhatsApp</span></a>
    </main>
  );
}
