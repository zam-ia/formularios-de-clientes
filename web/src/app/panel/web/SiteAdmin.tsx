"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  ExternalLink,
  ImageIcon,
  LoaderCircle,
  Monitor,
  Plus,
  Save,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { BROCHURE_BUCKET } from "@/lib/brochure";
import {
  defaultSiteContent,
  type SiteContent,
  type SiteTestimonial,
} from "@/lib/siteContent";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import styles from "./siteAdmin.module.css";

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "No pudimos completar la acción.");
  return data as T;
}

type MediaSlot =
  | "logoUrl"
  | "heroMedia"
  | "heroPoster"
  | "caseImage"
  | "casePoster"
  | "aboutImage"
  | "finalMedia"
  | "finalPoster";

type ServiceSize = SiteContent["services"][number]["size"];

export default function SiteAdmin() {
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    void api<SiteContent>("/api/admin/site")
      .then(setContent)
      .catch((error) => setNotice(error.message))
      .finally(() => setLoading(false));
  }, []);

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    setBusy(true);
    setNotice("");
    try {
      setContent(
        await api<SiteContent>("/api/admin/site", {
          method: "PUT",
          body: JSON.stringify(content),
        }),
      );
      setNotice("Web actualizada y publicada.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos publicar.");
    } finally {
      setBusy(false);
    }
  }

  async function upload(slot: MediaSlot, file?: File) {
    if (!file) return;
    setUploading(slot);
    setNotice("");
    try {
      const signed = await api<{ path: string; token: string; publicUrl: string }>(
        "/api/admin/site/media",
        {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        },
      );
      const { error } = await getSupabaseBrowser()
        .storage.from(BROCHURE_BUCKET)
        .uploadToSignedUrl(signed.path, signed.token, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
      if (error) throw error;
      update(slot, signed.publicUrl);
      setNotice("Recurso cargado. Pulsa “Guardar y publicar” para verlo en la web.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos cargar el recurso.");
    } finally {
      setUploading("");
    }
  }

  async function uploadServiceMedia(index: number, file?: File) {
    if (!file) return;
    const key = `service-${index}`;
    setUploading(key);
    setNotice("");
    try {
      const signed = await api<{ path: string; token: string; publicUrl: string }>("/api/admin/site/media", {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, sizeBytes: file.size }),
      });
      const { error } = await getSupabaseBrowser().storage.from(BROCHURE_BUCKET).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type, cacheControl: "31536000" });
      if (error) throw error;
      update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, mediaUrl: signed.publicUrl, mediaKind: file.type.startsWith("video/") ? "video" : "image" } : item));
      setNotice("Recurso cargado. Pulsa “Guardar y publicar” para aplicarlo.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No pudimos cargar el recurso.");
    } finally {
      setUploading("");
    }
  }

  function updateTestimonial(id: string, patch: Partial<SiteTestimonial>) {
    update(
      "testimonials",
      content.testimonials.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addTestimonial() {
    update("testimonials", [
      ...content.testimonials,
      {
        id: crypto.randomUUID(),
        quote: "Escribe aquí un testimonio real y autorizado por el cliente.",
        name: "Nombre del cliente",
        role: "Cargo",
        company: "Empresa",
        visible: true,
      },
    ]);
  }

  if (loading)
    return (
      <main className={styles.loading}><LoaderCircle /> Cargando editor…</main>
    );

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/panel"><ArrowLeft /> Volver al panel</Link>
        <div><Monitor /><span>CRISDAL<small>EDITOR WEB</small></span></div>
        <a href="/" target="_blank">Ver página <ExternalLink /></a>
      </header>
      <section className={styles.content}>
        <div className={styles.title}>
          <div>
            <p>CONTENIDO, IMÁGENES Y VIDEOS</p>
            <h1>Controla la web sin tocar código.</h1>
            <span>Cambia textos y recursos. El sistema conserva automáticamente el responsive, la accesibilidad y el motion.</span>
          </div>
          <button onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle /> : <Save />} Guardar y publicar</button>
        </div>
        {notice ? <div className={styles.notice}><Check /> {notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso"><X /></button></div> : null}
        <div className={styles.layout}>
          <nav>
            <a href="#identity">Identidad</a><a href="#hero">Portada</a><a href="#stats">Cifras</a><a href="#case">Caso</a><a href="#services">Servicios</a><a href="#sectors">Rubros</a><a href="#testimonials">Testimonios</a><a href="#about">Nosotros</a><a href="#final">Cierre</a>
          </nav>
          <div className={styles.forms}>
            <EditorSection id="identity" title="Identidad y contacto" text="Logo principal y número que reciben los botones de WhatsApp.">
              <div className={styles.grid}>
                <label>WhatsApp <small>Solo números, incluido 51</small><input value={content.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value.replace(/\D/g, ""))} /></label>
                <MediaField label="Logo principal" guide="PNG transparente · recomendado 1080 × 1080 px" value={content.logoUrl} kind="image" loading={uploading === "logoUrl"} upload={(file) => void upload("logoUrl", file)} />
              </div>
            </EditorSection>

            <EditorSection id="hero" title="Portada principal" text="La primera impresión. Puedes usar una imagen ligera o un video MP4/WEBM con póster de respaldo.">
              <div className={styles.grid}>
                <label>Etiqueta<input value={content.heroKicker} onChange={(e) => update("heroKicker", e.target.value)} /></label>
                <label>Tipo de recurso<select value={content.heroMediaKind} onChange={(e) => update("heroMediaKind", e.target.value as "image" | "video")}><option value="image">Imagen</option><option value="video">Video</option></select></label>
                <label className={styles.full}>Título<textarea rows={3} value={content.heroTitle} onChange={(e) => update("heroTitle", e.target.value)} /></label>
                <label className={styles.full}>Introducción<textarea rows={4} value={content.heroLead} onChange={(e) => update("heroLead", e.target.value)} /></label>
                <MediaField label="Recurso principal" guide="Imagen 1600 × 1800 px o video MP4/WEBM comprimido · máximo 50 MB" value={content.heroMedia} kind={content.heroMediaKind} loading={uploading === "heroMedia"} upload={(file) => void upload("heroMedia", file)} allowVideo />
                <MediaField label="Póster y versión móvil" guide="WebP/AVIF recomendado 1200 × 1400 px. Se usa si el video falla o se reduce motion." value={content.heroPoster} kind="image" loading={uploading === "heroPoster"} upload={(file) => void upload("heroPoster", file)} />
              </div>
            </EditorSection>

            <EditorSection id="stats" title="Cifras animadas" text="Cuatro datos breves que aparecen con contador al entrar en pantalla. Usa solo cifras reales o conceptos verificables.">
              <div className={styles.grid}>
                {content.stats.map((stat, index) => <div className={styles.service} key={stat.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div className={styles.grid}>
                    <label>Antes <small>Ej. + o S/</small><input value={stat.prefix} maxLength={8} onChange={(e) => update("stats", content.stats.map((item, itemIndex) => itemIndex === index ? { ...item, prefix: e.target.value } : item))} /></label>
                    <label>Número entero<input inputMode="numeric" value={stat.value} onChange={(e) => update("stats", content.stats.map((item, itemIndex) => itemIndex === index ? { ...item, value: e.target.value.replace(/\D/g, "").slice(0, 6) } : item))} /></label>
                    <label>Después <small>Ej. %, ° o K</small><input value={stat.suffix} maxLength={12} onChange={(e) => update("stats", content.stats.map((item, itemIndex) => itemIndex === index ? { ...item, suffix: e.target.value } : item))} /></label>
                    <label>Descripción<input value={stat.label} onChange={(e) => update("stats", content.stats.map((item, itemIndex) => itemIndex === index ? { ...item, label: e.target.value } : item))} /></label>
                  </div>
                </div>)}
              </div>
            </EditorSection>

            <EditorSection id="case" title="Caso destacado" text="Muestra problema → solución → ejecución → resultado. Deja la métrica vacía si no está autorizada.">
              <div className={styles.grid}>
                <label>Categoría<input value={content.caseCategory} onChange={(e) => update("caseCategory", e.target.value)} /></label>
                <label>Tipo de recurso<select value={content.caseMediaKind} onChange={(e) => update("caseMediaKind", e.target.value as "image" | "video")}><option value="image">Imagen</option><option value="video">Video</option></select></label>
                <label className={styles.full}>Título<textarea rows={2} value={content.caseTitle} onChange={(e) => update("caseTitle", e.target.value)} /></label>
                <label className={styles.full}>Problema<textarea rows={3} value={content.caseChallenge} onChange={(e) => update("caseChallenge", e.target.value)} /></label>
                <label className={styles.full}>Solución<textarea rows={3} value={content.caseSolution} onChange={(e) => update("caseSolution", e.target.value)} /></label>
                <label className={styles.full}>Ejecución<textarea rows={3} value={content.caseExecution} onChange={(e) => update("caseExecution", e.target.value)} /></label>
                <label>Métrica autorizada <small>Puede quedar vacía</small><input value={content.metricValue} onChange={(e) => update("metricValue", e.target.value)} /></label>
                <label>Qué representa <small>Puede quedar vacío</small><input value={content.metricLabel} onChange={(e) => update("metricLabel", e.target.value)} /></label>
                <MediaField label="Imagen o video del caso" guide="Horizontal recomendado 1600 × 1100 px · video MP4/WEBM hasta 50 MB" value={content.caseImage} kind={content.caseMediaKind} loading={uploading === "caseImage"} upload={(file) => void upload("caseImage", file)} allowVideo />
                <MediaField label="Portada del video del caso" guide="Imagen horizontal recomendada 1600 × 1100 px · se muestra antes de reproducir y en movimiento reducido" value={content.casePoster} kind="image" loading={uploading === "casePoster"} upload={(file) => void upload("casePoster", file)} />
              </div>
            </EditorSection>

            <EditorSection id="services" title="Servicios" text="Seis pilares claros. Mantén cada explicación en una o dos líneas.">
              <div className={styles.grid}>
                <label className={styles.full}>Título de sección<textarea rows={2} value={content.servicesTitle} onChange={(e) => update("servicesTitle", e.target.value)} /></label>
                <label className={styles.full}>Introducción<textarea rows={2} value={content.servicesLead} onChange={(e) => update("servicesLead", e.target.value)} /></label>
                {content.services.map((service, index) => <div className={styles.service} key={service.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <label>Título<input value={service.title} onChange={(e) => update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} /></label>
                  <label>Descripción<textarea rows={2} value={service.text} onChange={(e) => update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, text: e.target.value } : item))} /></label>
                  <label>Tamaño<select value={service.size} onChange={(e) => update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, size: e.target.value as ServiceSize } : item))}><option value="compact">Compacta</option><option value="regular">Mediana</option><option value="wide">Ancha</option></select></label>
                  <div className={styles.serviceMediaControl}>
                    {service.mediaUrl ? service.mediaKind === "video" ? <video src={service.mediaUrl} muted controls /> : <Image src={service.mediaUrl} alt="" width={120} height={75} unoptimized /> : <ImageIcon />}
                    <label>{uploading === `service-${index}` ? <LoaderCircle /> : <UploadCloud />} {service.mediaUrl ? "Cambiar imagen/video" : "Añadir imagen/video"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" disabled={uploading === `service-${index}`} onChange={(event) => void uploadServiceMedia(index, event.target.files?.[0])} /></label>
                    {service.mediaUrl ? <button type="button" onClick={() => update("services", content.services.map((item, itemIndex) => itemIndex === index ? { ...item, mediaUrl: "" } : item))}><Trash2 /> Quitar</button> : null}
                  </div>
                </div>)}
              </div>
            </EditorSection>

            <EditorSection id="sectors" title="Rubros y diferencial" text="Edita la especialización y el argumento que distingue a Crisdal.">
              <div className={styles.grid}>
                <label className={styles.full}>Título “Por qué Crisdal”<textarea rows={2} value={content.whyTitle} onChange={(e) => update("whyTitle", e.target.value)} /></label>
                <label className={styles.full}>Título de rubros<textarea rows={2} value={content.sectorsTitle} onChange={(e) => update("sectorsTitle", e.target.value)} /></label>
                <label>Primer rubro<input value={content.healthTitle} onChange={(e) => update("healthTitle", e.target.value)} /></label>
                <label>Descripción<textarea rows={3} value={content.healthText} onChange={(e) => update("healthText", e.target.value)} /></label>
                <label>Segundo rubro<input value={content.educationTitle} onChange={(e) => update("educationTitle", e.target.value)} /></label>
                <label>Descripción<textarea rows={3} value={content.educationText} onChange={(e) => update("educationText", e.target.value)} /></label>
              </div>
            </EditorSection>

            <EditorSection id="testimonials" title="Testimonios" text="La sección solo aparece si existe al menos un testimonio visible. Publica únicamente testimonios reales y autorizados.">
              <button className={styles.addButton} type="button" onClick={addTestimonial}><Plus /> Añadir testimonio</button>
              <div className={styles.testimonialEditor}>
                {content.testimonials.map((item) => <article key={item.id}>
                  <div><strong>{item.name}</strong><label className={styles.switch}><input type="checkbox" checked={item.visible} onChange={(e) => updateTestimonial(item.id, { visible: e.target.checked })} /> Visible</label><button type="button" onClick={() => update("testimonials", content.testimonials.filter((entry) => entry.id !== item.id))} aria-label="Eliminar testimonio"><Trash2 /></button></div>
                  <label>Testimonio<textarea rows={4} value={item.quote} onChange={(e) => updateTestimonial(item.id, { quote: e.target.value })} /></label>
                  <div className={styles.grid}><label>Nombre<input value={item.name} onChange={(e) => updateTestimonial(item.id, { name: e.target.value })} /></label><label>Cargo<input value={item.role} onChange={(e) => updateTestimonial(item.id, { role: e.target.value })} /></label><label>Empresa<input value={item.company} onChange={(e) => updateTestimonial(item.id, { company: e.target.value })} /></label></div>
                </article>)}
                {!content.testimonials.length ? <p className={styles.empty}>Aún no hay testimonios. La web no mostrará testimonios inventados.</p> : null}
              </div>
            </EditorSection>

            <EditorSection id="about" title="Nosotros" text="Presentación del equipo y fotografía institucional.">
              <div className={styles.grid}>
                <label className={styles.full}>Título<textarea rows={2} value={content.aboutTitle} onChange={(e) => update("aboutTitle", e.target.value)} /></label>
                <label className={styles.full}>Texto<textarea rows={4} value={content.aboutText} onChange={(e) => update("aboutText", e.target.value)} /></label>
                <MediaField label="Fotografía del equipo" guide="Horizontal o cuadrada · recomendado 1600 × 1200 px" value={content.aboutImage} kind="image" loading={uploading === "aboutImage"} upload={(file) => void upload("aboutImage", file)} />
              </div>
            </EditorSection>

            <EditorSection id="final" title="Cierre y formulario" text="Recurso visual final y mensaje que acompaña el formulario corto.">
              <div className={styles.grid}>
                <label>Etiqueta final<input value={content.finalKicker} onChange={(e) => update("finalKicker", e.target.value)} /></label>
                <label>Tipo de recurso<select value={content.finalMediaKind} onChange={(e) => update("finalMediaKind", e.target.value as "image" | "video")}><option value="image">Imagen</option><option value="video">Video</option></select></label>
                <label className={styles.full}>Título final<textarea rows={2} value={content.finalTitle} onChange={(e) => update("finalTitle", e.target.value)} /></label>
                <MediaField label="Imagen o video del cierre" guide="Vertical recomendado 1200 × 1500 px · video MP4/WEBM hasta 50 MB" value={content.finalMedia} kind={content.finalMediaKind} loading={uploading === "finalMedia"} upload={(file) => void upload("finalMedia", file)} allowVideo />
                <MediaField label="Póster del video" guide="WebP/AVIF recomendado 1200 × 1500 px" value={content.finalPoster} kind="image" loading={uploading === "finalPoster"} upload={(file) => void upload("finalPoster", file)} />
              </div>
            </EditorSection>
          </div>
        </div>
        <div className={styles.saveBar}><span>Los cambios no se publican hasta que presiones guardar.</span><button onClick={() => void save()} disabled={busy}>{busy ? <LoaderCircle /> : <Save />} Guardar y publicar</button></div>
      </section>
    </main>
  );
}

function EditorSection({ id, title, text, children }: { id: string; title: string; text: string; children: React.ReactNode }) {
  return <section id={id} className={styles.section}><header><h2>{title}</h2><p>{text}</p></header>{children}</section>;
}

function MediaField({ label, guide, value, kind, loading, upload, allowVideo = false }: { label: string; guide: string; value: string; kind: "image" | "video"; loading: boolean; upload: (file?: File) => void; allowVideo?: boolean }) {
  return <div className={styles.imageField}>
    <div className={styles.imagePreview}>{value ? kind === "video" ? <video src={value} muted controls preload="metadata" /> : <Image src={value} alt="Vista previa" fill unoptimized sizes="260px" /> : allowVideo ? <Video /> : <ImageIcon />}</div>
    <div><strong>{label}</strong><span>{guide}</span><label>{loading ? <LoaderCircle /> : <UploadCloud />} {loading ? "Subiendo…" : "Cambiar recurso"}<input type="file" accept={allowVideo ? "image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/avif"} disabled={loading} onChange={(e) => upload(e.target.files?.[0])} /></label></div>
  </div>;
}
