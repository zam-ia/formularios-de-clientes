import type { Metadata } from "next";
import { CatalogFooter, CatalogHeader } from "@/components/CatalogChrome";
import { getSiteContent } from "@/lib/siteContent";
import { getWebCatalog } from "@/lib/webCatalog";
import styles from "../catalog.module.css";
import PortfolioExplorer from "./PortfolioExplorer";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Portafolio", description: "Proyectos reales de fotografía, contenido, video y comunicación desarrollados por Crisdal Agency.", alternates: { canonical: "/portafolio" } };
export default async function PortfolioPage(){
  const [catalog,site]=await Promise.all([getWebCatalog(),getSiteContent()]);
  return <main className={styles.page}><CatalogHeader whatsapp={site.whatsappNumber}/><section className={styles.indexHero}><span className={styles.eyebrow}>PORTAFOLIO CRISDAL</span><h1>{catalog.portfolioTitle}</h1><p>{catalog.portfolioLead}</p></section><PortfolioExplorer projects={catalog.projects.filter((item)=>item.visible)} services={catalog.services.filter((item)=>item.visible)}/><CatalogFooter whatsapp={site.whatsappNumber}/></main>;
}
