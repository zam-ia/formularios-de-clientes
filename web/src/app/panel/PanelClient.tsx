"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as tus from "tus-js-client";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  ImageIcon,
  Layers3,
  Link2,
  LoaderCircle,
  LogOut,
  LockKeyhole,
  Menu,
  MonitorPlay,
  Network,
  Plus,
  QrCode,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import {
  BROCHURE_BUCKET,
  brochureSectionTypes,
  defaultBrochureContent,
  type BrochureCase,
  type BrochureContent,
  type BrochureMedia,
  type BrochureSection,
  type BrochureSectionType,
} from "@/lib/brochure";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import styles from "./panel.module.css";
import authStyles from "./auth.module.css";

type Tab = "links" | "content" | "structure" | "media";
type Notice = { kind: "success" | "error" | "info"; text: string } | null;

const sectionLabels: Record<BrochureSectionType, string> = {
  problems: "Problemas que resolvemos",
  manifesto: "Manifiesto",
  solutions: "Soluciones",
  nexo: "Método NEXO",
  cases: "Casos",
  showcase: "Galería multimedia",
  industries: "Industrias",
  team: "Equipo",
  route: "Ruta de trabajo",
  faq: "Preguntas frecuentes",
  contact: "Contacto y formulario",
  custom: "Sección libre",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 36);
}

function formatBytes(size: number) {
  if (!size) return "Tamaño original";
  return size >= 1024 ** 2
    ? `${(size / 1024 ** 2).toFixed(1)} MB`
    : `${Math.ceil(size / 1024)} KB`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Ocurrió un error inesperado.");
  return result as T;
}

function uploadResumable(
  file: File,
  signed: { path: string; token: string },
  onProgress: (value: number) => void,
) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const projectId = new URL(baseUrl).hostname.split(".")[0];
  return new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable/sign`,
      retryDelays: [0, 3000, 5000, 10000],
      headers: {
        "x-signature": signed.token,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 6 * 1024 * 1024,
      metadata: {
        bucketName: BROCHURE_BUCKET,
        objectName: signed.path,
        contentType: file.type,
        cacheControl: "31536000",
      },
      onError: reject,
      onProgress: (sent, total) => onProgress(Math.round((sent / total) * 100)),
      onSuccess: () => resolve(),
    });
    void upload.findPreviousUploads().then((previous) => {
      if (previous.length) upload.resumeFromPreviousUpload(previous[0]);
      upload.start();
    });
  });
}

export default function PanelClient() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("crisdal");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("links");
  const [content, setContent] = useState<BrochureContent>(
    defaultBrochureContent,
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [origin] = useState(() =>
    typeof window === "undefined" ? "" : window.location.origin,
  );
  const [linkLabel, setLinkLabel] = useState("Cliente nuevo");
  const [linkTarget, setLinkTarget] = useState<"form" | "brochure">("form");
  const [generatedLink, setGeneratedLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const loadContent = useCallback(
    async () => setContent(await api<BrochureContent>("/api/admin/brochure")),
    [],
  );

  useEffect(() => {
    void api<{ authenticated: boolean }>("/api/admin/auth/session")
      .then(async ({ authenticated: active }) => {
        setAuthenticated(active);
        if (active) await loadContent();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthLoading(false));
  }, [loadContent]);

  const formUrl = origin ? `${origin}/` : "";
  const brochureUrl = origin ? `${origin}/brochure` : "";
  const activePreview = useMemo(
    () => `${brochureUrl}?preview=panel`,
    [brochureUrl],
  );

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await api("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAuthenticated(true);
      setPassword("");
      await loadContent();
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error ? error.message : "No pudimos iniciar sesión.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api("/api/admin/auth/logout", { method: "POST", body: "{}" });
    setAuthenticated(false);
  }
  async function copy(value: string, label = "Enlace") {
    await navigator.clipboard.writeText(value);
    setNotice({ kind: "success", text: `${label} copiado.` });
  }

  function generateLink() {
    const code = `${slugify(linkLabel) || "crisdal"}-${crypto.randomUUID().slice(0, 8)}`;
    const link =
      linkTarget === "form"
        ? `${formUrl}?utm_source=crisdal-panel&utm_medium=share&utm_campaign=${code}`
        : `${brochureUrl}?ref=${code}`;
    setGeneratedLink(link);
    void copy(link, "Link único");
  }

  async function save(
    nextContent = content,
    message = "Cambios guardados y publicados.",
  ) {
    setBusy(true);
    setNotice(null);
    try {
      const saved = await api<BrochureContent>("/api/admin/brochure", {
        method: "PUT",
        body: JSON.stringify(nextContent),
      });
      setContent(saved);
      setNotice({ kind: "success", text: message });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "No pudimos guardar.",
      });
    } finally {
      setBusy(false);
    }
  }

  function move<T>(items: T[], index: number, direction: -1 | 1) {
    const result = [...items];
    const target = index + direction;
    if (target < 0 || target >= result.length) return items;
    [result[index], result[target]] = [result[target], result[index]];
    return result;
  }

  function updateService(
    index: number,
    field: "title" | "description" | "tag",
    value: string,
  ) {
    setContent((current) => ({
      ...current,
      services: current.services.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addService() {
    setContent((current) => ({
      ...current,
      services: [
        ...current.services,
        {
          id: crypto.randomUUID(),
          title: "Nueva solución",
          description: "Cuenta de forma sencilla cómo ayuda esta solución.",
          tag: "Solución",
        },
      ],
    }));
  }

  function updateSection(id: string, patch: Partial<BrochureSection>) {
    setContent((current) => ({
      ...current,
      sections: current.sections.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addSection() {
    setContent((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: crypto.randomUUID(),
          type: "custom",
          visible: true,
          eyebrow: "Nueva sección",
          title: "Una nueva historia por contar.",
          body: "Escribe aquí el contenido de esta sección.",
          mediaIds: [],
        },
      ],
    }));
  }

  function addCase() {
    const item: BrochureCase = {
      id: crypto.randomUUID(),
      client: "Nuevo cliente",
      eyebrow: "Caso real",
      title: "El cambio que construimos juntos.",
      summary:
        "Cuenta aquí el punto de partida, el trabajo realizado y lo que cambió para el cliente.",
      stages: [
        "Entender el reto.",
        "Construir la solución.",
        "Acompañar el cambio.",
      ],
      mediaIds: [],
    };
    setContent((current) => ({ ...current, cases: [...current.cases, item] }));
  }

  function updateCase(id: string, patch: Partial<BrochureCase>) {
    setContent((current) => ({
      ...current,
      cases: current.cases.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function toggleMedia(ids: string[], mediaId: string) {
    return ids.includes(mediaId)
      ? ids.filter((id) => id !== mediaId)
      : [...ids, mediaId];
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    setUploading(true);
    setNotice(null);
    let working = content;
    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index];
        setUploadName(`${index + 1}/${selectedFiles.length} · ${file.name}`);
        setUploadProgress(2);
        const signed = await api<{
          path: string;
          token: string;
          publicUrl: string;
        }>("/api/admin/brochure/media", {
          method: "POST",
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        if (file.size > 6 * 1024 * 1024)
          await uploadResumable(file, signed, setUploadProgress);
        else {
          const { error } = await getSupabaseBrowser()
            .storage.from(BROCHURE_BUCKET)
            .uploadToSignedUrl(signed.path, signed.token, file, {
              contentType: file.type,
              cacheControl: "31536000",
            });
          if (error) throw error;
          setUploadProgress(100);
        }
        const kind: BrochureMedia["kind"] = file.type.startsWith("video/")
          ? "video"
          : file.type === "application/pdf"
            ? "document"
            : "image";
        const media: BrochureMedia = {
          id: crypto.randomUUID(),
          kind,
          path: signed.path,
          url: signed.publicUrl,
          title: file.name.replace(/\.[^.]+$/, ""),
          caption: "",
          mimeType: file.type,
          sizeBytes: file.size,
        };
        working = { ...working, media: [...working.media, media] };
      }
      setContent(working);
      await save(
        working,
        `${selectedFiles.length} archivo${selectedFiles.length === 1 ? "" : "s"} cargado${selectedFiles.length === 1 ? "" : "s"} en calidad original.`,
      );
    } catch (error) {
      setNotice({
        kind: "error",
        text:
          error instanceof Error
            ? error.message
            : "No pudimos subir los archivos.",
      });
    } finally {
      setUploading(false);
      setUploadName("");
      window.setTimeout(() => setUploadProgress(0), 800);
    }
  }

  async function removeMedia(item: BrochureMedia) {
    setBusy(true);
    try {
      await api(
        `/api/admin/brochure/media?path=${encodeURIComponent(item.path)}`,
        { method: "DELETE" },
      );
      const next = {
        ...content,
        media: content.media.filter((media) => media.id !== item.id),
        sections: content.sections.map((section) => ({
          ...section,
          mediaIds: section.mediaIds.filter((id) => id !== item.id),
        })),
        cases: content.cases.map((project) => ({
          ...project,
          mediaIds: project.mediaIds.filter((id) => id !== item.id),
        })),
      };
      setContent(next);
      await save(next, "Archivo eliminado de la biblioteca.");
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "No pudimos eliminarlo.",
      });
    } finally {
      setBusy(false);
    }
  }

  if (authLoading)
    return (
      <div className={styles.loading}>
        <LoaderCircle className={styles.spin} /> Preparando tu panel…
      </div>
    );

  if (!authenticated)
    return (
      <main className={styles.loginPage}>
        <div className={styles.loginGlow} />
        <section className={styles.loginCard}>
          <div className={styles.loginBrand}>
            <span>C</span>
            <strong>
              CRISDAL<small>AGENCY</small>
            </strong>
          </div>
          <div className={styles.loginIcon}>
            <LockKeyhole size={26} />
          </div>
          <p className={styles.eyebrow}>Panel privado</p>
          <h1>Tu centro de enlaces y brochure.</h1>
          <p>
            Acceso exclusivo para administración. Los enlaces para clientes
            permanecen públicos.
          </p>
          <form onSubmit={login}>
            <div className={authStyles.fields}>
              <label>
                Usuario
                <input
                  value={username}
                  autoComplete="username"
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </label>
              <label>
                Contraseña
                <input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={12}
                />
              </label>
            </div>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <LoaderCircle className={styles.spin} />
              ) : (
                <LockKeyhole size={18} />
              )}{" "}
              Ingresar al panel
            </button>
          </form>
          <p className={authStyles.securityNote}>
            <LockKeyhole size={14} /> La URL no concede acceso. Se requiere una
            sesión segura.
          </p>
          {notice ? (
            <div className={`${styles.notice} ${styles[notice.kind]}`}>
              {notice.text}
            </div>
          ) : null}
          <Link className={styles.backLink} href="/">
            Volver al formulario
          </Link>
        </section>
      </main>
    );

  return (
    <main className={styles.dashboard}>
      <aside
        className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.loginBrand}>
            <span>C</span>
            <strong>
              CRISDAL<small>STUDIO PANEL</small>
            </strong>
          </div>
          <button
            className={styles.mobileClose}
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú"
          >
            <X />
          </button>
        </div>
        <nav>
          <NavButton
            active={tab === "links"}
            onClick={() => {
              setTab("links");
              setMenuOpen(false);
            }}
            icon={<Link2 />}
            label="Enlaces y QR"
          />
          <NavButton
            active={tab === "content"}
            onClick={() => {
              setTab("content");
              setMenuOpen(false);
            }}
            icon={<Settings2 />}
            label="Contenido"
          />
          <NavButton
            active={tab === "structure"}
            onClick={() => {
              setTab("structure");
              setMenuOpen(false);
            }}
            icon={<Layers3 />}
            label="Secciones y casos"
          />
          <NavButton
            active={tab === "media"}
            onClick={() => {
              setTab("media");
              setMenuOpen(false);
            }}
            icon={<MonitorPlay />}
            label="Multimedia"
          />
          <Link href="/panel/aliados">
            <Network /> Red de Aliados
          </Link>
        </nav>
        <div className={styles.sidebarFoot}>
          <Link href="/brochure" target="_blank">
            <ExternalLink size={17} /> Ver brochure
          </Link>
          <button onClick={logout}>
            <LogOut size={17} /> Cerrar sesión
          </button>
        </div>
      </aside>
      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <button
            className={styles.menuButton}
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>
          <div>
            <p>CRISDAL CONTROL CENTER</p>
            <strong>
              {tab === "links"
                ? "Compartir"
                : tab === "content"
                  ? "Editar textos"
                  : tab === "structure"
                    ? "Organizar brochure"
                    : "Biblioteca multimedia"}
            </strong>
          </div>
          <a href={activePreview} target="_blank" rel="noreferrer">
            Vista pública <ExternalLink size={16} />
          </a>
        </header>
        {notice ? (
          <div className={`${styles.notice} ${styles[notice.kind]}`}>
            <Check size={17} /> {notice.text}
            <button onClick={() => setNotice(null)} aria-label="Cerrar aviso">
              <X size={16} />
            </button>
          </div>
        ) : null}

        {tab === "links" ? (
          <LinksTab
            formUrl={formUrl}
            brochureUrl={brochureUrl}
            linkLabel={linkLabel}
            setLinkLabel={setLinkLabel}
            linkTarget={linkTarget}
            setLinkTarget={setLinkTarget}
            generatedLink={generatedLink}
            generateLink={generateLink}
            copy={copy}
          />
        ) : null}

        {tab === "content" ? (
          <div className={styles.contentArea}>
            <PageHeading
              eyebrow="Contenido editable"
              title="Haz que Crisdal suene a Crisdal."
              text="Edita los textos principales con una voz clara, cercana y profesional."
            />
            <section className={styles.formCard}>
              <h2>Portada</h2>
              <div className={styles.formGrid}>
                <label>
                  Frase superior
                  <input
                    value={content.kicker}
                    maxLength={80}
                    onChange={(e) =>
                      setContent({ ...content, kicker: e.target.value })
                    }
                  />
                </label>
                <label className={styles.full}>
                  Título principal
                  <textarea
                    value={content.title}
                    maxLength={140}
                    rows={2}
                    onChange={(e) =>
                      setContent({ ...content, title: e.target.value })
                    }
                  />
                </label>
                <label className={styles.full}>
                  Introducción
                  <textarea
                    value={content.lead}
                    maxLength={500}
                    rows={3}
                    onChange={(e) =>
                      setContent({ ...content, lead: e.target.value })
                    }
                  />
                </label>
              </div>
            </section>
            <section className={styles.formCard}>
              <h2>Manifiesto</h2>
              <div className={styles.formGrid}>
                <label className={styles.full}>
                  Frase central
                  <textarea
                    value={content.storyTitle}
                    maxLength={120}
                    rows={2}
                    onChange={(e) =>
                      setContent({ ...content, storyTitle: e.target.value })
                    }
                  />
                </label>
                <label className={styles.full}>
                  Texto
                  <textarea
                    value={content.story}
                    maxLength={900}
                    rows={5}
                    onChange={(e) =>
                      setContent({ ...content, story: e.target.value })
                    }
                  />
                </label>
              </div>
            </section>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Soluciones</h2>
                  <p>Añade, edita o elimina las áreas que ofreces.</p>
                </div>
                <button className={styles.secondaryButton} onClick={addService}>
                  <Plus size={16} /> Añadir
                </button>
              </div>
              <div className={styles.serviceEditor}>
                {content.services.map((service, index) => (
                  <div className={styles.serviceRow} key={service.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <label>
                      Etiqueta
                      <input
                        value={service.tag}
                        maxLength={40}
                        onChange={(e) =>
                          updateService(index, "tag", e.target.value)
                        }
                      />
                    </label>
                    <label>
                      Solución
                      <input
                        value={service.title}
                        maxLength={80}
                        onChange={(e) =>
                          updateService(index, "title", e.target.value)
                        }
                      />
                    </label>
                    <label className={styles.serviceDescription}>
                      Descripción
                      <textarea
                        value={service.description}
                        maxLength={320}
                        rows={2}
                        onChange={(e) =>
                          updateService(index, "description", e.target.value)
                        }
                      />
                    </label>
                    <button
                      onClick={() =>
                        content.services.length > 1 &&
                        setContent({
                          ...content,
                          services: content.services.filter(
                            (_, itemIndex) => itemIndex !== index,
                          ),
                        })
                      }
                      aria-label={`Eliminar ${service.title}`}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
            <section className={styles.formCard}>
              <h2>Contacto</h2>
              <div className={styles.formGrid}>
                <label>
                  Texto del botón
                  <input
                    value={content.ctaLabel}
                    maxLength={60}
                    onChange={(e) =>
                      setContent({ ...content, ctaLabel: e.target.value })
                    }
                  />
                </label>
                <label>
                  Enlace del formulario
                  <input
                    value={content.ctaUrl}
                    maxLength={600}
                    onChange={(e) =>
                      setContent({ ...content, ctaUrl: e.target.value })
                    }
                  />
                </label>
                <label>
                  Número de WhatsApp
                  <input
                    value={content.whatsappNumber}
                    maxLength={15}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        whatsappNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                  />
                </label>
              </div>
            </section>
            <SaveBar content={content} busy={busy} onSave={() => save()} />
          </div>
        ) : null}

        {tab === "structure" ? (
          <div className={styles.contentArea}>
            <PageHeading
              eyebrow="Editor modular"
              title="Ordena la historia a tu manera."
              text="Mueve, oculta o elimina bloques. También puedes crear casos y secciones libres sin tocar código."
            />
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Secciones del brochure</h2>
                  <p>El orden de esta lista será el orden de la página.</p>
                </div>
                <button className={styles.secondaryButton} onClick={addSection}>
                  <Plus size={16} /> Nueva sección
                </button>
              </div>
              <div className={styles.sectionEditor}>
                {content.sections.map((section, index) => (
                  <article
                    className={`${styles.sectionRow} ${!section.visible ? styles.sectionMuted : ""}`}
                    key={section.id}
                  >
                    <div className={styles.sectionToolbar}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <select
                        value={section.type}
                        onChange={(e) =>
                          updateSection(section.id, {
                            type: e.target.value as BrochureSectionType,
                          })
                        }
                      >
                        {brochureSectionTypes.map((type) => (
                          <option key={type} value={type}>
                            {sectionLabels[type]}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() =>
                          updateSection(section.id, {
                            visible: !section.visible,
                          })
                        }
                        aria-label={
                          section.visible
                            ? "Ocultar sección"
                            : "Mostrar sección"
                        }
                      >
                        {section.visible ? <Eye /> : <EyeOff />}
                      </button>
                      <button
                        onClick={() =>
                          setContent({
                            ...content,
                            sections: move(content.sections, index, -1),
                          })
                        }
                        disabled={index === 0}
                        aria-label="Mover arriba"
                      >
                        <ArrowUp />
                      </button>
                      <button
                        onClick={() =>
                          setContent({
                            ...content,
                            sections: move(content.sections, index, 1),
                          })
                        }
                        disabled={index === content.sections.length - 1}
                        aria-label="Mover abajo"
                      >
                        <ArrowDown />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() =>
                          setContent({
                            ...content,
                            sections: content.sections.filter(
                              (item) => item.id !== section.id,
                            ),
                          })
                        }
                        aria-label="Eliminar sección"
                      >
                        <Trash2 />
                      </button>
                    </div>
                    {section.type === "custom" ||
                    section.type === "showcase" ? (
                      <div className={styles.sectionFields}>
                        <input
                          value={section.eyebrow}
                          placeholder="Etiqueta"
                          maxLength={80}
                          onChange={(e) =>
                            updateSection(section.id, {
                              eyebrow: e.target.value,
                            })
                          }
                        />
                        <input
                          value={section.title}
                          placeholder="Título"
                          maxLength={180}
                          onChange={(e) =>
                            updateSection(section.id, { title: e.target.value })
                          }
                        />
                        <textarea
                          value={section.body}
                          placeholder="Texto de la sección"
                          maxLength={1200}
                          rows={3}
                          onChange={(e) =>
                            updateSection(section.id, { body: e.target.value })
                          }
                        />
                        <MediaPicker
                          media={content.media}
                          selected={section.mediaIds}
                          onToggle={(id) =>
                            updateSection(section.id, {
                              mediaIds: toggleMedia(section.mediaIds, id),
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Casos y clientes</h2>
                  <p>Cada caso puede tener sus propias imágenes y videos.</p>
                </div>
                <button className={styles.secondaryButton} onClick={addCase}>
                  <Plus size={16} /> Añadir caso
                </button>
              </div>
              <div className={styles.caseEditor}>
                {content.cases.map((project, index) => (
                  <article key={project.id} className={styles.caseCard}>
                    <div className={styles.caseCardHead}>
                      <span>CASO {String(index + 1).padStart(2, "0")}</span>
                      <button
                        className={styles.deleteButton}
                        onClick={() =>
                          setContent({
                            ...content,
                            cases: content.cases.filter(
                              (item) => item.id !== project.id,
                            ),
                          })
                        }
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                    <div className={styles.formGrid}>
                      <label>
                        Cliente
                        <input
                          value={project.client}
                          maxLength={100}
                          onChange={(e) =>
                            updateCase(project.id, { client: e.target.value })
                          }
                        />
                      </label>
                      <label>
                        Etiqueta
                        <input
                          value={project.eyebrow}
                          maxLength={80}
                          onChange={(e) =>
                            updateCase(project.id, { eyebrow: e.target.value })
                          }
                        />
                      </label>
                      <label className={styles.full}>
                        Título
                        <textarea
                          value={project.title}
                          maxLength={180}
                          rows={2}
                          onChange={(e) =>
                            updateCase(project.id, { title: e.target.value })
                          }
                        />
                      </label>
                      <label className={styles.full}>
                        Historia
                        <textarea
                          value={project.summary}
                          maxLength={900}
                          rows={4}
                          onChange={(e) =>
                            updateCase(project.id, { summary: e.target.value })
                          }
                        />
                      </label>
                      <label className={styles.full}>
                        Etapas <small>Una por línea</small>
                        <textarea
                          value={project.stages.join("\n")}
                          rows={4}
                          onChange={(e) =>
                            updateCase(project.id, {
                              stages: e.target.value
                                .split("\n")
                                .filter(Boolean)
                                .slice(0, 6),
                            })
                          }
                        />
                      </label>
                    </div>
                    <MediaPicker
                      media={content.media}
                      selected={project.mediaIds}
                      onToggle={(id) =>
                        updateCase(project.id, {
                          mediaIds: toggleMedia(project.mediaIds, id),
                        })
                      }
                    />
                  </article>
                ))}
              </div>
            </section>
            <SaveBar content={content} busy={busy} onSave={() => save()} />
          </div>
        ) : null}

        {tab === "media" ? (
          <div className={styles.contentArea}>
            <PageHeading
              eyebrow="Biblioteca multimedia"
              title="Sube el trabajo en su calidad original."
              text="Fotos, videos, flyers, perfiles de clientes y PDFs. Después podrás reutilizarlos en casos o galerías."
            />
            <label className={styles.uploadZone}>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime,application/pdf"
                onChange={(event) => {
                  void uploadFiles(event.target.files);
                  event.currentTarget.value = "";
                }}
                disabled={uploading}
              />
              {uploading ? (
                <LoaderCircle className={styles.spin} size={30} />
              ) : (
                <UploadCloud size={32} />
              )}
              <strong>
                {uploading
                  ? uploadName
                  : "Selecciona o arrastra uno o varios archivos"}
              </strong>
              <span>
                Archivos originales hasta 50 MB cada uno · JPG, PNG, WebP, AVIF,
                GIF, MP4, WebM, MOV y PDF
              </span>
              {uploadProgress > 0 ? (
                <i>
                  <b style={{ width: `${uploadProgress}%` }} />
                </i>
              ) : null}
            </label>
            {content.media.length ? (
              <div className={styles.mediaList}>
                {content.media.map((item, index) => (
                  <article key={item.id} className={styles.mediaItem}>
                    <MediaPreview item={item} />
                    <div className={styles.mediaFields}>
                      <span>
                        {item.kind === "image" ? (
                          <>
                            <ImageIcon size={13} /> IMAGEN
                          </>
                        ) : item.kind === "video" ? (
                          <>
                            <Video size={13} /> VIDEO
                          </>
                        ) : (
                          <>
                            <FileText size={13} /> PDF
                          </>
                        )}{" "}
                        · {formatBytes(item.sizeBytes)}
                      </span>
                      <input
                        value={item.title}
                        placeholder="Título o cliente"
                        maxLength={100}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            media: content.media.map((media) =>
                              media.id === item.id
                                ? { ...media, title: e.target.value }
                                : media,
                            ),
                          })
                        }
                      />
                      <input
                        value={item.caption}
                        placeholder="Descripción o crédito"
                        maxLength={320}
                        onChange={(e) =>
                          setContent({
                            ...content,
                            media: content.media.map((media) =>
                              media.id === item.id
                                ? { ...media, caption: e.target.value }
                                : media,
                            ),
                          })
                        }
                      />
                    </div>
                    <div className={styles.mediaActions}>
                      <button
                        onClick={() =>
                          setContent({
                            ...content,
                            media: move(content.media, index, -1),
                          })
                        }
                        disabled={index === 0}
                        aria-label="Mover arriba"
                      >
                        <ArrowUp />
                      </button>
                      <button
                        onClick={() =>
                          setContent({
                            ...content,
                            media: move(content.media, index, 1),
                          })
                        }
                        disabled={index === content.media.length - 1}
                        aria-label="Mover abajo"
                      >
                        <ArrowDown />
                      </button>
                      <button
                        className={styles.deleteButton}
                        onClick={() => void removeMedia(item)}
                        aria-label="Eliminar"
                      >
                        <Trash2 />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <MonitorPlay size={34} />
                <h2>Tu biblioteca está lista.</h2>
                <p>Sube el primer proyecto, reel, flyer o perfil de cliente.</p>
              </div>
            )}
            {content.media.length ? (
              <SaveBar
                content={content}
                busy={busy}
                onSave={() => save()}
                label={`${content.media.length} archivo${content.media.length === 1 ? "" : "s"} en la biblioteca`}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button className={active ? styles.active : ""} onClick={onClick}>
      {icon} {label}
    </button>
  );
}
function PageHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className={styles.pageHeading}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function SaveBar({
  content,
  busy,
  onSave,
  label,
}: {
  content: BrochureContent;
  busy: boolean;
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className={styles.stickySave}>
      <span>
        {label ||
          `Última edición: ${new Date(content.updatedAt).getTime() > 0 ? new Date(content.updatedAt).toLocaleString("es-PE") : "contenido inicial"}`}
      </span>
      <button className={styles.primaryButton} onClick={onSave} disabled={busy}>
        {busy ? <LoaderCircle className={styles.spin} /> : <Save size={17} />}{" "}
        Guardar y publicar
      </button>
    </div>
  );
}

function MediaPreview({ item }: { item: BrochureMedia }) {
  return (
    <div className={styles.mediaThumb}>
      {item.kind === "image" ? (
        <Image src={item.url} alt="" fill unoptimized sizes="96px" />
      ) : item.kind === "video" ? (
        <video src={item.url} muted preload="metadata" />
      ) : (
        <FileText />
      )}
    </div>
  );
}

function MediaPicker({
  media,
  selected,
  onToggle,
}: {
  media: BrochureMedia[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  if (!media.length)
    return (
      <p className={styles.pickerEmpty}>Primero sube archivos en Multimedia.</p>
    );
  return (
    <div className={styles.mediaPicker}>
      <p>Selecciona los archivos que aparecerán aquí</p>
      <div>
        {media.map((item) => (
          <button
            key={item.id}
            type="button"
            className={selected.includes(item.id) ? styles.mediaSelected : ""}
            onClick={() => onToggle(item.id)}
          >
            <MediaPreview item={item} />
            <span>{item.title || "Sin título"}</span>
            {selected.includes(item.id) ? <Check /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function LinksTab({
  formUrl,
  brochureUrl,
  linkLabel,
  setLinkLabel,
  linkTarget,
  setLinkTarget,
  generatedLink,
  generateLink,
  copy,
}: {
  formUrl: string;
  brochureUrl: string;
  linkLabel: string;
  setLinkLabel: (v: string) => void;
  linkTarget: "form" | "brochure";
  setLinkTarget: (v: "form" | "brochure") => void;
  generatedLink: string;
  generateLink: () => void;
  copy: (v: string, label?: string) => Promise<void>;
}) {
  return (
    <div className={styles.contentArea}>
      <PageHeading
        eyebrow="Enlaces listos para usar"
        title="Comparte Crisdal en segundos."
        text="Copia los enlaces permanentes o genera uno para una campaña, cliente o pieza impresa."
      />
      <div className={styles.linkGrid}>
        <LinkCard
          icon={<FileText />}
          label="Formulario de cliente"
          description="Radiografía de marca y onboarding."
          value={formUrl}
          onCopy={copy}
        />
        <LinkCard
          icon={<Sparkles />}
          label="Brochure digital"
          description="Presentación pública y multimedia."
          value={brochureUrl}
          onCopy={copy}
        />
      </div>
      <div className={styles.toolsGrid}>
        <section className={styles.toolCard}>
          <div className={styles.cardTitle}>
            <Link2 />
            <div>
              <h2>Generar link único</h2>
              <p>Ideal para identificar de dónde llegó un cliente.</p>
            </div>
          </div>
          <label>
            Nombre o campaña
            <input
              value={linkLabel}
              onChange={(event) => setLinkLabel(event.target.value)}
              placeholder="Ej. Flyer Expo Huancayo"
            />
          </label>
          <div className={styles.segmented}>
            <button
              className={linkTarget === "form" ? styles.selected : ""}
              onClick={() => setLinkTarget("form")}
            >
              Formulario
            </button>
            <button
              className={linkTarget === "brochure" ? styles.selected : ""}
              onClick={() => setLinkTarget("brochure")}
            >
              Brochure
            </button>
          </div>
          <button className={styles.primaryButton} onClick={generateLink}>
            <Sparkles size={17} /> Generar y copiar
          </button>
          {generatedLink ? (
            <button
              className={styles.generatedLink}
              onClick={() => copy(generatedLink)}
            >
              <span>{generatedLink}</span>
              <Copy size={16} />
            </button>
          ) : null}
        </section>
        <section className={`${styles.toolCard} ${styles.qrCard}`}>
          <div className={styles.cardTitle}>
            <QrCode />
            <div>
              <h2>QR boarding pass</h2>
              <p>Con isotipo central y listo para impresión.</p>
            </div>
          </div>
          <div
            className={styles.qrPreview}
            style={{
              width: "100%",
              aspectRatio: "12 / 7",
              background: "#f1eee7",
              padding: 10,
            }}
          >
            <Image
              src="/api/qr?format=svg&preview=1"
              alt="Boarding pass con código QR del brochure de Crisdal"
              width={600}
              height={350}
              style={{ objectFit: "contain" }}
              unoptimized
            />
          </div>
          <div className={styles.qrActions}>
            <a href="/api/qr?format=svg">
              <Download size={17} /> SVG para imprenta
            </a>
            <a href="/api/qr?format=png">
              <Download size={17} /> PNG alta resolución
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

function LinkCard({
  icon,
  label,
  description,
  value,
  onCopy,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: string;
  onCopy: (value: string, label?: string) => Promise<void>;
}) {
  return (
    <article className={styles.linkCard}>
      <div className={styles.linkIcon}>{icon}</div>
      <div>
        <span>LINK PERMANENTE</span>
        <h2>{label}</h2>
        <p>{description}</p>
      </div>
      <button className={styles.urlButton} onClick={() => onCopy(value, label)}>
        <span>{value}</span>
        <Copy size={17} />
      </button>
      <a href={value} target="_blank" rel="noreferrer">
        Abrir <ExternalLink size={15} />
      </a>
    </article>
  );
}
