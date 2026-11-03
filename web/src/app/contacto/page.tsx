import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { CatalogFooter, CatalogHeader } from "@/components/CatalogChrome";
import { getSiteContent } from "@/lib/siteContent";
import styles from "../catalog.module.css";
import ContactForm from "./ContactForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Contacto", description: "Cuéntanos qué necesitas, para cuándo y cómo podemos comunicarnos contigo.", alternates: { canonical: "/contacto" } };
export default async function ContactPage() {
  const site = await getSiteContent();
  const whatsapp = `https://wa.me/${site.whatsappNumber}?text=${encodeURIComponent("Hola Crisdal, quiero conversar sobre un proyecto.")}`;
  return <main className={styles.page}><CatalogHeader whatsapp={site.whatsappNumber}/><section className={styles.indexHero}><span className={styles.eyebrow}>CONTACTO</span><h1>Cuéntanos tu proyecto y te proponemos un siguiente paso.</h1><p>Dinos qué necesitas, para cuándo y cómo podemos comunicarnos contigo. Te orientamos sobre el servicio más conveniente.</p></section><section className={styles.contactLayout}><div><span className={styles.eyebrow}>FORMULARIO CORTO</span><h2>Cuatro datos para empezar con contexto.</h2><p>No necesitas elegir un paquete antes de escribirnos.</p><a className={styles.secondaryDark} href={whatsapp} target="_blank" rel="noreferrer">Prefiero WhatsApp <ArrowRight/></a><div className={styles.contactVisual}><Image src="/brochure/team/equipo-crisdal-2026.webp" alt="Equipo Crisdal listo para conversar sobre un proyecto" fill unoptimized sizes="(max-width:900px) 100vw, 40vw"/></div></div><ContactForm/></section><CatalogFooter whatsapp={site.whatsappNumber}/></main>;
}
