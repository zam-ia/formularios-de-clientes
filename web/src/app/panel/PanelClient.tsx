"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import * as tus from "tus-js-client";
import {
  ArrowDown,
  ArrowUp,
  BriefcaseBusiness,
  CalendarDays,
  Calculator,
  Check,
  Copy,
  ContactRound,
  Columns3,
  Crop,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  GripVertical,
  Globe2,
  ImageIcon,
  Layers3,
  LayoutDashboard,
  Link2,
  LoaderCircle,
  LogOut,
  LockKeyhole,
  Menu,
  Monitor,
  MonitorPlay,
  Network,
  Plus,
  QrCode,
  Save,
  Settings2,
  Sparkles,
  Smartphone,
  Trash2,
  UploadCloud,
  UsersRound,
  Video,
  WalletCards,
  X,
} from "lucide-react";
import {
  BROCHURE_BUCKET,
  brochureMediaLayouts,
  brochureSectionTypes,
  brochureWidgetSizes,
  defaultBrochureContent,
  type BrochureCase,
  type BrochureContent,
  type BrochureMedia,
  type BrochureMetric,
  type BrochurePlan,
  type BrochureSection,
  type BrochureSectionType,
  type BrochureTeamMember,
  type BrochureTestimonial,
  type BrochureWidgetSize,
} from "@/lib/brochure";
import { getSupabaseBrowser } from "@/lib/supabaseClient";
import type { AdminRole } from "@/lib/adminData";
import { FramingDialog, ImageCropDialog } from "./MediaEditors";
import styles from "./panel.module.css";
import authStyles from "./auth.module.css";

const LiveBrochure = dynamic(() => import("../brochure/BrochureLanding"), {
  ssr: false,
});

type Tab = "links" | "content" | "structure" | "media";
type Notice = { kind: "success" | "error" | "info"; text: string } | null;
type PanelUser = {
  id: string;
  username: string;
  displayName: string;
  role: AdminRole;
  source: "environment" | "user";
};
type CropRequest = {
  file: File;
  previewUrl: string;
  resolve: (file: File | null) => void;
};

const sectionLabels: Record<BrochureSectionType, string> = {
  problems: "Problemas que resolvemos",
  solutions: "Video, Design, Social y Ads",
  method: "Método MÁGICA / C-C-C",
  plans: "Planes",
  metrics: "Datos y métricas",
  cases: "Casos",
  testimonials: "Testimonios",
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

async function readMediaDimensions(file: File) {
  if (file.type.startsWith("image/")) {
    const bitmap = await createImageBitmap(file);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  }
  if (file.type.startsWith("video/")) {
    const url = URL.createObjectURL(file);
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error("No pudimos leer el video."));
      });
      return { width: video.videoWidth, height: video.videoHeight };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return {};
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
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<PanelUser | null>(null);
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
  const [cropRequest, setCropRequest] = useState<CropRequest | null>(null);
  const [framingItem, setFramingItem] = useState<BrochureMedia | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [previewSectionId, setPreviewSectionId] = useState("");

  const loadContent = useCallback(
    async () => setContent(await api<BrochureContent>("/api/admin/brochure")),
    [],
  );

  useEffect(() => {
    void api<{ authenticated: boolean; user: PanelUser | null }>("/api/admin/auth/session")
      .then(async ({ authenticated: active, user }) => {
        setAuthenticated(active);
        setAdminUser(user);
        if (active && user?.role === "calendar") {
          router.replace("/panel/agenda");
          return;
        }
        if (active && user && ["project_manager", "collaborator", "finance", "hr"].includes(user.role)) {
          router.replace("/panel/dashboard");
          return;
        }
        if (active) await loadContent();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthLoading(false));
  }, [loadContent, router]);

  useEffect(() => {
    if (!previewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [previewOpen]);

  const formUrl = origin ? `${origin}/formulario` : "";
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
      const result = await api<{ user: PanelUser }>("/api/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAuthenticated(true);
      setAdminUser(result.user);
      setPassword("");
      if (result.user.role === "calendar") {
        router.replace("/panel/agenda");
        return;
      }
      if (["project_manager", "collaborator", "finance", "hr"].includes(result.user.role)) {
        router.replace("/panel/dashboard");
        return;
      }
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
    setAdminUser(null);
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

  function updateProblem(
    index: number,
    field: "title" | "text" | "result",
    value: string,
  ) {
    setContent((current) => ({
      ...current,
      problems: current.problems.map((item, itemIndex) =>
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

  function updateMetric(id: string, patch: Partial<BrochureMetric>) {
    setContent((current) => ({
      ...current,
      metrics: current.metrics.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addMetric() {
    setContent((current) => ({
      ...current,
      metrics: [
        ...current.metrics,
        {
          id: crypto.randomUUID(),
          value: 0,
          prefix: "",
          suffix: "%",
          label: "Nuevo indicador",
          description: "Explica brevemente qué representa este número.",
          visible: true,
        },
      ],
    }));
  }

  function updatePlan(id: string, patch: Partial<BrochurePlan>) {
    setContent((current) => ({
      ...current,
      plans: current.plans.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function updateTestimonial(
    id: string,
    patch: Partial<BrochureTestimonial>,
  ) {
    setContent((current) => ({
      ...current,
      testimonials: current.testimonials.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addTestimonial() {
    setContent((current) => ({
      ...current,
      testimonials: [
        ...current.testimonials,
        {
          id: crypto.randomUUID(),
          quote: "Escribe aquí la experiencia autorizada de tu cliente.",
          name: "Nombre del cliente",
          role: "Cargo",
          company: "Empresa",
          rating: 5,
          before: "",
          after: "",
          mediaId: "",
          visible: false,
        },
      ],
    }));
  }

  function updateTeamMember(id: string, patch: Partial<BrochureTeamMember>) {
    setContent((current) => ({
      ...current,
      teamMembers: current.teamMembers.map((item) =>
        item.id === id ? { ...item, ...patch } : item,
      ),
    }));
  }

  function addTeamMember() {
    setContent((current) => ({
      ...current,
      teamMembers: [
        ...current.teamMembers,
        {
          id: crypto.randomUUID(),
          name: "Nuevo integrante",
          role: "Cargo o especialidad",
          focus: "Describe brevemente su aporte al equipo.",
          imageUrl: "/team/equipo-crisdal.webp",
          positionX: 50,
          positionY: 30,
          size: "small",
          visible: true,
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
          mediaLayout: "grid",
          mediaSizes: {},
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

  function prepareImage(file: File) {
    return new Promise<File | null>((resolve) =>
      setCropRequest({ file, previewUrl: URL.createObjectURL(file), resolve }),
    );
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    setUploading(true);
    setNotice(null);
    let working = content;
    let uploadedCount = 0;
    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const originalFile = selectedFiles[index];
        const file =
          originalFile.type.startsWith("image/") &&
          originalFile.type !== "image/gif"
            ? await prepareImage(originalFile)
            : originalFile;
        if (!file) continue;
        const dimensions = await readMediaDimensions(file);
        setUploadName(`${index + 1}/${selectedFiles.length} · ${originalFile.name}`);
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
          title: originalFile.name.replace(/\.[^.]+$/, ""),
          caption: "",
          mimeType: file.type,
          sizeBytes: file.size,
          ...dimensions,
          positionX: 50,
          positionY: 50,
          zoom: 1,
        };
        working = { ...working, media: [...working.media, media] };
        uploadedCount += 1;
      }
      if (!uploadedCount) {
        setNotice({ kind: "info", text: "No se subió ningún archivo." });
        return;
      }
      setContent(working);
      await save(
        working,
        `${uploadedCount} archivo${uploadedCount === 1 ? "" : "s"} cargado${uploadedCount === 1 ? "" : "s"} y optimizado${uploadedCount === 1 ? "" : "s"} para el brochure.`,
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
            Volver al sitio web
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
          <Link href="/panel/dashboard">
            <LayoutDashboard /> Dashboard
          </Link>
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
          <Link href="/panel/web">
            <Globe2 /> Editar sitio web
          </Link>
          <Link href="/panel/cotizador">
            <Calculator /> Cotizador
          </Link>
          <Link href="/panel/clientes">
            <ContactRound /> Clientes
          </Link>
          <Link href="/panel/proyectos">
            <Columns3 /> Proyectos
          </Link>
          <Link href="/panel/agenda">
            <CalendarDays /> Agenda
          </Link>
          {adminUser?.role === "owner" || adminUser?.role === "admin" ? (
            <Link href="/panel/finanzas">
              <WalletCards /> Finanzas
            </Link>
          ) : null}
          {adminUser?.role === "owner" || adminUser?.role === "admin" ? (
            <Link href="/panel/personal">
              <BriefcaseBusiness /> Personal
            </Link>
          ) : null}
          {adminUser?.role === "owner" ? (
            <Link href="/panel/usuarios">
              <UsersRound /> Usuarios
            </Link>
          ) : null}
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
          <div className={styles.previewActions}>
            <button
              type="button"
              onClick={() => {
                setPreviewSectionId(
                  previewSectionId ||
                    content.sections.find((section) => section.visible)?.id ||
                    "",
                );
                setPreviewOpen(true);
              }}
            >
              <Eye size={16} /> Vista en vivo
            </button>
            <a
              href={activePreview}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir brochure publicado"
              title="Abrir brochure publicado"
            >
              <ExternalLink size={16} />
            </a>
          </div>
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
                <label className={styles.full}>
                  Imagen o video de portada
                  <select
                    value={content.heroMediaId}
                    onChange={(e) =>
                      setContent({ ...content, heroMediaId: e.target.value })
                    }
                  >
                    {content.media
                      .filter((item) => item.kind !== "document")
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title || item.path}
                        </option>
                      ))}
                  </select>
                  <small>
                    Recomendado: horizontal 16:10, 1600 × 1000 px o video MP4
                    corto. El encuadre se ajusta desde Biblioteca.
                  </small>
                </label>
              </div>
            </section>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Lo que hoy te frena</h2>
                  <p>Edita el frente, la explicación y la consecuencia de cada tarjeta. Las imágenes, videos y tamaños se configuran en “Secciones y casos”.</p>
                </div>
              </div>
              <div className={styles.dataEditor}>
                {content.problems.map((problem, index) => (
                  <article key={problem.id}>
                    <div className={styles.dataEditorHead}><strong>Tarjeta {String(index + 1).padStart(2, "0")}</strong></div>
                    <label>Título<input value={problem.title} maxLength={100} onChange={(event) => updateProblem(index, "title", event.target.value)} /></label>
                    <label>Explicación<textarea rows={3} value={problem.text} maxLength={420} onChange={(event) => updateProblem(index, "text", event.target.value)} /></label>
                    <label>Consecuencia<textarea rows={2} value={problem.result} maxLength={240} onChange={(event) => updateProblem(index, "result", event.target.value)} /></label>
                  </article>
                ))}
              </div>
            </section>
            <section className={styles.formCard}>
              <h2>Método MÁGICA · C-C-C</h2>
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
                  <h2>Servicios de Fase 1</h2>
                  <p>Edita Video, Design, Social y Ads sin volver a mezclar aquí el Método NEXO.</p>
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
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Planes del brochure</h2>
                  <p>Mantén nombres, precios y entregables iguales al pase de abordaje.</p>
                </div>
              </div>
              <div className={styles.dataEditor}>
                {content.plans.map((plan) => (
                  <article key={plan.id} className={!plan.visible ? styles.dataMuted : ""}>
                    <div className={styles.dataEditorHead}>
                      <strong>{plan.name}</strong>
                      <button type="button" onClick={() => updatePlan(plan.id, { visible: !plan.visible })} aria-label={plan.visible ? "Ocultar plan" : "Mostrar plan"}>
                        {plan.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                    </div>
                    <div className={styles.testimonialInputs}>
                      <label>Nombre<input value={plan.name} maxLength={80} onChange={(event) => updatePlan(plan.id, { name: event.target.value })} /></label>
                      <label>Precio<input value={plan.price} maxLength={80} onChange={(event) => updatePlan(plan.id, { price: event.target.value })} /></label>
                      <label>Badge<input value={plan.badge} maxLength={40} placeholder="Ej. Más elegido" onChange={(event) => updatePlan(plan.id, { badge: event.target.value })} /></label>
                    </div>
                    <label>Ideal para<textarea rows={2} value={plan.description} maxLength={260} onChange={(event) => updatePlan(plan.id, { description: event.target.value })} /></label>
                    <label>Entregables — uno por línea<textarea rows={6} value={plan.features.join("\n")} onChange={(event) => updatePlan(plan.id, { features: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean).slice(0, 12) })} /></label>
                  </article>
                ))}
              </div>
            </section>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Datos y números</h2>
                  <p>Usa solo datos operativos reales. Los números se animan en pantalla, pero el valor final permanece en el HTML para buscadores y accesibilidad.</p>
                </div>
                <button className={styles.secondaryButton} onClick={addMetric}>
                  <Plus size={16} /> Añadir indicador
                </button>
              </div>
              <div className={styles.dataEditor}>
                {content.metrics.map((metric) => (
                  <article key={metric.id} className={!metric.visible ? styles.dataMuted : ""}>
                    <div className={styles.dataEditorHead}>
                      <strong>{metric.label}</strong>
                      <button
                        type="button"
                        onClick={() => updateMetric(metric.id, { visible: !metric.visible })}
                        aria-label={metric.visible ? "Ocultar indicador" : "Mostrar indicador"}
                      >
                        {metric.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setContent({
                            ...content,
                            metrics: content.metrics.filter((item) => item.id !== metric.id),
                          })
                        }
                        aria-label="Eliminar indicador"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className={styles.metricInputs}>
                      <label>
                        Prefijo
                        <input value={metric.prefix} maxLength={12} onChange={(event) => updateMetric(metric.id, { prefix: event.target.value })} />
                      </label>
                      <label>
                        Número
                        <input type="number" value={metric.value} onChange={(event) => updateMetric(metric.id, { value: Number(event.target.value) })} />
                      </label>
                      <label>
                        Sufijo
                        <input value={metric.suffix} maxLength={12} onChange={(event) => updateMetric(metric.id, { suffix: event.target.value })} />
                      </label>
                    </div>
                    <label>
                      Nombre del indicador
                      <input value={metric.label} maxLength={100} onChange={(event) => updateMetric(metric.id, { label: event.target.value })} />
                    </label>
                    <label>
                      Explicación
                      <textarea rows={2} value={metric.description} maxLength={240} onChange={(event) => updateMetric(metric.id, { description: event.target.value })} />
                    </label>
                  </article>
                ))}
              </div>
            </section>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Testimonios</h2>
                  <p>La sección se oculta por completo mientras no haya un testimonio real, autorizado y marcado como visible.</p>
                </div>
                <button className={styles.secondaryButton} onClick={addTestimonial}>
                  <Plus size={16} /> Añadir testimonio
                </button>
              </div>
              <div className={styles.dataEditor}>
                {content.testimonials.map((testimonial) => (
                  <article key={testimonial.id} className={!testimonial.visible ? styles.dataMuted : ""}>
                    <div className={styles.dataEditorHead}>
                      <strong>{testimonial.name}</strong>
                      <button type="button" onClick={() => updateTestimonial(testimonial.id, { visible: !testimonial.visible })} aria-label={testimonial.visible ? "Ocultar testimonio" : "Mostrar testimonio"}>
                        {testimonial.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                      </button>
                      <button type="button" onClick={() => setContent({ ...content, testimonials: content.testimonials.filter((item) => item.id !== testimonial.id) })} aria-label="Eliminar testimonio">
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <label>
                      Testimonio
                      <textarea rows={4} value={testimonial.quote} maxLength={700} onChange={(event) => updateTestimonial(testimonial.id, { quote: event.target.value })} />
                    </label>
                    <div className={styles.testimonialInputs}>
                      <label>Nombre<input value={testimonial.name} maxLength={100} onChange={(event) => updateTestimonial(testimonial.id, { name: event.target.value })} /></label>
                      <label>Cargo<input value={testimonial.role} maxLength={100} onChange={(event) => updateTestimonial(testimonial.id, { role: event.target.value })} /></label>
                      <label>Empresa<input value={testimonial.company} maxLength={100} onChange={(event) => updateTestimonial(testimonial.id, { company: event.target.value })} /></label>
                      <label>Estrellas<select value={testimonial.rating} onChange={(event) => updateTestimonial(testimonial.id, { rating: Number(event.target.value) })}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
                    </div>
                    <div className={styles.testimonialInputs}>
                      <label>Situación inicial<textarea rows={3} value={testimonial.before} maxLength={500} onChange={(event) => updateTestimonial(testimonial.id, { before: event.target.value })} /></label>
                      <label>Cambio obtenido<textarea rows={3} value={testimonial.after} maxLength={500} onChange={(event) => updateTestimonial(testimonial.id, { after: event.target.value })} /></label>
                    </div>
                    <label>Foto o video del cliente
                      <select value={testimonial.mediaId} onChange={(event) => updateTestimonial(testimonial.id, { mediaId: event.target.value })}>
                        <option value="">Sin recurso todavía</option>
                        {content.media.filter((item) => item.kind !== "document").map((item) => <option key={item.id} value={item.id}>{item.title || "Recurso multimedia"}</option>)}
                      </select>
                    </label>
                  </article>
                ))}
              </div>
            </section>
            <section className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <div>
                  <h2>Equipo Crisdal</h2>
                  <p>Edita nombres, puestos, perfil, fotografía, encuadre y tamaño de cada tarjeta.</p>
                </div>
                <button className={styles.secondaryButton} onClick={addTeamMember}>
                  <Plus size={16} /> Añadir integrante
                </button>
              </div>
              <p className={styles.editorHint}>
                Para usar una foto nueva, súbela primero en Multimedia; después aparecerá en el selector de cada perfil.
              </p>
              <div className={styles.teamEditor}>
                {content.teamMembers.map((person) => (
                  <article key={person.id} className={!person.visible ? styles.dataMuted : ""}>
                    <div className={styles.teamEditorPhoto}>
                      <Image
                        src={person.imageUrl}
                        alt={person.name}
                        fill
                        unoptimized
                        sizes="210px"
                        style={{ objectPosition: `${person.positionX}% ${person.positionY}%` }}
                      />
                    </div>
                    <div className={styles.teamEditorFields}>
                      <div className={styles.dataEditorHead}>
                        <strong>{person.name}</strong>
                        <button type="button" onClick={() => updateTeamMember(person.id, { visible: !person.visible })} aria-label={person.visible ? "Ocultar integrante" : "Mostrar integrante"}>
                          {person.visible ? <Eye size={17} /> : <EyeOff size={17} />}
                        </button>
                        <button type="button" onClick={() => setContent({ ...content, teamMembers: content.teamMembers.filter((item) => item.id !== person.id) })} aria-label="Eliminar integrante">
                          <Trash2 size={17} />
                        </button>
                      </div>
                      <div className={styles.testimonialInputs}>
                        <label>Nombre<input value={person.name} maxLength={100} onChange={(event) => updateTeamMember(person.id, { name: event.target.value })} /></label>
                        <label>Puesto<input value={person.role} maxLength={120} onChange={(event) => updateTeamMember(person.id, { role: event.target.value })} /></label>
                        <label>Tamaño de tarjeta<select value={person.size} onChange={(event) => updateTeamMember(person.id, { size: event.target.value as BrochureWidgetSize })}>{brochureWidgetSizes.map((size) => <option key={size} value={size}>{widgetSizeLabels[size]}</option>)}</select></label>
                      </div>
                      <label>Especialidad<textarea rows={2} value={person.focus} maxLength={280} onChange={(event) => updateTeamMember(person.id, { focus: event.target.value })} /></label>
                      <label>
                        Fotografía
                        <select value={person.imageUrl} onChange={(event) => updateTeamMember(person.id, { imageUrl: event.target.value })}>
                          <option value="/team/aldair.webp">Perfil Aldair</option>
                          <option value="/team/milagros.webp">Perfil Milagros</option>
                          <option value="/team/abi.webp">Perfil Abi</option>
                          <option value="/team/equipo-crisdal.webp">Foto grupal</option>
                          <option value="/brochure/team/aldair-crisdal-2026.webp">Aldair 2026</option>
                          <option value="/brochure/team/milagros-crisdal-2026.webp">Milagros 2026</option>
                          <option value="/brochure/team/abi-crisdal-2026.webp">Abi 2026</option>
                          <option value="/brochure/team/equipo-crisdal-2026.webp">Equipo Crisdal 2026</option>
                          {content.media.filter((item) => item.kind === "image").map((item) => (
                            <option key={item.id} value={item.url}>{item.title || "Imagen de multimedia"}</option>
                          ))}
                        </select>
                      </label>
                      <div className={styles.testimonialInputs}>
                        <label>Posición horizontal ({Math.round(person.positionX)}%)<input type="range" min="0" max="100" value={person.positionX} onChange={(event) => updateTeamMember(person.id, { positionX: Number(event.target.value) })} /></label>
                        <label>Posición vertical ({Math.round(person.positionY)}%)<input type="range" min="0" max="100" value={person.positionY} onChange={(event) => updateTeamMember(person.id, { positionY: Number(event.target.value) })} /></label>
                      </div>
                    </div>
                  </article>
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
                    <div className={styles.sectionFields}>
                      {section.type === "custom" ||
                      section.type === "showcase" ||
                      section.type === "metrics" ||
                      section.type === "testimonials" ? (
                        <>
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
                        </>
                      ) : (
                        <p className={styles.widgetHelp}>
                          {section.type === "problems"
                            ? "Asigna hasta tres imágenes o videos: el orden corresponde a Contenido sin ritmo, Contenido sin dirección y Todo depende de ti. Puedes encuadrarlos y cambiar el ancho de cada tarjeta."
                            : "El texto de este bloque pertenece al diseño base. Puedes añadir contenido visual y organizarlo libremente."}
                        </p>
                      )}
                      <MediaPicker
                        media={content.media}
                        selected={section.mediaIds}
                        onToggle={(id) => {
                          const selected = section.mediaIds.includes(id);
                          if (
                            section.type === "problems" &&
                            !selected &&
                            section.mediaIds.length >= 3
                          ) {
                            setNotice({
                              kind: "info",
                              text: "Este bloque admite tres widgets: uno por cada problema.",
                            });
                            return;
                          }
                          const nextSizes = { ...section.mediaSizes };
                          if (selected) delete nextSizes[id];
                          else nextSizes[id] = section.type === "problems" ? "small" : "medium";
                          updateSection(section.id, {
                            mediaIds: toggleMedia(section.mediaIds, id),
                            mediaSizes: nextSizes,
                          });
                        }}
                      />
                      <MediaWidgetBoard
                        section={section}
                        media={content.media}
                        onChange={(patch) => updateSection(section.id, patch)}
                        onFrame={setFramingItem}
                      />
                    </div>
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
            <div className={styles.mediaGuide}>
              <article><ImageIcon /><div><strong>Imágenes</strong><span>Recomendado: 1600 × 1200 px · relación 4:3</span><small>JPG, PNG, WebP o AVIF. El editor prepara el recorte antes de subir.</small></div></article>
              <article><Video /><div><strong>Videos</strong><span>Horizontal: 1920 × 1080 · vertical: 1080 × 1350 px</span><small>MP4 recomendado. Conservamos el original y ajustas su enfoque después.</small></div></article>
            </div>
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
                        {item.width && item.height
                          ? ` · ${item.width} × ${item.height} px`
                          : ""}
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
                      {item.kind !== "document" ? (
                        <button
                          className={styles.frameButton}
                          onClick={() => setFramingItem(item)}
                          aria-label="Ajustar encuadre"
                          title="Ajustar encuadre y zoom"
                        >
                          <Crop />
                        </button>
                      ) : null}
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
                      {item.path.startsWith("static/") ? null : (
                        <button
                          className={styles.deleteButton}
                          onClick={() => void removeMedia(item)}
                          aria-label="Eliminar"
                        >
                          <Trash2 />
                        </button>
                      )}
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
            {cropRequest ? (
              <ImageCropDialog
                file={cropRequest.file}
                previewUrl={cropRequest.previewUrl}
                onCancel={() => {
                  URL.revokeObjectURL(cropRequest.previewUrl);
                  cropRequest.resolve(null);
                  setCropRequest(null);
                }}
                onConfirm={(file) => {
                  URL.revokeObjectURL(cropRequest.previewUrl);
                  cropRequest.resolve(file);
                  setCropRequest(null);
                }}
              />
            ) : null}
            {framingItem ? (
              <FramingDialog
                item={framingItem}
                onCancel={() => setFramingItem(null)}
                onConfirm={(patch) => {
                  const next = {
                    ...content,
                    media: content.media.map((media) =>
                      media.id === framingItem.id
                        ? { ...media, ...patch }
                        : media,
                    ),
                  };
                  setFramingItem(null);
                  setContent(next);
                  void save(next, "Encuadre guardado y publicado.");
                }}
              />
            ) : null}
          </div>
        ) : null}
      </section>
      {framingItem && tab !== "media" ? (
        <FramingDialog
          item={framingItem}
          onCancel={() => setFramingItem(null)}
          onConfirm={(patch) => {
            const next = {
              ...content,
              media: content.media.map((media) =>
                media.id === framingItem.id ? { ...media, ...patch } : media,
              ),
            };
            setFramingItem(null);
            setContent(next);
          }}
        />
      ) : null}
      {previewOpen ? (
        <div
          className={styles.livePreviewBackdrop}
          role="dialog"
          aria-modal
          aria-label="Vista previa y editor de widgets"
        >
          <section className={styles.livePreviewPanel}>
            <header>
              <div>
                <strong>Vista previa en tiempo real</strong>
                <span>Incluye los cambios aunque aún no los hayas guardado.</span>
              </div>
              <div className={styles.deviceSwitch}>
                <button
                  className={previewDevice === "desktop" ? styles.selected : ""}
                  onClick={() => setPreviewDevice("desktop")}
                  aria-label="Vista de computadora"
                >
                  <Monitor />
                </button>
                <button
                  className={previewDevice === "mobile" ? styles.selected : ""}
                  onClick={() => setPreviewDevice("mobile")}
                  aria-label="Vista de celular"
                >
                  <Smartphone />
                </button>
                <button
                  className={styles.closePreview}
                  onClick={() => setPreviewOpen(false)}
                  aria-label="Cerrar vista previa"
                >
                  <X /> <span>Cerrar</span>
                </button>
              </div>
            </header>
            <div className={styles.livePreviewWorkspace}>
              <PreviewWidgetInspector
                content={content}
                selectedId={previewSectionId}
                onSelect={(id) => {
                  setPreviewSectionId(id);
                  window.requestAnimationFrame(() =>
                    document
                      .querySelector(`[data-brochure-widget="${id}"]`)
                      ?.scrollIntoView({ behavior: "smooth", block: "center" }),
                  );
                }}
                onChange={setContent}
              />
              <div className={styles.livePreviewStage}>
                <div
                  className={`${styles.livePreviewSurface} ${
                    previewDevice === "mobile" ? styles.mobilePreview : ""
                  }`}
                >
                  <LiveBrochure
                    content={content}
                    previewSectionId={previewSectionId}
                  />
                </div>
              </div>
            </div>
          </section>
          <button
            type="button"
            className={styles.previewClosePersistent}
            onClick={() => setPreviewOpen(false)}
          >
            <X size={17} /> Cerrar vista previa
          </button>
        </div>
      ) : null}
    </main>
  );
}

function PreviewWidgetInspector({
  content,
  selectedId,
  onSelect,
  onChange,
}: {
  content: BrochureContent;
  selectedId: string;
  onSelect: (id: string) => void;
  onChange: (content: BrochureContent) => void;
}) {
  const [draggedId, setDraggedId] = useState("");
  const selected = content.sections.find((section) => section.id === selectedId);

  function patchSection(id: string, patch: Partial<BrochureSection>) {
    onChange({
      ...content,
      sections: content.sections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    });
  }

  function reorder(fromId: string, toId: string) {
    const from = content.sections.findIndex((section) => section.id === fromId);
    const to = content.sections.findIndex((section) => section.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const sections = [...content.sections];
    const [moved] = sections.splice(from, 1);
    sections.splice(to, 0, moved);
    onChange({ ...content, sections });
  }

  function moveSelected(direction: -1 | 1) {
    if (!selected) return;
    const index = content.sections.findIndex((section) => section.id === selected.id);
    const target = index + direction;
    if (target < 0 || target >= content.sections.length) return;
    const sections = [...content.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    onChange({ ...content, sections });
  }

  return (
    <aside className={styles.previewInspector} aria-label="Editor de widgets">
      <div className={styles.previewInspectorIntro}>
        <p>EDITOR EN VIVO</p>
        <strong>Mueve y configura tus widgets</strong>
        <span>Arrastra un bloque o selecciónalo para ajustar cómo se muestra.</span>
      </div>
      <div className={styles.previewWidgetList}>
        {content.sections.map((section, index) => (
          <button
            type="button"
            key={section.id}
            draggable
            onDragStart={() => setDraggedId(section.id)}
            onDragEnd={() => setDraggedId("")}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              reorder(draggedId, section.id);
              setDraggedId("");
            }}
            onClick={() => onSelect(section.id)}
            className={`${selectedId === section.id ? styles.previewWidgetSelected : ""} ${!section.visible ? styles.previewWidgetHidden : ""}`}
          >
            <GripVertical />
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{sectionLabels[section.type]}</strong>
            {section.visible ? <Eye /> : <EyeOff />}
          </button>
        ))}
      </div>
      {selected ? (
        <div className={styles.previewWidgetSettings}>
          <div>
            <span>Widget seleccionado</span>
            <strong>{sectionLabels[selected.type]}</strong>
          </div>
          <div className={styles.previewWidgetActions}>
            <button type="button" onClick={() => moveSelected(-1)} aria-label="Mover arriba"><ArrowUp /></button>
            <button type="button" onClick={() => moveSelected(1)} aria-label="Mover abajo"><ArrowDown /></button>
            <button type="button" onClick={() => patchSection(selected.id, { visible: !selected.visible })}>
              {selected.visible ? <><EyeOff /> Ocultar</> : <><Eye /> Mostrar</>}
            </button>
          </div>
          <label>
            Distribución visual
            <select
              value={selected.mediaLayout}
              onChange={(event) =>
                patchSection(selected.id, {
                  mediaLayout: event.target.value as BrochureSection["mediaLayout"],
                })
              }
            >
              <option value="grid">Cuadrícula equilibrada</option>
              <option value="spotlight">Primer elemento destacado</option>
              <option value="stack">Bloques apilados</option>
            </select>
          </label>
          <small>
            Los cambios son inmediatos. Usa “Guardar y publicar” al cerrar la vista.
          </small>
        </div>
      ) : null}
    </aside>
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
  const framing = {
    objectPosition: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
    transform: `scale(${item.zoom ?? 1})`,
    transformOrigin: `${item.positionX ?? 50}% ${item.positionY ?? 50}%`,
  };
  return (
    <div className={styles.mediaThumb}>
      {item.kind === "image" ? (
        <Image src={item.url} alt="" fill unoptimized sizes="96px" style={framing} />
      ) : item.kind === "video" ? (
        <video src={item.url} muted preload="metadata" style={framing} />
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

const widgetSizeLabels: Record<BrochureWidgetSize, string> = {
  small: "Pequeño",
  medium: "Mediano",
  wide: "Ancho",
  full: "Completo",
};

function MediaWidgetBoard({
  section,
  media,
  onChange,
  onFrame,
}: {
  section: BrochureSection;
  media: BrochureMedia[];
  onChange: (patch: Partial<BrochureSection>) => void;
  onFrame: (item: BrochureMedia) => void;
}) {
  const items = section.mediaIds
    .map((id) => media.find((item) => item.id === id))
    .filter(Boolean) as BrochureMedia[];

  function reorder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= section.mediaIds.length) return;
    const next = [...section.mediaIds];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ mediaIds: next });
  }

  if (!items.length) return null;

  return (
    <div className={styles.widgetBoard}>
      <div className={styles.widgetBoardHead}>
        <div>
          <strong>Widgets de esta sección</strong>
          <span>Ordena, redimensiona y encuadra cada archivo.</span>
        </div>
        <label>
          Distribución
          <select
            value={section.mediaLayout}
            onChange={(event) =>
              onChange({
                mediaLayout: event.target
                  .value as BrochureSection["mediaLayout"],
              })
            }
          >
            {brochureMediaLayouts.map((layout) => (
              <option key={layout} value={layout}>
                {layout === "grid"
                  ? "Cuadrícula"
                  : layout === "spotlight"
                    ? "Destacado"
                    : "Apilado"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.widgetList}>
        {items.map((item, index) => (
          <article className={styles.widgetItem} key={item.id}>
            <GripVertical className={styles.widgetGrip} aria-hidden />
            <MediaPreview item={item} />
            <div className={styles.widgetMeta}>
              <strong>{item.title || "Archivo sin título"}</strong>
              <span>
                {item.kind === "image"
                  ? "Imagen"
                  : item.kind === "video"
                    ? "Video"
                    : "Documento"}
              </span>
            </div>
            <label className={styles.widgetSize}>
              Tamaño
              <select
                value={section.mediaSizes[item.id] || "medium"}
                onChange={(event) =>
                  onChange({
                    mediaSizes: {
                      ...section.mediaSizes,
                      [item.id]: event.target.value as BrochureWidgetSize,
                    },
                  })
                }
              >
                {brochureWidgetSizes.map((size) => (
                  <option key={size} value={size}>
                    {widgetSizeLabels[size]}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.widgetActions}>
              {item.kind !== "document" ? (
                <button
                  type="button"
                  onClick={() => onFrame(item)}
                  title="Ajustar encuadre"
                  aria-label="Ajustar encuadre"
                >
                  <Crop />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => reorder(index, -1)}
                disabled={index === 0}
                aria-label="Mover widget arriba"
              >
                <ArrowUp />
              </button>
              <button
                type="button"
                onClick={() => reorder(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Mover widget abajo"
              >
                <ArrowDown />
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => {
                  const sizes = { ...section.mediaSizes };
                  delete sizes[item.id];
                  onChange({
                    mediaIds: section.mediaIds.filter((id) => id !== item.id),
                    mediaSizes: sizes,
                  });
                }}
                aria-label="Quitar widget de la sección"
              >
                <X />
              </button>
            </div>
          </article>
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
