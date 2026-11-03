"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/CatalogChrome";
import type { WebProject, WebService } from "@/lib/webCatalog";
import styles from "../catalog.module.css";

export default function PortfolioExplorer({ projects, services }: { projects: WebProject[]; services: WebService[] }) {
  const [service, setService] = useState("all");
  const [industry, setIndustry] = useState("all");
  const industries = useMemo(() => Array.from(new Set(projects.map((item) => item.industry).filter(Boolean))).sort(), [projects]);
  const visible = projects.filter((project) => (service === "all" || project.serviceIds.includes(service)) && (industry === "all" || project.industry === industry));
  return <>
    <div className={styles.filters} aria-label="Filtros de portafolio">
      <button data-active={service === "all"} onClick={() => setService("all")}>Todos los servicios</button>
      {services.map((item) => <button key={item.id} data-active={service === item.id} onClick={() => setService(item.id)}>{item.title}</button>)}
    </div>
    {industries.length > 1 ? <div className={styles.filters} aria-label="Filtros por industria">
      <button data-active={industry === "all"} onClick={() => setIndustry("all")}>Todas las industrias</button>
      {industries.map((item) => <button key={item} data-active={industry === item} onClick={() => setIndustry(item)}>{item}</button>)}
    </div> : null}
    <section className={styles.portfolioGrid} aria-live="polite">{visible.length ? visible.map((project) => <ProjectCard key={project.id} project={project} />) : <div className={styles.emptyPortfolio}><strong>No hay proyectos publicados con estos filtros.</strong><p>Prueba otra categoría. Solo mostramos trabajo auténtico autorizado.</p></div>}</section>
  </>;
}
