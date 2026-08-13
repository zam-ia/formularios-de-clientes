"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CircleDot,
  Menu,
  MessageCircle,
  RefreshCw,
  Route,
  Users,
  Workflow,
  X,
} from "lucide-react";
import type {
  BrochureCase,
  BrochureContent,
  BrochureMedia,
  BrochureSection,
} from "@/lib/brochure";
import styles from "./brochure.module.css";

const problems = [
  {
    number: "01",
    title: "Las consultas se enfrían",
    text: "Llegan personas interesadas, pero el seguimiento queda repartido entre chats, tareas y memoria.",
    result: "Hay oportunidades que se pierden sin que nadie lo note.",
  },
  {
    number: "02",
    title: "Todo pasa por pocas personas",
    text: "El negocio crece, pero las responsabilidades y procesos siguen viviendo en la cabeza del equipo.",
    result: "Aparecen retrabajos, retrasos y cansancio.",
  },
  {
    number: "03",
    title: "Vender más no se siente mejor",
    text: "Entran más proyectos, pero también crecen los errores, los costos y la dificultad para saber qué funciona.",
    result: "El esfuerzo aumenta más rápido que la rentabilidad.",
  },
];

const solutions = [
  {
    code: "STRATEGY",
    question: "¿Hay muchas ideas, pero cuesta decidir por dónde empezar?",
    text: "Ordenamos el panorama, elegimos prioridades y trazamos una ruta realista para avanzar.",
    result: "De la intuición → a una dirección compartida.",
  },
  {
    code: "GROWTH",
    question:
      "¿Tu marca llama la atención, pero no siempre genera conversaciones valiosas?",
    text: "Conectamos contenido, campañas y seguimiento para que cada esfuerzo tenga un propósito comercial claro.",
    result: "De publicar → a construir demanda.",
  },
  {
    code: "SYSTEMS",
    question:
      "¿El día a día todavía depende de tareas manuales y chats separados?",
    text: "Simplificamos procesos y sumamos tecnología donde realmente libera tiempo y mejora el control.",
    result: "De tareas sueltas → a un sistema que acompaña.",
  },
  {
    code: "CULTURE",
    question:
      "¿Las buenas ideas se quedan a medio camino porque el equipo no logra sostenerlas?",
    text: "Aclaramos funciones, comunicación y formas de trabajo para que el cambio también funcione para las personas.",
    result: "De depender de alguien → a trabajar en equipo.",
  },
];

const nexo = [
  {
    letter: "N",
    title: "Necesidad",
    text: "¿Qué problema económico u operativo necesita resolverse realmente?",
    icon: CircleDot,
  },
  {
    letter: "E",
    title: "Estrategia",
    text: "¿Qué camino puede generar mayor impacto con menor complejidad?",
    icon: Route,
  },
  {
    letter: "X",
    title: "Experiencia",
    text: "¿Cómo funcionará para el cliente y para las personas que tendrán que ejecutarlo?",
    icon: Users,
  },
  {
    letter: "O",
    title: "Optimización",
    text: "¿Qué datos demostrarán avance y qué debemos corregir?",
    icon: RefreshCw,
  },
];

const team = [
  {
    initials: "AP",
    name: "Aldair Pérez",
    role: "Estrategia & Procesos",
    focus: "Administración, operación y estructura.",
  },
  {
    initials: "MR",
    name: "Milagros Ríos",
    role: "Cultura & Personas",
    focus: "Psicología organizacional, cultura y gestión del cambio.",
  },
  {
    initials: "DP",
    name: "Damaris Pérez",
    role: "Comunicación & Growth",
    focus: "Comunicación estratégica, publicidad y marca.",
  },
];

const steps = [
  "Diagnóstico",
  "Mapa de solución",
  "Implementación",
  "Medición",
  "Optimización",
];
const faq = [
  [
    "¿Crisdal es una agencia de marketing?",
    "El marketing es una de nuestras capacidades. Crisdal integra estrategia, operación, comunicación, cultura y tecnología dependiendo del problema detectado.",
  ],
  [
    "¿Tengo que contratar todos los servicios?",
    "No. Primero identificamos el cuello de botella y priorizamos una solución proporcional al problema y al presupuesto.",
  ],
  [
    "¿También implementan o solamente hacen consultoría?",
    "El modelo combina diagnóstico, diseño, implementación, seguimiento y optimización según el alcance aprobado.",
  ],
  [
    "¿Trabajan con empresas pequeñas?",
    "El mejor cliente no depende únicamente del tamaño. Trabajamos mejor con empresas que ya reciben oportunidades y están dispuestas a medir e implementar mejoras.",
  ],
  [
    "¿Trabajan únicamente en Lima?",
    "Atendemos proyectos en Perú de forma presencial y remota según el alcance.",
  ],
];

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function track(name: string, detail: Record<string, string> = {}) {
  window.dataLayer?.push({ event: name, ...detail });
  window.dispatchEvent(
    new CustomEvent("crisdal:track", { detail: { event: name, ...detail } }),
  );
}

export default function BrochureLanding({
  content,
}: {
  content: BrochureContent;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactState, setContactState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const whatsappUrl = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, vi su brochure y quiero solicitar un diagnóstico.")}`;
  const diagnosticUrl = content.ctaUrl || "/";
  const mediaById = new Map(content.media.map((item) => [item.id, item]));

  async function submitContact(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactState("sending");
    const form = event.currentTarget;
    const response = await fetch("/api/brochure-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    if (response.ok) {
      form.reset();
      setContactState("sent");
      track("brochure_contact_submit");
    } else setContactState("error");
  }

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach(
          (entry) =>
            entry.isIntersecting &&
            entry.target.setAttribute("data-visible", "true"),
        ),
      { threshold: 0.12 },
    );
    nodes.forEach((node) => observer.observe(node));
    let sent50 = false;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (!sent50 && max > 0 && window.scrollY / max >= 0.5) {
        sent50 = true;
        track("brochure_scroll_50");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a
          className={styles.brand}
          href="#inicio"
          aria-label="Crisdal Agency, inicio"
        >
          <span className={styles.mark}>C</span>
          <span>
            CRISDAL<small>AGENCY</small>
          </span>
        </a>
        <nav
          className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`}
          aria-label="Navegación principal"
        >
          <a href="#problema" onClick={() => setMenuOpen(false)}>
            Qué resolvemos
          </a>
          <a href="#soluciones" onClick={() => setMenuOpen(false)}>
            Soluciones
          </a>
          <a href="#nexo" onClick={() => setMenuOpen(false)}>
            Método NEXO
          </a>
          <a href="#caso" onClick={() => setMenuOpen(false)}>
            Caso real
          </a>
          <a href="#equipo" onClick={() => setMenuOpen(false)}>
            Nosotros
          </a>
        </nav>
        <a
          className={styles.headerCta}
          href={diagnosticUrl}
          onClick={() => track("diagnostic_click", { placement: "header" })}
        >
          Solicitar diagnóstico
        </a>
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </header>

      <section id="inicio" className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.noise} aria-hidden="true" />
        <div className={styles.heroCopy} data-reveal>
          <p className={styles.eyebrow}>{content.kicker}</p>
          <h1>
            {content.title.toLowerCase() === "crecer con orden." ? (
              <>
                Crecer
                <br />
                <em>con orden.</em>
              </>
            ) : (
              content.title
            )}
          </h1>
          <p className={styles.promise}>{content.lead}</p>
          <p className={styles.support}>
            Trabajamos con empresas que ya están avanzando, pero sienten que su
            estrategia, su operación y su equipo necesitan conversar mejor entre
            sí.
          </p>
          <div className={styles.actions}>
            <a
              className={styles.primary}
              href={diagnosticUrl}
              onClick={() => track("diagnostic_click", { placement: "hero" })}
            >
              {content.ctaLabel} <ArrowRight />
            </a>
            <a className={styles.secondary} href="#ruta">
              Ver cómo trabajamos <ArrowDown />
            </a>
          </div>
          <p className={styles.microcopy}>
            Diagnóstico <span>→</span> implementación <span>→</span> medición{" "}
            <span>→</span> optimización
          </p>
        </div>
        <div
          className={styles.heroSystem}
          aria-label="Del caos al orden"
          data-reveal
        >
          <div className={styles.systemLabel}>
            <span>CAOS</span>
            <span>ORDEN</span>
          </div>
          <div className={styles.chaosNodes}>
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <i key={n} />
            ))}
          </div>
          <svg viewBox="0 0 560 420" aria-hidden="true">
            <path
              className={styles.routeLine}
              d="M42 332 C120 40 230 400 294 202 S430 86 518 80"
            />
            <circle cx="294" cy="202" r="58" />
            <path d="M270 202h50m-18-18 18 18-18 18" />
          </svg>
          <div className={styles.orderStack}>
            <i />
            <i />
            <i />
            <i />
          </div>
          <span className={styles.systemNote}>
            Conectamos lo que hoy trabaja separado.
          </span>
        </div>
      </section>

      {content.sections
        .filter((section) => section.visible)
        .map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            content={content}
            mediaById={mediaById}
            diagnosticUrl={diagnosticUrl}
            whatsappUrl={whatsappUrl}
            submitContact={submitContact}
            contactState={contactState}
          />
        ))}

      <footer className={styles.footer}>
        <div className={styles.brand}>
          <span className={styles.mark}>C</span>
          <span>
            CRISDAL<small>AGENCY</small>
          </span>
        </div>
        <p>Strategy · Growth · Systems · Culture</p>
        <strong>Crecer con orden.</strong>
      </footer>
      <div className={styles.mobileBar}>
        <a
          href={diagnosticUrl}
          onClick={() => track("diagnostic_click", { placement: "mobile_bar" })}
        >
          Cuéntanos
        </a>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          onClick={() => track("whatsapp_click", { placement: "mobile_bar" })}
        >
          <MessageCircle /> WhatsApp
        </a>
      </div>
    </main>
  );
}

type SectionRendererProps = {
  section: BrochureSection;
  content: BrochureContent;
  mediaById: Map<string, BrochureMedia>;
  diagnosticUrl: string;
  whatsappUrl: string;
  submitContact: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  contactState: "idle" | "sending" | "sent" | "error";
};

function SectionRenderer(props: SectionRendererProps) {
  const { section, mediaById } = props;
  const selectedMedia = section.mediaIds
    .map((id) => mediaById.get(id))
    .filter(Boolean) as BrochureMedia[];
  const hasInternalMedia = ["showcase", "custom", "cases"].includes(
    section.type,
  );

  return (
    <>
      <SectionContent {...props} />
      {selectedMedia.length && !hasInternalMedia ? (
        <section className={styles.sectionWidgets}>
          <MediaGrid
            media={selectedMedia}
            layout={section.mediaLayout}
            sizes={section.mediaSizes}
          />
        </section>
      ) : null}
    </>
  );
}

function SectionContent({
  section,
  content,
  mediaById,
  diagnosticUrl,
  whatsappUrl,
  submitContact,
  contactState,
}: SectionRendererProps) {
  const selectedMedia = section.mediaIds
    .map((id) => mediaById.get(id))
    .filter(Boolean) as BrochureMedia[];
  if (section.type === "problems")
    return (
      <section id="problema" className={styles.problemSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>Crecer no debería desordenarte</p>
          <h2>
            ¿Tu empresa vende más, pero cada vez resulta más difícil
            controlarla?
          </h2>
          <p>
            El problema no siempre es conseguir más clientes. Muchas veces el
            crecimiento empieza a revelar fallas que antes permanecían ocultas.
          </p>
        </div>
        <div className={styles.problemFlow}>
          {problems.map((item) => (
            <article key={item.number} data-reveal>
              <span>{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <strong>Resultado</strong>
              <p>{item.result}</p>
            </article>
          ))}
        </div>
      </section>
    );

  if (section.type === "manifesto")
    return (
      <section className={styles.manifesto}>
        <div data-reveal>
          <span>Más marketing</span>
          <span>no arregla</span>
          <strong>{content.storyTitle}</strong>
          <p>{content.story}</p>
        </div>
      </section>
    );

  if (section.type === "solutions")
    return (
      <section id="soluciones" className={styles.solutions}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>Un sistema integrado</p>
          <h2>Intervenimos donde se está frenando tu crecimiento.</h2>
          <p>
            No necesitas contratar todo. Primero detectamos qué está limitando
            el negocio y priorizamos la intervención.
          </p>
        </div>
        <div className={styles.solutionGrid}>
          {content.services.map((editable, index) => {
            const item = solutions[index] || {
              code: editable.title.toUpperCase(),
              question: `Â¿CÃ³mo puede ${editable.title} ayudar a tu empresa?`,
              text: editable.description,
              result: "De la idea â†’ a una mejora concreta.",
            };
            return (
              <article key={editable.id} data-reveal>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p className={styles.solutionCode}>
                  CRISDAL {editable.title.toUpperCase() || item.code}
                </p>
                <h3>{item.question}</h3>
                <p>{editable.description || item.text}</p>
                <strong>{item.result}</strong>
              </article>
            );
          })}
        </div>
        <p className={styles.integratedNote} data-reveal>
          <Workflow /> No coordinas cinco proveedores diferentes. Conectamos
          estrategia, crecimiento, sistemas y cultura bajo una misma ruta.
        </p>
      </section>
    );

  if (section.type === "nexo")
    return (
      <section id="nexo" className={styles.nexoSection}>
        <div className={styles.nexoIntro} data-reveal>
          <p className={styles.eyebrow}>Método propio</p>
          <h2>NEXO</h2>
          <p>
            Nuestro método para conectar el problema real con una solución que
            pueda sostenerse.
          </p>
        </div>
        <div className={styles.nexoRoute}>
          {nexo.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.letter} data-reveal>
                <div>
                  <span>{item.letter}</span>
                  <Icon />
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>
    );

  if (section.type === "cases")
    return (
      <section
        id="caso"
        className={styles.casesSection}
        onMouseEnter={() => track("case_view")}
      >
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>{section.eyebrow || "Casos reales"}</p>
          <h2>Historias construidas junto a nuestros clientes.</h2>
        </div>
        {content.cases.length ? (
          <div className={styles.casesList}>
            {content.cases.map((project, index) => (
              <CaseStudy
                key={project.id}
                project={project}
                index={index}
                mediaById={mediaById}
              />
            ))}
          </div>
        ) : (
          <p className={styles.emptyPublic}>
            Pronto compartiremos nuevos casos.
          </p>
        )}
      </section>
    );

  if (section.type === "showcase")
    return (
      <MediaShowcase
        section={section}
        media={selectedMedia.length ? selectedMedia : content.media}
      />
    );
  if (section.type === "custom")
    return (
      <section className={styles.customSection}>
        <div className={styles.sectionHead}>
          <p className={styles.eyebrow}>{section.eyebrow}</p>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </div>
        {selectedMedia.length ? (
          <MediaGrid
            media={selectedMedia}
            layout={section.mediaLayout}
            sizes={section.mediaSizes}
          />
        ) : null}
      </section>
    );
  if (section.type === "industries")
    return (
      <section className={styles.industries}>
        <p className={styles.eyebrow}>Proyectos / Industrias</p>
        <div>
          <span>Salud</span>
          <span>Educación</span>
          <span>Bienestar</span>
          <span>Servicios profesionales</span>
        </div>
      </section>
    );

  if (section.type === "team")
    return (
      <section id="equipo" className={styles.teamSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>Equipo interdisciplinario</p>
          <h2>Una firma construida desde disciplinas diferentes.</h2>
        </div>
        <div className={styles.teamGrid}>
          {team.map((person) => (
            <article key={person.name} data-reveal>
              <div>{person.initials}</div>
              <h3>{person.name}</h3>
              <strong>{person.role}</strong>
              <p>{person.focus}</p>
            </article>
          ))}
        </div>
        <p className={styles.teamFormula}>
          Empresa <span>+</span> personas <span>+</span> comunicación{" "}
          <span>+</span> tecnología.
        </p>
      </section>
    );

  if (section.type === "route")
    return (
      <section id="ruta" className={styles.routeSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>Cómo trabajamos</p>
          <h2>No empezamos diseñando. Empezamos entendiendo.</h2>
        </div>
        <ol className={styles.projectRoute}>
          {steps.map((step, index) => (
            <li key={step} data-reveal>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
        <p className={styles.routeNote}>
          <Check /> Cada etapa tiene un objetivo, responsable, entregable y
          criterio de cierre.
        </p>
      </section>
    );

  if (section.type === "faq")
    return (
      <section className={styles.faqSection}>
        <div data-reveal>
          <p className={styles.eyebrow}>Preguntas frecuentes</p>
          <h2>Antes de empezar.</h2>
          <p>La claridad también consiste en saber qué esperar.</p>
        </div>
        <div>
          {faq.map(([question, answer]) => (
            <details
              key={question}
              onToggle={(event) =>
                event.currentTarget.open && track("faq_open", { question })
              }
            >
              <summary>
                {question}
                <span>+</span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>
    );

  if (section.type === "contact")
    return (
      <section className={styles.finalCta} data-reveal>
        <div>
          <p className={styles.eyebrow}>Conversemos</p>
          <h2>
            Cuéntanos qué está pasando.
            <br />
            <em>Busquemos juntos por dónde empezar.</em>
          </h2>
          <p>
            Puedes escribirnos directamente por WhatsApp, completar la
            Radiografía de Marca o dejarnos tus datos aquí.
          </p>
          <div className={styles.contactButtons}>
            <a
              className={styles.whatsappPrimary}
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("whatsapp_click", { placement: "final" })}
            >
              <MessageCircle /> Escribir por WhatsApp
            </a>
            <a
              className={styles.secondaryLight}
              href={diagnosticUrl}
              onClick={() => track("diagnostic_click", { placement: "final" })}
            >
              {content.ctaLabel} <ArrowRight />
            </a>
          </div>
        </div>
        <form
          className={styles.quickForm}
          onSubmit={(event) => void submitContact(event)}
        >
          <p>¿Prefieres que te contactemos?</p>
          <label>
            Nombre
            <input
              name="name"
              autoComplete="name"
              required
              maxLength={80}
              placeholder="Tu nombre"
            />
          </label>
          <label>
            Empresa
            <input
              name="company"
              autoComplete="organization"
              required
              maxLength={100}
              placeholder="Nombre de tu empresa"
            />
          </label>
          <label>
            WhatsApp
            <input
              name="whatsapp"
              inputMode="tel"
              autoComplete="tel"
              required
              maxLength={20}
              placeholder="+51 987 654 321"
            />
          </label>
          <label>
            ¿En qué podemos ayudarte?
            <textarea
              name="message"
              required
              maxLength={600}
              rows={4}
              placeholder="Cuéntanos brevemente qué necesitas"
            />
          </label>
          <input
            className={styles.honeypot}
            name="website"
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
          />
          <button
            className={styles.primary}
            disabled={contactState === "sending"}
          >
            {contactState === "sending" ? "Enviando…" : "Enviar consulta"}{" "}
            <ArrowRight />
          </button>
          {contactState === "sent" ? (
            <span className={styles.formSuccess}>
              Gracias. Te escribiremos muy pronto.
            </span>
          ) : null}
          {contactState === "error" ? (
            <span className={styles.formError}>
              No pudimos enviarlo. Escríbenos por WhatsApp.
            </span>
          ) : null}
        </form>
      </section>
    );
  return null;
}

function CaseStudy({
  project,
  index,
  mediaById,
}: {
  project: BrochureCase;
  index: number;
  mediaById: Map<string, BrochureMedia>;
}) {
  const media = project.mediaIds
    .map((id) => mediaById.get(id))
    .filter(Boolean) as BrochureMedia[];
  return (
    <article className={styles.caseSection}>
      <div className={styles.caseCopy} data-reveal>
        <p className={styles.eyebrow}>{project.eyebrow}</p>
        <span className={styles.caseNumber}>
          CASO {String(index + 1).padStart(2, "0")}
        </span>
        <h2>{project.client}</h2>
        <h3>{project.title}</h3>
        <p>{project.summary}</p>
      </div>
      <div className={styles.caseEvidence} data-reveal>
        {media.length ? (
          <MediaGrid media={media} />
        ) : (
          <div
            className={styles.processMap}
            aria-label="Mapa conceptual del proceso"
          >
            <span>Escuchar</span>
            <span>Entender</span>
            <span>Ordenar</span>
            <span>Avanzar</span>
            <i />
            <i />
            <i />
          </div>
        )}
        <ol>
          {project.stages.map((stage, stageIndex) => (
            <li key={`${project.id}-${stageIndex}`}>
              <span>Etapa {String(stageIndex + 1).padStart(2, "0")}</span>
              <strong>{stage}</strong>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

function MediaShowcase({
  section,
  media,
}: {
  section: BrochureSection;
  media: BrochureMedia[];
}) {
  if (!media.length) return null;
  return (
    <section className={styles.showcaseSection}>
      <div className={styles.sectionHead}>
        <p className={styles.eyebrow}>{section.eyebrow}</p>
        <h2>{section.title}</h2>
        <p>{section.body}</p>
      </div>
      <MediaGrid
        media={media}
        layout={section.mediaLayout}
        sizes={section.mediaSizes}
      />
    </section>
  );
}

function MediaGrid({
  media,
  layout = "grid",
  sizes = {},
}: {
  media: BrochureMedia[];
  layout?: BrochureSection["mediaLayout"];
  sizes?: BrochureSection["mediaSizes"];
}) {
  return (
    <div
      className={`${styles.mediaShowcase} ${
        layout === "spotlight"
          ? styles.mediaSpotlight
          : layout === "stack"
            ? styles.mediaStack
            : ""
      }`}
    >
      {media.map((item, index) => {
        const configuredSize = sizes[item.id] || "medium";
        const size =
          layout === "stack"
            ? "full"
            : layout === "spotlight" && index === 0
              ? "wide"
              : configuredSize;
        return (
        <figure
          key={item.id}
          className={
            size === "small"
              ? styles.widgetSmall
              : size === "wide"
                ? styles.widgetWide
                : size === "full"
                  ? styles.widgetFull
                  : styles.widgetMedium
          }
        >
          {item.kind === "image" ? (
            <Image
              src={item.url}
              alt={item.title || "Proyecto de Crisdal"}
              fill
              unoptimized
              sizes="(max-width: 800px) 92vw, 42vw"
              style={{
                objectPosition: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
                transform: `scale(${item.zoom ?? 1})`,
                transformOrigin: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
              }}
            />
          ) : item.kind === "video" ? (
            <video
              src={item.url}
              controls
              playsInline
              preload="metadata"
              style={{
                objectPosition: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
                transform: `scale(${item.zoom ?? 1})`,
                transformOrigin: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
              }}
            />
          ) : (
            <a href={item.url} target="_blank" rel="noreferrer">
              <FileTextIcon />
              <span>Ver documento</span>
            </a>
          )}
          <figcaption>
            <strong>{item.title}</strong>
            {item.caption ? <span>{item.caption}</span> : null}
          </figcaption>
        </figure>
        );
      })}
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6" />
    </svg>
  );
}
