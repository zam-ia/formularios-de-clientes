import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LayoutDashboard, Menu } from "lucide-react";
import type { ReactNode } from "react";
import type { WebProject, WebService } from "@/lib/webCatalog";
import styles from "@/app/catalog.module.css";

export function CatalogHeader({ whatsapp }: { whatsapp: string }) {
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola Crisdal, quiero una recomendación para mi proyecto.")}`;
  return <header className={styles.header}>
    <Link className={styles.logo} href="/" aria-label="Crisdal Agency, inicio">
      <Image src="/brand/crisdal-agency-logo.png" alt="Crisdal Agency" width={70} height={70} priority />
    </Link>
    <nav aria-label="Navegación principal">
      <Link href="/servicios">Servicios</Link><Link href="/portafolio">Portafolio</Link>
      <Link href="/metodo">Método</Link><Link href="/nosotros">Nosotros</Link><Link href="/contacto">Contacto</Link>
    </nav>
    <div className={styles.headerActions}>
      <Link className={styles.panelLink} href="/panel/dashboard"><LayoutDashboard /> <span>Panel</span></Link>
      <a className={styles.primaryButton} href={href} target="_blank" rel="noreferrer">Cotizar <ArrowRight /></a>
    </div>
    <details className={styles.mobileMenu}>
      <summary aria-label="Abrir menú"><Menu /></summary>
      <div><Link href="/servicios">Servicios</Link><Link href="/portafolio">Portafolio</Link><Link href="/metodo">Método</Link><Link href="/nosotros">Nosotros</Link><Link href="/contacto">Contacto</Link><a href={href}>Cotizar por WhatsApp</a></div>
    </details>
  </header>;
}

export function CatalogFooter({ whatsapp }: { whatsapp: string }) {
  return <footer className={styles.footer}>
    <div><Image src="/brand/crisdal-agency-logo.png" alt="Crisdal Agency" width={84} height={84} /><p>Producción audiovisual y marketing comercial con ejecución cercana desde Huancayo.</p></div>
    <div><strong>Explora</strong><Link href="/servicios">Servicios</Link><Link href="/portafolio">Portafolio</Link><Link href="/brochure">Brochure</Link></div>
    <div><strong>Conversemos</strong><a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp</a><Link href="/contacto">Formulario</Link><Link href="/panel">Panel privado</Link></div>
  </footer>;
}

export function Breadcrumb({ children }: { children: ReactNode }) {
  return <nav className={styles.breadcrumb} aria-label="Migas de pan"><Link href="/">Inicio</Link><span>/</span>{children}</nav>;
}

export function MediaVisual({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const video = /\.(mp4|webm)(\?|$)/i.test(src);
  if (!src) return <div className={`${styles.mediaPending} ${className}`}><span>Material visual pendiente</span><small>Se añadirá desde el panel con material auténtico de Crisdal.</small></div>;
  return <div className={`${styles.mediaVisual} ${className}`}>
    {video ? <video src={src} controls muted playsInline preload="metadata" aria-label={alt} /> : <Image src={src} alt={alt} fill unoptimized sizes="(max-width: 760px) 100vw, 50vw" />}
  </div>;
}

export function ServiceCard({ service, index }: { service: WebService; index: number }) {
  return <Link className={styles.serviceCard} href={`/servicios/${service.slug}`}>
    <MediaVisual src={service.cardMedia || service.heroMedia} alt={service.cardAlt || service.heroAlt || service.title} />
    <div><span>{String(index + 1).padStart(2, "0")} · {service.eyebrow}</span><h2>{service.title}</h2><p>{service.sub}</p><strong>Explorar servicio <ArrowRight /></strong></div>
  </Link>;
}

export function ProjectCard({ project }: { project: WebProject }) {
  return <Link className={styles.projectCard} href={`/casos/${project.slug}`}>
    <MediaVisual src={project.heroMedia} alt={project.heroAlt || project.title} />
    <div><span>{project.industry || "Proyecto Crisdal"}</span><h2>{project.title}</h2><p>{project.summary}</p><strong>Ver proyecto <ArrowRight /></strong></div>
  </Link>;
}
