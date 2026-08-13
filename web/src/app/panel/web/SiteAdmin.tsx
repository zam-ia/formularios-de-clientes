"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, ImageIcon, LoaderCircle, Monitor, Save, UploadCloud, X } from "lucide-react";
import { BROCHURE_BUCKET } from "@/lib/brochure";
import { defaultSiteContent, type SiteContent } from "@/lib/siteContent";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import styles from "./siteAdmin.module.css";

async function api<T>(url: string, init?: RequestInit) { const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "No pudimos completar la acción."); return data as T; }

export default function SiteAdmin() {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => { void api<SiteContent>("/api/admin/site").then(setContent).catch((error) => setNotice(error.message)).finally(() => setLoading(false)); }, []);
  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) { setContent((current) => ({ ...current, [key]: value })); }
  async function save() { setBusy(true); setNotice(""); try { setContent(await api<SiteContent>("/api/admin/site", { method: "PUT", body: JSON.stringify(content) })); setNotice("Web actualizada y publicada."); } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos publicar."); } finally { setBusy(false); } }
  async function upload(slot: "logoUrl" | "heroImage" | "aboutImage" | "finalImage", file?: File) {
    if (!file) return; setUploading(slot); setNotice("");
    try {
      const signed = await api<{ path: string; token: string; publicUrl: string }>("/api/admin/site/media", { method: "POST", body: JSON.stringify({ fileName: file.name, mimeType: file.type, sizeBytes: file.size }) });
      const { error } = await getSupabaseBrowser().storage.from(BROCHURE_BUCKET).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (error) throw error;
      update(slot, signed.publicUrl);
      setNotice("Imagen cargada. Pulsa “Guardar y publicar” para verla en la web.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "No pudimos cargar la imagen."); }
    finally { setUploading(""); }
  }
  if (loading) return <main className={styles.loading}><LoaderCircle /> Cargando editor…</main>;
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/panel"><ArrowLeft /> Volver al panel</Link><div><Monitor /><span>CRISDAL<small>EDITOR WEB</small></span></div><a href="/" target="_blank">Ver página <ExternalLink /></a></header>
    <section className={styles.content}>
      <div className={styles.title}><div><p>CONTENIDO INSTITUCIONAL</p><h1>Edita tu web sin tocar código.</h1><span>Cambia textos e imágenes principales. El diseño responsive y las animaciones se conservan automáticamente.</span></div><button onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle /> : <Save />} Guardar y publicar</button></div>
      {notice ? <div className={styles.notice}><Check /> {notice}<button onClick={() => setNotice("")}><X /></button></div> : null}
      <div className={styles.layout}><nav><a href="#identity">Identidad</a><a href="#hero">Portada</a><a href="#sectors">Rubros</a><a href="#services">Servicios</a><a href="#results">Resultados</a><a href="#about">Nosotros y cierre</a></nav><div className={styles.forms}>
        <EditorSection id="identity" title="Identidad y contacto" text="Logo principal y número que reciben los botones de WhatsApp."><div className={styles.grid}><label>WhatsApp <small>solo números, incluido 51</small><input value={content.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value.replace(/\D/g, ""))} /></label><ImageField label="Logo principal" guide="PNG transparente o fondo negro · 1080 × 1080 px" value={content.logoUrl} loading={uploading === "logoUrl"} upload={(file) => void upload("logoUrl", file)} /></div></EditorSection>
        <EditorSection id="hero" title="Portada principal" text="Es la primera impresión de la web. Mantén el título breve y directo."><div className={styles.grid}><label>Etiqueta<input value={content.heroKicker} onChange={(e) => update("heroKicker", e.target.value)} /></label><label className={styles.full}>Título<textarea rows={3} value={content.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} /></label><label className={styles.full}>Introducción<textarea rows={4} value={content.heroLead} onChange={(e) => update("heroLead", e.target.value)} /></label><ImageField label="Imagen o avatar de portada" guide="PNG transparente · recomendado 1200 × 1400 px" value={content.heroImage} loading={uploading === "heroImage"} upload={(file) => void upload("heroImage", file)} /><label className={styles.full}>Título “Por qué Crisdal”<textarea rows={2} value={content.whyTitle} onChange={(e) => update("whyTitle", e.target.value)} /></label></div></EditorSection>
        <EditorSection id="sectors" title="Rubros principales" text="Edita las promesas para salud, estética y educación."><div className={styles.grid}><label className={styles.full}>Título de sección<textarea rows={2} value={content.sectorsTitle} onChange={(e) => update("sectorsTitle", e.target.value)} /></label><label>Salud y estética<textarea rows={3} value={content.healthTitle} onChange={(e) => update("healthTitle", e.target.value)} /></label><label>Descripción<textarea rows={3} value={content.healthText} onChange={(e) => update("healthText", e.target.value)} /></label><label>Educación<textarea rows={3} value={content.educationTitle} onChange={(e) => update("educationTitle", e.target.value)} /></label><label>Descripción<textarea rows={3} value={content.educationText} onChange={(e) => update("educationText", e.target.value)} /></label></div></EditorSection>
        <EditorSection id="services" title="Servicios" text="Actualiza el nombre y la explicación de las seis soluciones."><div className={styles.grid}><label className={styles.full}>Título de sección<textarea rows={2} value={content.servicesTitle} onChange={(e) => update("servicesTitle", e.target.value)} /></label><label className={styles.full}>Introducción<textarea rows={2} value={content.servicesLead} onChange={(e) => update("servicesLead", e.target.value)} /></label>{content.services.map((service, index) => <div className={styles.service} key={service.id}><span>{String(index + 1).padStart(2, "0")}</span><input value={service.title} onChange={(e) => update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} /><textarea rows={2} value={service.text} onChange={(e) => update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item))} /></div>)}</div></EditorSection>
        <EditorSection id="results" title="Resultados y caso destacado" text="Publica únicamente datos que el cliente haya autorizado."><div className={styles.grid}><label className={styles.full}>Título de sección<textarea rows={2} value={content.resultsTitle} onChange={(e) => update("resultsTitle", e.target.value)} /></label><label className={styles.full}>Título del caso<textarea rows={2} value={content.caseTitle} onChange={(e) => update("caseTitle", e.target.value)} /></label><label className={styles.full}>Descripción<textarea rows={3} value={content.caseText} onChange={(e) => update("caseText", e.target.value)} /></label><label>Métrica destacada<input value={content.metricValue} onChange={(e) => update("metricValue", e.target.value)} /></label><label>Qué representa<input value={content.metricLabel} onChange={(e) => update("metricLabel", e.target.value)} /></label></div></EditorSection>
        <EditorSection id="about" title="Nosotros y llamado final" text="Edita el cierre de la página y sus imágenes."><div className={styles.grid}><label className={styles.full}>Título “Nosotros”<textarea rows={2} value={content.aboutTitle} onChange={(e) => update("aboutTitle", e.target.value)} /></label><label className={styles.full}>Texto<textarea rows={4} value={content.aboutText} onChange={(e) => update("aboutText", e.target.value)} /></label><ImageField label="Imagen de nosotros" guide="Horizontal o cuadrada · recomendado 1400 × 1000 px" value={content.aboutImage} loading={uploading === "aboutImage"} upload={(file) => void upload("aboutImage", file)} /><ImageField label="Avatar del cierre" guide="PNG transparente · recomendado 1000 × 1200 px" value={content.finalImage} loading={uploading === "finalImage"} upload={(file) => void upload("finalImage", file)} /><label className={styles.full}>Etiqueta final<input value={content.finalKicker} onChange={(e) => update("finalKicker", e.target.value)} /></label><label className={styles.full}>Título final<input value={content.finalTitle} onChange={(e) => update("finalTitle", e.target.value)} /></label></div></EditorSection>
      </div></div>
      <div className={styles.saveBar}><span>Los cambios no se publican hasta que presiones guardar.</span><button onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle /> : <Save />} Guardar y publicar</button></div>
    </section>
  </main>;
}

function EditorSection({ id, title, text, children }: { id: string; title: string; text: string; children: React.ReactNode }) { return <section id={id} className={styles.section}><header><h2>{title}</h2><p>{text}</p></header>{children}</section>; }
function ImageField({ label, guide, value, loading, upload }: { label: string; guide: string; value: string; loading: boolean; upload: (file?: File) => void }) { return <div className={styles.imageField}><div className={styles.imagePreview}>{value ? <Image src={value} alt="Vista previa" fill unoptimized sizes="260px" /> : <ImageIcon />}</div><div><strong>{label}</strong><span>{guide}</span><label>{loading ? <LoaderCircle /> : <UploadCloud />} {loading ? "Subiendo…" : "Cambiar imagen"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={loading} onChange={(e) => upload(e.target.files?.[0])} /></label></div></div>; }
