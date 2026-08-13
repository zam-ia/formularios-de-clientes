"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Clapperboard,
  Code2,
  Compass,
  Eye,
  Handshake,
  HeartPulse,
  Layers3,
  LoaderCircle,
  Menu,
  MessageCircle,
  Palette,
  Play,
  Quote,
  Route,
  Send,
  Sparkles,
  Target,
  Users,
  Workflow,
  X,
} from "lucide-react";
import type { SiteContent } from "@/lib/siteContent";
import styles from "./home.module.css";

const serviceIcons = [Compass, BarChart3, Palette, Clapperboard, Code2, Bot];
const steps = [
  ["01", "Diagnóstico", "Entendemos el problema, el contexto y el punto de partida."],
  ["02", "Estrategia", "Priorizamos la ruta con mayor impacto y menor fricción."],
  ["03", "Implementación", "Conectamos creatividad, tecnología y responsables."],
  ["04", "Optimización", "Medimos, aprendemos y mejoramos cada ciclo."],
];
const faqs = [
  [
    "¿Crisdal es solo una agencia de marketing?",
    "No. El marketing es una capacidad dentro de una ruta que también puede integrar estrategia, producción audiovisual, diseño web, automatización y analítica.",
  ],
  [
    "¿Tengo que contratar todos los servicios?",
    "No. Primero identificamos el cuello de botella y activamos únicamente las capacidades necesarias para resolverlo.",
  ],
  [
    "¿También implementan la solución?",
    "Sí. Podemos acompañar diagnóstico, diseño, implementación, seguimiento y optimización según el alcance acordado.",
  ],
  [
    "¿Trabajan fuera de Huancayo?",
    "Sí. Atendemos proyectos de forma remota y coordinamos producción presencial según la ubicación y el alcance.",
  ],
];

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function track(event: string, params: Record<string, string> = {}) {
  window.dataLayer?.push({ event, ...params });
  window.dispatchEvent(
    new CustomEvent("crisdal:track", { detail: { event, ...params } }),
  );
}

export default function HomePage({ content }: { content: SiteContent }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactState, setContactState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const formStarted = useRef(false);
  const whatsapp = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, quiero solicitar un diagnóstico para mi negocio.")}`;

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute("data-visible", "true");
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.14 },
    );
    nodes.forEach((node) => observer.observe(node));
    const sent = new Set<number>();
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;
      const progress = window.scrollY / max;
      [50, 90].forEach((point) => {
        if (progress >= point / 100 && !sent.has(point)) {
          sent.add(point);
          track(`scroll_${point}`);
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (contactState === "sending") return;
    setContactState("sending");
    try {
      const payload = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
      if (!payload.company?.trim()) payload.company = "Sin especificar";
      const response = await fetch("/api/brochure-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("No pudimos enviar tu consulta.");
      event.currentTarget.reset();
      setContactState("sent");
      track("lead_form_submit");
    } catch {
      setContactState("error");
    }
  }

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: "Crisdal Agency",
    url: "https://crisdalagency.vercel.app",
    logo: "https://crisdalagency.vercel.app/brand/crisdal-agency-logo.png",
    areaServed: "Perú",
    address: { "@type": "PostalAddress", addressLocality: "Huancayo", addressCountry: "PE" },
    sameAs: [],
    telephone: `+${content.whatsappNumber}`,
  };

  return (
    <main className={styles.site}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <header className={styles.header}>
        <a className={styles.brand} href="#inicio" aria-label="Crisdal Agency, inicio">
          <Image src={content.logoUrl} alt="Crisdal Agency" width={1080} height={1080} priority unoptimized />
        </a>
        <nav className={menuOpen ? styles.navOpen : ""} aria-label="Navegación principal">
          <a href="#servicios" onClick={() => setMenuOpen(false)}>Servicios</a>
          <a href="#casos" onClick={() => setMenuOpen(false)}>Casos</a>
          <a href="#metodo" onClick={() => setMenuOpen(false)}>Método</a>
          <a href="#nosotros" onClick={() => setMenuOpen(false)}>Nosotros</a>
          <a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
        </nav>
        <a
          className={styles.headerCta}
          href="#contacto"
          onClick={() => track("hero_cta_click", { placement: "header" })}
        >
          Solicitar diagnóstico <ArrowRight />
        </a>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section id="inicio" className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroCopy} data-reveal>
          <p className={styles.kicker}><i /> {content.heroKicker}</p>
          <h1>{content.heroTitle.split("\n").map((line) => <span key={line}>{line}<br /></span>)}</h1>
          <p>{content.heroLead}</p>
          <div className={styles.heroActions}>
            <a href="#casos" onClick={() => track("open_case", { placement: "hero" })}>
              Ver trabajos <ArrowRight />
            </a>
            <Link href="/brochure#planes" onClick={() => track("click_plan", { placement: "hero" })}>
              <Play /> Conocer planes
            </Link>
          </div>
          <div className={styles.heroProof}>
            <span><Check /> Diagnóstico antes de ejecutar</span>
            <span><Check /> Producción propia</span>
            <span><Check /> Resultados trazables</span>
          </div>
        </div>
        <div className={styles.heroVisual} data-reveal>
          <Media
            kind={content.heroMediaKind}
            src={content.heroMedia}
            poster={content.heroPoster}
            alt="Equipo y trabajo de Crisdal Agency"
            priority
          />
          <span className={styles.visualBadge}><Sparkles /> Estrategia conectada</span>
          <span className={styles.visualIndex}>CRISDAL / 2026</span>
        </div>
        <a className={styles.scrollCue} href="#prueba"><ArrowDownRight /> Explorar</a>
      </section>

      <section id="prueba" className={styles.proofStrip} aria-label="Diferenciales de Crisdal">
        <p>UNA RUTA CONECTADA</p>
        <div>
          <span><Target /> Estrategia</span>
          <span><Palette /> Creatividad</span>
          <span><Layers3 /> Tecnología</span>
          <span><BarChart3 /> Medición</span>
        </div>
      </section>

      <section id="casos" className={styles.cases}>
        <SectionHeading kicker="Prueba antes que promesas" title={content.resultsTitle} />
        <article className={styles.caseCard} data-reveal>
          <div className={styles.caseMedia}>
            <Media kind={content.caseMediaKind} src={content.caseImage} poster={content.casePoster} alt={content.caseTitle} />
            <span>{content.caseCategory}</span>
          </div>
          <div className={styles.caseContent}>
            <p className={styles.caseEyebrow}>CASO DESTACADO</p>
            <h3>{content.caseTitle}</h3>
            <dl>
              <div><dt>Problema</dt><dd>{content.caseChallenge}</dd></div>
              <div><dt>Solución</dt><dd>{content.caseSolution}</dd></div>
              <div><dt>Ejecución</dt><dd>{content.caseExecution}</dd></div>
            </dl>
            {content.metricValue && content.metricLabel ? (
              <div className={styles.caseMetric}><strong>{content.metricValue}</strong><span>{content.metricLabel}</span></div>
            ) : null}
            <Link href="/brochure" onClick={() => track("case_study_open", { case: content.caseTitle })}>
              Ver proyectos y brochure <ArrowRight />
            </Link>
          </div>
        </article>
        <div className={styles.caseQuickLinks}>
          <Link href="/casos/change-the-slim-studio" onClick={() => track("open_case", { case: "Change" })}>
            <span>Branding + contenido</span><strong>Change The Slim Studio</strong><ArrowRight />
          </Link>
          <Link href="/casos/colegio-san-juan" onClick={() => track("open_case", { case: "San Juan" })}>
            <span>Educación + campaña</span><strong>Colegio San Juan</strong><ArrowRight />
          </Link>
        </div>
      </section>

      <section id="servicios" className={styles.services}>
        <SectionHeading kicker="Capacidades" title={content.servicesTitle} text={content.servicesLead} />
        <div className={styles.serviceGrid}>
          {content.services.map((service, index) => {
            const Icon = serviceIcons[index] || Workflow;
            return (
              <a
                key={service.id}
                href="#contacto"
                data-reveal
                onClick={() => track("service_open", { service: service.title })}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <Icon />
                <h3>{service.title}</h3>
                <p>{service.text}</p>
                <ArrowDownRight />
              </a>
            );
          })}
        </div>
      </section>

      <section id="metodo" className={styles.method}>
        <div className={styles.methodIntro} data-reveal>
          <p className={styles.kicker}>Cómo trabajamos</p>
          <h2>Primero entendemos.<br />Después conectamos.</h2>
          <p>Un proceso claro reduce incertidumbre, retrabajo y decisiones aisladas.</p>
          <a href="#contacto">Solicitar diagnóstico <ArrowRight /></a>
        </div>
        <ol className={styles.steps}>
          {steps.map(([number, title, text]) => (
            <li key={number} data-reveal><strong>{number}</strong><div><h3>{title}</h3><p>{text}</p></div></li>
          ))}
        </ol>
      </section>

      <section className={styles.difference}>
        <div className={styles.differenceCopy} data-reveal>
          <p className={styles.kicker}>Por qué Crisdal</p>
          <h2>{content.whyTitle}</h2>
          <p>La estrategia define qué hacer. La creatividad lo vuelve visible. La distribución lo pone frente a las personas correctas. La conversión demuestra si funcionó.</p>
        </div>
        <div className={styles.differenceMap} aria-label="Ruta Crisdal">
          {["Estrategia", "Creatividad", "Distribución", "Conversión"].map((item, index) => (
            <div key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong></div>
          ))}
        </div>
      </section>

      <section className={styles.sectors}>
        <SectionHeading kicker="Especialización" title={content.sectorsTitle} />
        <div>
          <article data-reveal><HeartPulse /><span>01</span><h3>{content.healthTitle}</h3><p>{content.healthText}</p></article>
          <article data-reveal><Users /><span>02</span><h3>{content.educationTitle}</h3><p>{content.educationText}</p></article>
        </div>
      </section>

      {content.testimonials.some((item) => item.visible) ? (
        <section className={styles.testimonials}>
          <SectionHeading kicker="Experiencias autorizadas" title="Lo que cambia cuando las piezas empiezan a conversar." />
          <div>
            {content.testimonials.filter((item) => item.visible).map((item) => (
              <blockquote key={item.id} data-reveal>
                <Quote />
                <p>“{item.quote}”</p>
                <footer><strong>{item.name}</strong><span>{[item.role, item.company].filter(Boolean).join(" · ")}</span></footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}

      <section id="nosotros" className={styles.about}>
        <div className={styles.aboutMedia} data-reveal>
          <Image src={content.aboutImage} alt="Equipo de Crisdal Agency en Huancayo" fill unoptimized sizes="(max-width: 800px) 100vw, 52vw" />
          <span>HUANCAYO · PERÚ</span>
        </div>
        <div className={styles.aboutCopy} data-reveal>
          <p className={styles.kicker}>Nosotros</p>
          <h2>{content.aboutTitle}</h2>
          <p>{content.aboutText}</p>
          <div><span><Handshake /> Un equipo</span><span><Route /> Una ruta</span><span><Eye /> Avance visible</span></div>
          <a href="#contacto">Conversemos <ArrowRight /></a>
        </div>
      </section>

      <section className={styles.faq}>
        <SectionHeading kicker="Preguntas frecuentes" title="Antes de empezar." text="La claridad también consiste en saber qué esperar." />
        <div>
          {faqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<ChevronDown /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="contacto" className={styles.contact}>
        <div className={styles.contactMedia}>
          <Media kind={content.finalMediaKind} src={content.finalMedia} poster={content.finalPoster} alt="Crisdal Agency" />
        </div>
        <div className={styles.contactCopy}>
          <p className={styles.kicker}>{content.finalKicker}</p>
          <h2>{content.finalTitle}</h2>
          <p>Déjanos cuatro datos. Te escribiremos para entender el contexto antes de recomendar una solución.</p>
          <form
            onSubmit={(event) => void submitContact(event)}
            onFocus={() => {
              if (!formStarted.current) {
                formStarted.current = true;
                track("lead_form_start");
              }
            }}
          >
            <label>Nombre<input name="name" autoComplete="name" required minLength={2} placeholder="Tu nombre" /></label>
            <label>WhatsApp<input name="whatsapp" type="tel" autoComplete="tel" required minLength={8} placeholder="+51 987 654 321" /></label>
            <label>Empresa <span>opcional</span><input name="company" autoComplete="organization" placeholder="Nombre de tu negocio" /></label>
            <label>¿Qué necesitas?<textarea name="message" required minLength={10} rows={3} placeholder="Cuéntanos brevemente qué quieres mejorar" /></label>
            <input className={styles.honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button disabled={contactState === "sending"}>
              {contactState === "sending" ? <LoaderCircle className={styles.spin} /> : <Send />}
              {contactState === "sending" ? "Enviando…" : "Enviar proyecto"}
            </button>
            <a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => track("whatsapp_click", { placement: "contact" })}>
              <MessageCircle /> Prefiero WhatsApp
            </a>
            <p className={contactState === "error" ? styles.formError : styles.formStatus} role="status">
              {contactState === "sent" ? "Listo. Recibimos tu mensaje y te contactaremos pronto." : contactState === "error" ? "No pudimos enviarlo. Intenta por WhatsApp." : "Tus datos se usan únicamente para responder tu consulta."}
            </p>
          </form>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><Image src={content.logoUrl} alt="Crisdal Agency" width={1080} height={1080} unoptimized /><p>Transformamos ideas en resultados.</p></div>
        <div><strong>Explora</strong><a href="#servicios">Servicios</a><a href="#casos">Casos</a><Link href="/brochure">Brochure</Link><Link href="/aliados">Red de Aliados</Link></div>
        <div><strong>Contacto</strong><a href={whatsapp}>WhatsApp</a><a href="mailto:crisdalagency@gmail.com">crisdalagency@gmail.com</a><span>Huancayo, Perú</span></div>
        <p>© 2026 Crisdal Agency · Estrategia, creatividad y tecnología.</p>
      </footer>
      <a className={styles.floatingWa} href={whatsapp} target="_blank" rel="noreferrer" aria-label="Escribir a Crisdal por WhatsApp" onClick={() => track("whatsapp_click", { placement: "floating" })}>
        <MessageCircle /><span>WhatsApp</span>
      </a>
    </main>
  );
}

function SectionHeading({ kicker, title, text }: { kicker: string; title: string; text?: string }) {
  return <header className={styles.sectionHead} data-reveal><p className={styles.kicker}>{kicker}</p><h2>{title}</h2>{text ? <p>{text}</p> : null}</header>;
}

function Media({ kind, src, poster, alt, priority = false }: { kind: "image" | "video"; src: string; poster: string; alt: string; priority?: boolean }) {
  return kind === "video" ? (
    <div className={styles.mediaAsset}>
      <Image src={poster} alt={alt} fill priority={priority} unoptimized sizes="(max-width: 800px) 100vw, 48vw" />
      <video src={src} poster={poster} muted loop autoPlay playsInline preload={priority ? "auto" : "metadata"} aria-label={alt} />
    </div>
  ) : (
    <div className={styles.mediaAsset}>
      <Image src={src} alt={alt} fill priority={priority} unoptimized sizes="(max-width: 800px) 100vw, 48vw" />
    </div>
  );
}
