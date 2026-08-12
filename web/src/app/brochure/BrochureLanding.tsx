'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Check, CircleDot, Menu, MessageCircle, RefreshCw, Route, Users, Workflow, X } from 'lucide-react';
import type { BrochureContent } from '@/lib/brochure';
import styles from './brochure.module.css';

const problems = [
  { number: '01', title: 'Publicidad sin sistema', text: 'Llegan consultas, pero el seguimiento depende de chats, personas o tareas manuales.', result: 'Se paga por generar demanda que después se pierde.' },
  { number: '02', title: 'Crecimiento desordenado', text: 'Aumentan clientes, tareas y personas, pero las responsabilidades y procesos no crecen al mismo ritmo.', result: 'Aparecen retrabajo, retrasos y dependencia de personas clave.' },
  { number: '03', title: 'Rentabilidad invisible', text: 'Se vende más, pero los costos, errores y falta de control crecen junto con las ventas.', result: 'Crecer deja de significar necesariamente ganar más.' },
];

const solutions = [
  { code: 'STRATEGY', question: '¿Sabes exactamente qué deberías resolver primero?', text: 'Diagnóstico, posicionamiento, objetivos y roadmap para convertir problemas dispersos en prioridades claras.', result: 'De intuición → a dirección.' },
  { code: 'GROWTH', question: '¿Generas atención pero no suficientes oportunidades comerciales?', text: 'Contenido, campañas, pauta y embudos conectados con una ruta medible hacia consultas, citas, matrículas o ventas.', result: 'De publicaciones → a demanda trazable.' },
  { code: 'SYSTEMS', question: '¿Tu crecimiento sigue dependiendo de tareas manuales y chats separados?', text: 'Procesos, CRM, automatización, IA, web, dashboards e integraciones para reducir fricción y mejorar trazabilidad.', result: 'De tareas aisladas → a sistema.' },
  { code: 'CULTURE', question: '¿La estrategia existe, pero el equipo no logra sostenerla?', text: 'Claridad de funciones, comunicación interna, cultura y gestión del cambio para que las mejoras no dependan de una persona.', result: 'De dependencia → a adopción.' },
];

const nexo = [
  { letter: 'N', title: 'Necesidad', text: '¿Qué problema económico u operativo necesita resolverse realmente?', icon: CircleDot },
  { letter: 'E', title: 'Estrategia', text: '¿Qué camino puede generar mayor impacto con menor complejidad?', icon: Route },
  { letter: 'X', title: 'Experiencia', text: '¿Cómo funcionará para el cliente y para las personas que tendrán que ejecutarlo?', icon: Users },
  { letter: 'O', title: 'Optimización', text: '¿Qué datos demostrarán avance y qué debemos corregir?', icon: RefreshCw },
];

const team = [
  { initials: 'AP', name: 'Aldair Pérez', role: 'Estrategia & Procesos', focus: 'Administración, operación y estructura.' },
  { initials: 'MR', name: 'Milagros Ríos', role: 'Cultura & Personas', focus: 'Psicología organizacional, cultura y gestión del cambio.' },
  { initials: 'DP', name: 'Damaris Pérez', role: 'Comunicación & Growth', focus: 'Comunicación estratégica, publicidad y marca.' },
];

const steps = ['Diagnóstico', 'Mapa de solución', 'Implementación', 'Medición', 'Optimización'];
const faq = [
  ['¿Crisdal es una agencia de marketing?', 'El marketing es una de nuestras capacidades. Crisdal integra estrategia, operación, comunicación, cultura y tecnología dependiendo del problema detectado.'],
  ['¿Tengo que contratar todos los servicios?', 'No. Primero identificamos el cuello de botella y priorizamos una solución proporcional al problema y al presupuesto.'],
  ['¿También implementan o solamente hacen consultoría?', 'El modelo combina diagnóstico, diseño, implementación, seguimiento y optimización según el alcance aprobado.'],
  ['¿Trabajan con empresas pequeñas?', 'El mejor cliente no depende únicamente del tamaño. Trabajamos mejor con empresas que ya reciben oportunidades y están dispuestas a medir e implementar mejoras.'],
  ['¿Trabajan únicamente en Lima?', 'Atendemos proyectos en Perú de forma presencial y remota según el alcance.'],
];

declare global { interface Window { dataLayer?: Array<Record<string, unknown>> } }

function track(name: string, detail: Record<string, string> = {}) {
  window.dataLayer?.push({ event: name, ...detail });
  window.dispatchEvent(new CustomEvent('crisdal:track', { detail: { event: name, ...detail } }));
}

export default function BrochureLanding({ content }: { content: BrochureContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const whatsappUrl = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent('Hola Crisdal, vi su brochure y quiero solicitar un diagnóstico.')}`;
  const diagnosticUrl = content.ctaUrl || '/';
  const caseImages = content.media.filter((item) => item.kind === 'image').slice(0, 3);

  useEffect(() => {
    const nodes = document.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.setAttribute('data-visible', 'true')), { threshold: 0.12 });
    nodes.forEach((node) => observer.observe(node));
    let sent50 = false;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (!sent50 && max > 0 && window.scrollY / max >= 0.5) { sent50 = true; track('brochure_scroll_50'); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); };
  }, []);

  return <main className={styles.page}>
    <header className={styles.header}>
      <a className={styles.brand} href="#inicio" aria-label="Crisdal Agency, inicio"><span className={styles.mark}>C</span><span>CRISDAL<small>AGENCY</small></span></a>
      <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ''}`} aria-label="Navegación principal">
        <a href="#problema" onClick={() => setMenuOpen(false)}>Qué resolvemos</a><a href="#soluciones" onClick={() => setMenuOpen(false)}>Soluciones</a><a href="#nexo" onClick={() => setMenuOpen(false)}>Método NEXO</a><a href="#caso" onClick={() => setMenuOpen(false)}>Caso real</a><a href="#equipo" onClick={() => setMenuOpen(false)}>Nosotros</a>
      </nav>
      <a className={styles.headerCta} href={diagnosticUrl} onClick={() => track('diagnostic_click', { placement: 'header' })}>Solicitar diagnóstico</a>
      <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}>{menuOpen ? <X /> : <Menu />}</button>
    </header>

    <section id="inicio" className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden="true" /><div className={styles.noise} aria-hidden="true" />
      <div className={styles.heroCopy} data-reveal>
        <p className={styles.eyebrow}>{content.kicker}</p>
        <h1>{content.title.toLowerCase() === 'crecer con orden.' ? <>Crecer<br /><em>con orden.</em></> : content.title}</h1>
        <p className={styles.promise}>{content.lead}</p>
        <p className={styles.support}>Ayudamos a empresas de servicios que ya reciben oportunidades, pero necesitan ordenar su estrategia, operación, equipo y tecnología para aprovecharlas mejor.</p>
        <div className={styles.actions}><a className={styles.primary} href={diagnosticUrl} onClick={() => track('diagnostic_click', { placement: 'hero' })}>{content.ctaLabel} <ArrowRight /></a><a className={styles.secondary} href="#ruta">Ver cómo trabajamos <ArrowDown /></a></div>
        <p className={styles.microcopy}>Diagnóstico <span>→</span> implementación <span>→</span> medición <span>→</span> optimización</p>
      </div>
      <div className={styles.heroSystem} aria-label="Del caos al orden" data-reveal>
        <div className={styles.systemLabel}><span>CAOS</span><span>ORDEN</span></div>
        <div className={styles.chaosNodes}>{[0,1,2,3,4,5,6].map((n) => <i key={n} />)}</div>
        <svg viewBox="0 0 560 420" aria-hidden="true"><path className={styles.routeLine} d="M42 332 C120 40 230 400 294 202 S430 86 518 80"/><circle cx="294" cy="202" r="58"/><path d="M270 202h50m-18-18 18 18-18 18"/></svg>
        <div className={styles.orderStack}><i/><i/><i/><i/></div>
        <span className={styles.systemNote}>Conectamos lo que hoy trabaja separado.</span>
      </div>
    </section>

    <section id="problema" className={styles.problemSection}>
      <div className={styles.sectionHead} data-reveal><p className={styles.eyebrow}>Crecer no debería desordenarte</p><h2>¿Tu empresa vende más, pero cada vez resulta más difícil controlarla?</h2><p>El problema no siempre es conseguir más clientes. Muchas veces el crecimiento empieza a revelar fallas que antes permanecían ocultas.</p></div>
      <div className={styles.problemFlow}>{problems.map((item) => <article key={item.number} data-reveal><span>{item.number}</span><h3>{item.title}</h3><p>{item.text}</p><strong>Resultado</strong><p>{item.result}</p></article>)}</div>
    </section>

    <section className={styles.manifesto}><div data-reveal><span>Más marketing</span><span>no arregla</span><strong>{content.storyTitle}</strong><p>{content.story}</p></div></section>

    <section id="soluciones" className={styles.solutions}>
      <div className={styles.sectionHead} data-reveal><p className={styles.eyebrow}>Un sistema integrado</p><h2>Intervenimos donde se está frenando tu crecimiento.</h2><p>No necesitas contratar todo. Primero detectamos qué está limitando el negocio y priorizamos la intervención.</p></div>
      <div className={styles.solutionGrid}>{solutions.map((item, index) => { const editable = content.services[index]; return <article key={item.code} data-reveal><span>{String(index + 1).padStart(2, '0')}</span><p className={styles.solutionCode}>CRISDAL {editable?.title?.toUpperCase() || item.code}</p><h3>{item.question}</h3><p>{editable?.description || item.text}</p><strong>{item.result}</strong></article>; })}</div>
      <p className={styles.integratedNote} data-reveal><Workflow /> No coordinas cinco proveedores diferentes. Conectamos estrategia, crecimiento, sistemas y cultura bajo una misma ruta.</p>
    </section>

    <section id="nexo" className={styles.nexoSection}>
      <div className={styles.nexoIntro} data-reveal><p className={styles.eyebrow}>Método propio</p><h2>NEXO</h2><p>Nuestro método para conectar el problema real con una solución que pueda sostenerse.</p></div>
      <div className={styles.nexoRoute}>{nexo.map((item) => { const Icon = item.icon; return <article key={item.letter} data-reveal><div><span>{item.letter}</span><Icon /></div><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div>
    </section>

    <section id="caso" className={styles.caseSection} onMouseEnter={() => track('case_view')}>
      <div className={styles.caseCopy} data-reveal><p className={styles.eyebrow}>Caso de transformación</p><h2>Rebagliati<br />Diplomados</h2><h3>Del diagnóstico al orden operativo.</h3><p>Un proyecto que permitió validar la evolución de Crisdal desde producción y marketing hacia una intervención integral de estrategia, procesos y cultura.</p><a href="#ruta">Ver cómo abordamos un problema <ArrowRight /></a></div>
      <div className={styles.caseEvidence} data-reveal>{caseImages.length ? <div className={styles.caseImages}>{caseImages.map((image) => <figure key={image.id}><Image src={image.url} alt={image.title || 'Evidencia autorizada del proceso Rebagliati Diplomados'} fill unoptimized sizes="(max-width: 800px) 90vw, 30vw" /></figure>)}</div> : <div className={styles.processMap} aria-label="Mapa conceptual del proceso"><span>Información</span><span>Procesos</span><span>Responsables</span><span>Cultura</span><i/><i/><i/></div>}
        <ol><li><span>Etapa 01</span><strong>Levantamiento</strong><p>Entrevistas, observación, información y diagnóstico.</p></li><li><span>Etapa 02</span><strong>Ordenamiento</strong><p>Procesos, responsabilidades, funciones y cultura.</p></li><li><span>Etapa 03</span><strong>Preparación para crecer</strong><p>Mayor claridad operativa y nuevas bases para evolución futura.</p></li></ol>
      </div>
    </section>

    <section className={styles.industries}><p className={styles.eyebrow}>Proyectos / Industrias</p><div><span>Salud</span><span>Educación</span><span>Bienestar</span><span>Servicios profesionales</span></div></section>

    <section id="equipo" className={styles.teamSection}>
      <div className={styles.sectionHead} data-reveal><p className={styles.eyebrow}>Equipo interdisciplinario</p><h2>Una firma construida desde disciplinas diferentes.</h2></div>
      <div className={styles.teamGrid}>{team.map((person) => <article key={person.name} data-reveal><div>{person.initials}</div><h3>{person.name}</h3><strong>{person.role}</strong><p>{person.focus}</p></article>)}</div>
      <p className={styles.teamFormula}>Empresa <span>+</span> personas <span>+</span> comunicación <span>+</span> tecnología.</p>
    </section>

    <section id="ruta" className={styles.routeSection}>
      <div className={styles.sectionHead} data-reveal><p className={styles.eyebrow}>Cómo trabajamos</p><h2>No empezamos diseñando. Empezamos entendiendo.</h2></div>
      <ol className={styles.projectRoute}>{steps.map((step, index) => <li key={step} data-reveal><span>{String(index + 1).padStart(2, '0')}</span><strong>{step}</strong></li>)}</ol>
      <p className={styles.routeNote}><Check /> Cada etapa tiene un objetivo, responsable, entregable y criterio de cierre.</p>
    </section>

    <section className={styles.faqSection}>
      <div data-reveal><p className={styles.eyebrow}>Preguntas frecuentes</p><h2>Antes de empezar.</h2><p>La claridad también consiste en saber qué esperar.</p></div>
      <div>{faq.map(([question, answer]) => <details key={question} onToggle={(event) => event.currentTarget.open && track('faq_open', { question })}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}</div>
    </section>

    <section className={styles.finalCta} data-reveal>
      <div><p className={styles.eyebrow}>Radiografía de Marca</p><h2>El crecimiento ya te está mostrando dónde duele.<br /><em>Identifiquemos dónde empezar.</em></h2><p>Completa nuestra Radiografía de Marca y danos el contexto necesario para entender tu situación antes de proponerte una solución.</p><small>Sin propuestas genéricas. Primero entendemos.</small></div>
      <div><a className={styles.primary} href={diagnosticUrl} onClick={() => track('diagnostic_click', { placement: 'final' })}>{content.ctaLabel} <ArrowRight /></a><a className={styles.secondaryLight} href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => track('whatsapp_click', { placement: 'final' })}><MessageCircle /> Prefiero conversar por WhatsApp</a></div>
    </section>

    <footer className={styles.footer}><div className={styles.brand}><span className={styles.mark}>C</span><span>CRISDAL<small>AGENCY</small></span></div><p>Strategy · Growth · Systems · Culture</p><strong>Crecer con orden.</strong></footer>
    <div className={styles.mobileBar}><a href={diagnosticUrl} onClick={() => track('diagnostic_click', { placement: 'mobile_bar' })}>Diagnóstico</a><a href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => track('whatsapp_click', { placement: 'mobile_bar' })}><MessageCircle /> WhatsApp</a></div>
  </main>;
}
