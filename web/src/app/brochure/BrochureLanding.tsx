"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Camera,
  Menu,
  MessageCircle,
  Megaphone,
  Palette,
  Send,
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
    title: "Contenido sin ritmo",
    text: "Publicas cuando hay tiempo y luego tu marca desaparece por semanas.",
    result: "Tu audiencia no alcanza a recordarte.",
  },
  {
    number: "02",
    title: "Contenido sin dirección",
    text: "Las piezas pueden verse bonitas, pero no explican por qué elegirte ni qué hacer después.",
    result: "Hay alcance, pero pocas conversaciones.",
  },
  {
    number: "03",
    title: "Todo depende de ti",
    text: "Tú grabas, diseñas, publicas, respondes y además intentas atender el negocio.",
    result: "La comunicación se vuelve otra tarea pendiente.",
  },
];

const problemVisuals = [
  <div className={styles.inboxScene} key="inbox" aria-hidden="true"><i /><i /><i /><span>LEAD SIN RESPUESTA</span></div>,
  <div className={styles.dependencyScene} key="dependency" aria-hidden="true"><i /><b /><b /><b /><b /><b /><b /><b /><b /></div>,
  <div className={styles.performanceScene} key="performance" aria-hidden="true"><span>VENTAS ↑</span><i /><span>COMPLEJIDAD ↑</span><i /></div>,
];

const solutions = [
  {
    code: "VIDEO",
    question: "¿Tu negocio todavía no comunica en video?",
    text: "Grabamos y editamos piezas verticales pensadas para captar atención y explicar tu oferta.",
    result: "De fotos sueltas → a video que retiene.",
  },
  {
    code: "DESIGN",
    question: "¿Tus publicaciones se ven improvisadas?",
    text: "Creamos posts, flyers y piezas publicitarias con una identidad reconocible.",
    result: "De plantillas genéricas → a contenido con marca.",
  },
  {
    code: "SOCIAL",
    question: "¿No tienes tiempo de publicar ni responder?",
    text: "Organizamos el calendario, publicamos y gestionamos la primera respuesta según tu plan.",
    result: "De redes abandonadas → a presencia constante.",
  },
  {
    code: "ADS",
    question: "¿Quieres que más personas encuentren tu negocio?",
    text: "Gestionamos campañas en Meta Ads y reportamos qué pasó con la inversión.",
    result: "De publicar y esperar → a distribuir con intención.",
  },
];

const solutionVisuals = [
  ["Grabación", "Edición", "Publicación"],
  ["Diseño", "Copy", "Identidad"],
  ["Calendario", "Publicación", "Comunidad"],
  ["Campaña", "Segmentación", "Reporte"],
];
const solutionStoryImages = [
  "/brochure/portfolio/personal-training-social.webp",
  "/brochure/portfolio/change-brand-system.webp",
  "/brochure/portfolio/change-experience.webp",
  "/brochure/portfolio/personal-training-case.webp",
];

const steps = ["Brief", "Producción", "Publicación", "Reporte"];
const stepDetails = [
  "Objetivo, oferta y piezas del mes.",
  "Grabación, diseño, copy y revisión.",
  "Material listo o gestión según tu plan.",
  "Resultados, aprendizajes y siguiente acción.",
];
const faq = [
  [
    "¿Qué plan me conviene?",
    "Si recién vas a ordenar tu presencia, empieza con Esencial. Si ya vendes y necesitas constancia, Crece suele ser el mejor punto de partida. Podemos orientarte por WhatsApp.",
  ],
  [
    "¿La pauta de Meta Ads está incluida?",
    "La gestión está incluida en los planes que la indican. El presupuesto que Meta cobra por mostrar los anuncios se paga por separado.",
  ],
  [
    "¿Crisdal también publica el contenido?",
    "Sí, en los planes con manejo de redes. En Esencial entregamos el material listo para que puedas publicarlo.",
  ],
  [
    "¿Trabajan con empresas pequeñas?",
    "Sí. Los planes están pensados para negocios locales que necesitan empezar o crecer sin montar un equipo interno completo.",
  ],
  [
    "¿Trabajan solo en Huancayo?",
    "Producimos presencialmente en Huancayo y coordinamos proyectos remotos en otras ciudades según el alcance.",
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

function trackOnce(name: string, detail: Record<string, string> = {}) {
  const key = `crisdal_event_${name}`;
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, "1");
  track(name, detail);
}

export default function BrochureLanding({
  content,
  previewSectionId,
}: {
  content: BrochureContent;
  previewSectionId?: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerSolid, setHeaderSolid] = useState(false);
  const [contactState, setContactState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const whatsappUrl = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, vi su brochure y quiero saber qué plan me conviene.")}`;
  const diagnosticUrl = content.ctaUrl || "/";
  const mediaById = new Map(content.media.map((item) => [item.id, item]));
  const heroMedia = mediaById.get(content.heroMediaId);
  const visibleSections = content.sections.filter((section) => {
    if (!section.visible) return false;
    if (section.type === "testimonials")
      return content.testimonials.some((testimonial) => testimonial.visible);
    return true;
  });

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
    trackOnce("view_brochure");
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
      setHeaderSolid(window.scrollY > 96);
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
      <header className={`${styles.header} ${headerSolid ? styles.headerSolid : ""}`}>
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
            Qué hacemos
          </a>
          <a href="#planes" onClick={() => setMenuOpen(false)}>
            Planes
          </a>
          <a href="#ruta" onClick={() => setMenuOpen(false)}>
            Cómo trabajamos
          </a>
          <a href="#caso" onClick={() => setMenuOpen(false)}>
            Casos
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
          Quiero mi plan
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
          <h1>{content.title}</h1>
          <p className={styles.promise}>{content.lead}</p>
          <p className={styles.support}>
            Video, diseño, manejo de redes y campañas en un solo equipo local,
            con entregables claros y seguimiento mensual.
          </p>
          <div className={styles.actions}>
            <a
              className={styles.primary}
              href={diagnosticUrl}
              onClick={() => track("diagnostic_click", { placement: "hero" })}
            >
              {content.ctaLabel} <ArrowRight />
            </a>
            <a className={styles.secondary} href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => track("click_hero_whatsapp")}>
              Hablar por WhatsApp <MessageCircle />
            </a>
          </div>
          <p className={styles.microcopy}>
            Grabamos <span>→</span> Diseñamos <span>→</span> Publicamos{" "}
            <span>→</span> Tú vendes
          </p>
        </div>
        <div
          className={styles.heroSystem}
          aria-label="Muestra del trabajo creativo de Crisdal"
          data-reveal
        >
          <VisualMedia
            item={heroMedia}
            fallback="/brochure/story/hero-system.webp"
            alt="Equipo Crisdal conectando estrategia, sistemas y ejecución"
            className={styles.heroStoryImage}
            sizes="(max-width: 1050px) 92vw, 44vw"
            priority
          />
          <div className={styles.heroStoryShade} aria-hidden="true" />
          <div className={styles.systemLabel}>
            <span>IDEA</span>
            <span>CONTENIDO</span>
          </div>
          <div className={styles.heroProductionIcons} aria-hidden="true"><Camera /><Palette /><Megaphone /><Send /></div>
          <span className={styles.systemNote}>
            Producción real para negocios reales.
          </span>
        </div>
      </section>

      {visibleSections
        .map((section) => (
          <div
            key={section.id}
            data-brochure-widget={section.id}
            className={`${styles.brochureWidget} ${
              previewSectionId === section.id ? styles.brochureWidgetSelected : ""
            }`}
          >
            <SectionRenderer
              section={section}
              content={content}
              mediaById={mediaById}
              diagnosticUrl={diagnosticUrl}
              whatsappUrl={whatsappUrl}
              submitContact={submitContact}
              contactState={contactState}
            />
          </div>
        ))}

      <footer className={styles.footer}>
        <div className={styles.brand}>
          <span className={styles.mark}>C</span>
          <span>
            CRISDAL<small>AGENCY</small>
          </span>
        </div>
        <p>Video · Diseño · Redes · Publicidad</p>
        <strong>Crecer con orden.</strong>
        <span className={styles.nexoTeaser}>Próxima etapa · Si ya tienes contenido y necesitas ordenar estrategia, procesos y equipo, pregúntanos por Método NEXO.</span>
      </footer>
      <div className={styles.mobileBar}>
        <a
          href={diagnosticUrl}
          onClick={() => track("diagnostic_click", { placement: "mobile_bar" })}
        >
          Ver planes
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
  const hasInternalMedia = ["problems", "solutions", "method", "plans", "showcase", "custom", "cases", "testimonials"].includes(
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
          {problems.map((item, index) => (
            <article key={item.number} data-reveal>
              <span>{item.number}</span>
              {problemVisuals[index]}
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <strong>Resultado</strong>
              <p>{item.result}</p>
            </article>
          ))}
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
                <figure className={styles.solutionStory}>
                  <VisualMedia item={selectedMedia[index]} fallback={solutionStoryImages[index] || "/brochure/story/strategy.webp"} alt={`Visual de Crisdal ${editable.title}`} sizes="(max-width: 900px) 92vw, 45vw" />
                </figure>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p className={styles.solutionCode}>
                  CRISDAL {editable.title.toUpperCase() || item.code}
                </p>
                <h3>{item.question}</h3>
                <p>{editable.description || item.text}</p>
                <div className={styles.solutionDiagram} aria-hidden="true">
                  {(solutionVisuals[index] || ["Entrada", "Sistema", "Avance"]).map((label) => <span key={label}>{label}</span>)}
                </div>
                <strong>{item.result}</strong>
                <a href="#planes" onClick={() => track("solution_open", { solution: editable.title })}>Ver planes <ArrowRight /></a>
              </article>
            );
          })}
        </div>
        <p className={styles.integratedNote} data-reveal>
          <Check /> Video, diseño, redes y publicidad coordinados por un solo equipo.
        </p>
      </section>
    );

  if (section.type === "method")
    return (
      <section id="metodo" className={styles.magicSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>Método MÁGICA</p>
          <h2>Cómo creamos contenido que vende.</h2>
          <p>{content.story}</p>
        </div>
        <div className={styles.magicTrack} aria-label="Tres pilares del contenido Crisdal">
          {["Claridad", "Contexto", "Curiosidad"].map((pillar, index) => (
            <article key={pillar} data-reveal style={{ "--delay": `${index * 100}ms` } as React.CSSProperties}>
              <span>C</span>
              <div><strong>{pillar}</strong><p>{[
                "Tu audiencia entiende qué ofreces y por qué importa.",
                "La pieza conversa con una situación real del cliente.",
                "Abrimos una razón para mirar, recordar y actuar.",
              ][index]}</p></div>
            </article>
          ))}
        </div>
        <p className={styles.magicNote}>MÁGICA seguirá creciendo como metodología. En esta fase mostramos únicamente los tres pilares ya definidos.</p>
      </section>
    );

  if (section.type === "plans")
    return (
        <section id="planes" className={styles.plansSection} onMouseEnter={() => trackOnce("view_plans")}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>{section.eyebrow}</p>
          <h2>{section.title}</h2>
          <p>{section.body}</p>
        </div>
        <div className={styles.plansGrid}>
          {content.plans.filter((plan) => plan.visible).map((plan) => {
            const planUrl = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent(`Hola Crisdal, vi su brochure y me interesa el Plan ${plan.name}.`)}`;
            return <article key={plan.id} className={plan.id === "crece" ? styles.planFeatured : ""} data-reveal>
              {plan.badge ? <span className={styles.planBadge}>{plan.badge}</span> : null}
              <p>PLAN</p><h3>{plan.name}</h3><strong>{plan.price}</strong><small>{plan.description}</small>
              <ul>{plan.features.map((feature) => <li key={feature}><Check />{feature}</li>)}</ul>
              <a href={planUrl} target="_blank" rel="noreferrer" onClick={() => track(`click_whatsapp_plan_${plan.id}`)}>Quiero este plan <ArrowRight /></a>
            </article>;
          })}
        </div>
        <p className={styles.planConditions}>La pauta, licencias, dominio, hosting, producciones extraordinarias y costos de terceros se informan por separado cuando no estén incluidos.</p>
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
          <h2>{section.title || "Prueba visual antes que promesas."}</h2>
          {section.body ? <p>{section.body}</p> : null}
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

  if (section.type === "metrics")
    return (
      <section className={styles.metricsSection}>
        <div className={styles.metricAura} aria-hidden="true" />
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>{section.eyebrow || "Avance visible"}</p>
          <h2>{section.title || "Los números también cuentan la historia."}</h2>
          {section.body ? <p>{section.body}</p> : null}
        </div>
        <div
          className={`${styles.metricsGrid} ${
            section.mediaLayout === "spotlight"
              ? styles.metricsSpotlight
              : section.mediaLayout === "stack"
                ? styles.metricsStack
                : ""
          }`}
        >
          {content.metrics
            .filter((metric) => metric.visible)
            .map((metric, index) => (
              <article key={metric.id} data-reveal>
                <span className={styles.metricIndex}>0{index + 1}</span>
                <strong className={styles.animatedNumber}>
              <CountedNumber value={metric.value} prefix={metric.prefix} suffix={metric.suffix} />
                </strong>
                <h3>{metric.label}</h3>
                <p>{metric.description}</p>
                <i style={{ animationDelay: `${index * 0.35}s` }} />
              </article>
            ))}
        </div>
      </section>
    );

  if (section.type === "testimonials")
    return content.testimonials.some((testimonial) => testimonial.visible) ? (
      <section className={styles.testimonialsSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>
            {section.eyebrow || "Experiencias compartidas"}
          </p>
          <h2>
            {section.title ||
              "La transformación, contada por sus protagonistas."}
          </h2>
          {section.body ? <p>{section.body}</p> : null}
        </div>
        <div
          className={`${styles.testimonialsGrid} ${
            section.mediaLayout === "spotlight"
              ? styles.testimonialsSpotlight
              : section.mediaLayout === "stack"
                ? styles.testimonialsStack
                : ""
          }`}
        >
          {content.testimonials
            .filter((testimonial) => testimonial.visible)
            .map((testimonial) => {
              const testimonialMedia = testimonial.mediaId ? mediaById.get(testimonial.mediaId) : undefined;
              return <article key={testimonial.id} data-reveal>
                {testimonialMedia ? <TestimonialMedia item={testimonialMedia} name={testimonial.name} /> : null}
                <div className={styles.testimonialCopy}>
                  <p className={styles.testimonialCompany}>{testimonial.company}</p>
                  <blockquote>“{testimonial.quote}”</blockquote>
                  {testimonial.before || testimonial.after ? <dl>
                    {testimonial.before ? <div><dt>Antes</dt><dd>{testimonial.before}</dd></div> : null}
                    {testimonial.after ? <div><dt>Después</dt><dd>{testimonial.after}</dd></div> : null}
                  </dl> : null}
                <footer>
                  <span>{testimonial.name.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{testimonial.name}</strong>
                    <small>
                      {[testimonial.role, testimonial.company]
                        .filter(Boolean)
                        .join(" · ")}
                    </small>
                  </div>
                </footer>
                </div>
              </article>;
            })}
        </div>
      </section>
    ) : null;

  if (section.type === "showcase")
    return (
      <MediaShowcase
        section={section}
        media={selectedMedia.length ? selectedMedia : content.media.filter((item) => item.path.startsWith("static/portfolio/"))}
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
          <h2>Un equipo real detrás de cada entrega.</h2>
        </div>
        <div className={styles.teamGrid}>
          {content.teamMembers.filter((person) => person.visible).map((person, index) => (
            <article key={person.name} data-reveal>
              <div className={styles.teamPortrait}>
                <Image
                  src={person.imageUrl}
                  alt={person.name}
                  fill
                  unoptimized
                  sizes="(max-width: 680px) 92vw, (max-width: 1050px) 70vw, 30vw"
                  style={{ objectPosition: `${person.positionX}% ${person.positionY}%` }}
                />
                <span>CRISDAL / {String(index + 1).padStart(2, "0")}</span>
              </div>
              <div className={styles.teamCardCopy}>
                <h3>{person.name}</h3>
                <strong>{person.role}</strong>
                <p>{person.focus}</p>
              </div>
            </article>
          ))}
        </div>
        <div className={styles.integrationMap} aria-label="Video, diseño, redes y publicidad conectados por Crisdal">
          <span>Video</span><span>Diseño</span><strong>CRISDAL</strong><span>Redes</span><span>Publicidad</span>
        </div>
      </section>
    );

  if (section.type === "route")
    return (
      <section id="ruta" className={styles.routeSection}>
        <div className={styles.sectionHead} data-reveal>
          <p className={styles.eyebrow}>Cómo trabajamos</p>
          <h2>De la idea a una entrega que puedes usar.</h2>
          <p>Un ciclo corto y visible para que siempre sepas qué sigue y qué recibirás.</p>
        </div>
        <ol className={styles.projectRoute}>
          {steps.map((step, index) => (
            <li key={step} data-reveal>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong><small>{stepDetails[index]}</small>
            </li>
          ))}
        </ol>
        <p className={styles.routeNote}>
          <Check /> Cada etapa deja un entregable claro, sin procesos ocultos.
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
      <section id="contacto" className={styles.finalCta} data-reveal>
        <div>
          <p className={styles.eyebrow}>Conversemos</p>
          <h2>
            Hagamos que tu negocio se vea
            <br />
            <em>(y venda) como se merece.</em>
          </h2>
          <p>
            Elige un plan o cuéntanos qué necesitas. Te responderemos con una recomendación clara y sin tecnicismos.
          </p>
          <div className={styles.contactButtons}>
            <a
              className={styles.primary}
              href="#planes"
              onClick={() => track("diagnostic_click", { placement: "final" })}
            >
              Quiero mi plan <ArrowRight />
            </a>
            <a
              className={styles.secondaryLight}
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => track("whatsapp_click", { placement: "final" })}
            >
              <MessageCircle /> Hablar por WhatsApp
            </a>
          </div>
        </div>
        <form
          id="formulario-diagnostico"
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
            ¿Qué plan te interesa?
            <select name="message" required defaultValue="">
              <option value="" disabled>Selecciona una opción</option>
              <option>Plan Esencial</option>
              <option>Plan Crece</option>
              <option>Plan Impulso</option>
              <option>Plan Elite</option>
              <option>Necesito orientación</option>
            </select>
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

function TestimonialMedia({ item, name }: { item: BrochureMedia; name: string }) {
  return <div className={styles.testimonialMedia}>
    {item.kind === "video" ? (
      <video src={item.url} controls playsInline preload="metadata" />
    ) : item.kind === "image" ? (
      <Image src={item.url} alt={`Testimonio de ${name}`} fill unoptimized sizes="(max-width: 800px) 92vw, 40vw" />
    ) : null}
  </div>;
}

function CountedNumber({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(value);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setDisplayValue(0);
    let frame = 0;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const start = performance.now();
      const duration = 800;
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        setDisplayValue(Math.round(value * (1 - Math.pow(1 - progress, 3))));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, { threshold: 0.6 });
    observer.observe(node);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [value]);
  return <span ref={ref} aria-label={`${prefix}${value.toLocaleString("es-PE")}${suffix}`}>
    <span aria-hidden="true">{prefix}{displayValue.toLocaleString("es-PE")}{suffix}</span>
  </span>;
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
  const editorialSizes = Object.fromEntries(
    media.map((item, index) => [
      item.id,
      index % 6 === 0 || index % 6 === 5
        ? "wide"
        : index % 6 === 1 || index % 6 === 4
          ? "small"
          : "medium",
    ]),
  ) as BrochureSection["mediaSizes"];
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
        sizes={{ ...editorialSizes, ...section.mediaSizes }}
      />
    </section>
  );
}

function VisualMedia({
  item,
  fallback,
  alt,
  className,
  sizes,
  priority = false,
}: {
  item?: BrochureMedia;
  fallback: string;
  alt: string;
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  if (item?.kind === "video") {
    return (
      <video
        className={className}
        src={item.url}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label={alt}
        style={{
          objectPosition: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
          transform: `scale(${item.zoom ?? 1})`,
          transformOrigin: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
        }}
      />
    );
  }
  return (
    <Image
      className={className}
      src={item?.kind === "image" ? item.url : fallback}
      alt={alt}
      fill
      unoptimized={Boolean(item)}
      sizes={sizes}
      priority={priority}
      style={item ? {
        objectPosition: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
        transform: `scale(${item.zoom ?? 1})`,
        transformOrigin: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
      } : undefined}
    />
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
