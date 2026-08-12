'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  ImageIcon,
  Link2,
  LoaderCircle,
  LogOut,
  Mail,
  Menu,
  MonitorPlay,
  Plus,
  QrCode,
  Save,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import { BROCHURE_BUCKET, defaultBrochureContent, type BrochureContent, type BrochureMedia } from '@/lib/brochure';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import styles from './panel.module.css';

type Tab = 'links' | 'content' | 'media';
type Notice = { kind: 'success' | 'error' | 'info'; text: string } | null;

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 36);
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Ocurrió un error inesperado.');
  return result as T;
}

export default function PanelClient() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('links');
  const [content, setContent] = useState<BrochureContent>(defaultBrochureContent);
  const [notice, setNotice] = useState<Notice>(null);
  const [origin] = useState(() => typeof window === 'undefined' ? '' : window.location.origin);
  const [linkLabel, setLinkLabel] = useState('Cliente nuevo');
  const [linkTarget, setLinkTarget] = useState<'form' | 'brochure'>('form');
  const [generatedLink, setGeneratedLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadContent = useCallback(async () => {
    const data = await api<BrochureContent>('/api/admin/brochure');
    setContent(data);
  }, []);

  useEffect(() => {
    void api<{ authenticated: boolean }>('/api/admin/auth/session')
      .then(async ({ authenticated: active }) => {
        setAuthenticated(active);
        if (active) await loadContent();
      })
      .catch(() => setAuthenticated(false))
      .finally(() => setAuthLoading(false));
  }, [loadContent]);

  const formUrl = origin ? `${origin}/` : '';
  const brochureUrl = origin ? `${origin}/brochure` : '';
  const activePreview = useMemo(() => tab === 'links' ? brochureUrl : `${brochureUrl}?preview=panel`, [brochureUrl, tab]);

  async function requestAccess() {
    setBusy(true);
    setNotice(null);
    try {
      await api('/api/admin/auth/request', { method: 'POST', body: '{}' });
      setEmailSent(true);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'No pudimos enviar el acceso.' });
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api('/api/admin/auth/logout', { method: 'POST', body: '{}' });
    setAuthenticated(false);
  }

  async function copy(value: string, label = 'Enlace') {
    await navigator.clipboard.writeText(value);
    setNotice({ kind: 'success', text: `${label} copiado.` });
  }

  function generateLink() {
    const code = `${slugify(linkLabel) || 'crisdal'}-${crypto.randomUUID().slice(0, 8)}`;
    const link = linkTarget === 'form'
      ? `${formUrl}?utm_source=crisdal-panel&utm_medium=share&utm_campaign=${code}`
      : `${brochureUrl}?ref=${code}`;
    setGeneratedLink(link);
    void copy(link, 'Link único');
  }

  async function save(nextContent = content, message = 'Cambios guardados en el brochure.') {
    setBusy(true);
    setNotice(null);
    try {
      const saved = await api<BrochureContent>('/api/admin/brochure', { method: 'PUT', body: JSON.stringify(nextContent) });
      setContent(saved);
      setNotice({ kind: 'success', text: message });
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'No pudimos guardar.' });
    } finally {
      setBusy(false);
    }
  }

  function updateService(index: number, field: 'title' | 'description' | 'tag', value: string) {
    setContent((current) => ({ ...current, services: current.services.map((service, itemIndex) => itemIndex === index ? { ...service, [field]: value } : service) }));
  }

  function addService() {
    setContent((current) => ({ ...current, services: [...current.services, { id: crypto.randomUUID(), title: 'Nuevo servicio', description: 'Describe el valor de este servicio.', tag: 'Servicio' }] }));
  }

  function moveMedia(index: number, direction: -1 | 1) {
    setContent((current) => {
      const media = [...current.media];
      const target = index + direction;
      if (target < 0 || target >= media.length) return current;
      [media[index], media[target]] = [media[target], media[index]];
      return { ...current, media };
    });
  }

  async function uploadFile(file?: File) {
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    setNotice(null);
    try {
      const signed = await api<{ path: string; token: string; publicUrl: string }>('/api/admin/brochure/media', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, mimeType: file.type, sizeBytes: file.size }),
      });
      setUploadProgress(35);
      const { error } = await getSupabaseBrowser().storage.from(BROCHURE_BUCKET).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
      if (error) throw error;
      setUploadProgress(80);
      const kind: BrochureMedia['kind'] = file.type.startsWith('video/') ? 'video' : file.type === 'application/pdf' ? 'document' : 'image';
      const media: BrochureMedia = { id: crypto.randomUUID(), kind, path: signed.path, url: signed.publicUrl, title: file.name.replace(/\.[^.]+$/, ''), caption: '', mimeType: file.type };
      const next = { ...content, media: [...content.media, media] };
      setContent(next);
      await save(next, 'Archivo publicado en el brochure.');
      setUploadProgress(100);
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'No pudimos subir el archivo.' });
    } finally {
      setUploading(false);
      window.setTimeout(() => setUploadProgress(0), 800);
    }
  }

  async function removeMedia(item: BrochureMedia) {
    setBusy(true);
    try {
      await api(`/api/admin/brochure/media?path=${encodeURIComponent(item.path)}`, { method: 'DELETE' });
      const next = { ...content, media: content.media.filter((media) => media.id !== item.id) };
      setContent(next);
      await save(next, 'Archivo eliminado.');
    } catch (error) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'No pudimos eliminarlo.' });
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) return <div className={styles.loading}><LoaderCircle className={styles.spin} /> Preparando tu panel…</div>;

  if (!authenticated) return <main className={styles.loginPage}>
    <div className={styles.loginGlow} />
    <section className={styles.loginCard}>
      <div className={styles.loginBrand}><span>C</span><strong>CRISDAL<small>AGENCY</small></strong></div>
      <div className={styles.loginIcon}><Sparkles size={26} /></div>
      <p className={styles.eyebrow}>Panel privado</p>
      <h1>Tu centro de enlaces y brochure.</h1>
      <p>Recibirás un enlace seguro en <strong>crisdalagency@gmail.com</strong>. No necesitas recordar otra contraseña.</p>
      {emailSent ? <div className={styles.mailSent}><Mail size={24} /><div><strong>Revisa tu correo</strong><span>El enlace estará disponible durante 15 minutos.</span></div></div> : <button className={styles.primaryButton} onClick={requestAccess} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} /> : <Send size={18} />} Enviar enlace de acceso</button>}
      {notice ? <div className={`${styles.notice} ${styles[notice.kind]}`}>{notice.text}</div> : null}
      <Link className={styles.backLink} href="/">Volver al formulario</Link>
    </section>
  </main>;

  return <main className={styles.dashboard}>
    <aside className={`${styles.sidebar} ${menuOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.sidebarHeader}><div className={styles.loginBrand}><span>C</span><strong>CRISDAL<small>STUDIO PANEL</small></strong></div><button className={styles.mobileClose} onClick={() => setMenuOpen(false)} aria-label="Cerrar menú"><X /></button></div>
      <nav>
        <button className={tab === 'links' ? styles.active : ''} onClick={() => { setTab('links'); setMenuOpen(false); }}><Link2 /> Enlaces y QR</button>
        <button className={tab === 'content' ? styles.active : ''} onClick={() => { setTab('content'); setMenuOpen(false); }}><Settings2 /> Contenido</button>
        <button className={tab === 'media' ? styles.active : ''} onClick={() => { setTab('media'); setMenuOpen(false); }}><MonitorPlay /> Multimedia</button>
      </nav>
      <div className={styles.sidebarFoot}><Link href="/brochure" target="_blank"><ExternalLink size={17} /> Ver brochure</Link><button onClick={logout}><LogOut size={17} /> Cerrar sesión</button></div>
    </aside>

    <section className={styles.workspace}>
      <header className={styles.topbar}><button className={styles.menuButton} onClick={() => setMenuOpen(true)} aria-label="Abrir menú"><Menu /></button><div><p>CRISDAL CONTROL CENTER</p><strong>{tab === 'links' ? 'Compartir' : tab === 'content' ? 'Editar brochure' : 'Biblioteca multimedia'}</strong></div><a href={activePreview} target="_blank" rel="noreferrer">Vista pública <ExternalLink size={16} /></a></header>
      {notice ? <div className={`${styles.notice} ${styles[notice.kind]}`}><Check size={17} /> {notice.text}<button onClick={() => setNotice(null)} aria-label="Cerrar aviso"><X size={16} /></button></div> : null}

      {tab === 'links' ? <div className={styles.contentArea}>
        <div className={styles.pageHeading}><p className={styles.eyebrow}>Enlaces listos para usar</p><h1>Comparte Crisdal en segundos.</h1><p>Copia los enlaces permanentes o genera uno único para una campaña, cliente o pieza impresa.</p></div>
        <div className={styles.linkGrid}>
          <LinkCard icon={<FileText />} label="Formulario de cliente" description="Radiografía de marca y onboarding." value={formUrl} onCopy={copy} />
          <LinkCard icon={<Sparkles />} label="Brochure digital" description="Presentación pública y multimedia." value={brochureUrl} onCopy={copy} />
        </div>
        <div className={styles.toolsGrid}>
          <section className={styles.toolCard}><div className={styles.cardTitle}><Link2 /><div><h2>Generar link único</h2><p>Ideal para identificar de dónde llegó un cliente.</p></div></div><label>Nombre o campaña<input value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} placeholder="Ej. Flyer Expo Huancayo" /></label><div className={styles.segmented}><button className={linkTarget === 'form' ? styles.selected : ''} onClick={() => setLinkTarget('form')}>Formulario</button><button className={linkTarget === 'brochure' ? styles.selected : ''} onClick={() => setLinkTarget('brochure')}>Brochure</button></div><button className={styles.primaryButton} onClick={generateLink}><Sparkles size={17} /> Generar y copiar</button>{generatedLink ? <button className={styles.generatedLink} onClick={() => copy(generatedLink)}><span>{generatedLink}</span><Copy size={16} /></button> : null}</section>
            <section className={`${styles.toolCard} ${styles.qrCard}`}><div className={styles.cardTitle}><QrCode /><div><h2>QR boarding pass</h2><p>Con isotipo central y listo para impresión.</p></div></div><div className={styles.qrPreview} style={{ width: '100%', aspectRatio: '12 / 7', background: '#f1eee7', padding: 10 }}><Image src="/api/qr?format=svg&preview=1" alt="Boarding pass con código QR del brochure de Crisdal" width={600} height={350} style={{ objectFit: 'contain' }} unoptimized /></div><div className={styles.qrActions}><a href="/api/qr?format=svg"><Download size={17} /> SVG para imprenta</a><a href="/api/qr?format=png"><Download size={17} /> PNG alta resolución</a></div></section>
        </div>
      </div> : null}

      {tab === 'content' ? <div className={styles.contentArea}>
        <div className={styles.pageHeading}><p className={styles.eyebrow}>Contenido editable</p><h1>La historia detrás de Crisdal.</h1><p>Los cambios aparecen en el brochure cuando presionas guardar.</p></div>
        <section className={styles.formCard}>
          <h2>Portada</h2><div className={styles.formGrid}><label>Frase superior<input value={content.kicker} maxLength={80} onChange={(e) => setContent({ ...content, kicker: e.target.value })} /></label><label className={styles.full}>Título principal<textarea value={content.title} maxLength={140} rows={2} onChange={(e) => setContent({ ...content, title: e.target.value })} /></label><label className={styles.full}>Introducción<textarea value={content.lead} maxLength={500} rows={3} onChange={(e) => setContent({ ...content, lead: e.target.value })} /></label></div>
        </section>
        <section className={styles.formCard}><h2>Nuestra manera de trabajar</h2><div className={styles.formGrid}><label className={styles.full}>Título<textarea value={content.storyTitle} maxLength={120} rows={2} onChange={(e) => setContent({ ...content, storyTitle: e.target.value })} /></label><label className={styles.full}>Historia<textarea value={content.story} maxLength={900} rows={5} onChange={(e) => setContent({ ...content, story: e.target.value })} /></label></div></section>
        <section className={styles.formCard}><div className={styles.formCardHeader}><div><h2>Servicios</h2><p>Puedes mostrar hasta 12.</p></div><button className={styles.secondaryButton} onClick={addService}><Plus size={16} /> Añadir</button></div><div className={styles.serviceEditor}>{content.services.map((service, index) => <div className={styles.serviceRow} key={service.id}><span>{String(index + 1).padStart(2, '0')}</span><label>Etiqueta<input value={service.tag} maxLength={40} onChange={(e) => updateService(index, 'tag', e.target.value)} /></label><label>Servicio<input value={service.title} maxLength={80} onChange={(e) => updateService(index, 'title', e.target.value)} /></label><label className={styles.serviceDescription}>Descripción<textarea value={service.description} maxLength={240} rows={2} onChange={(e) => updateService(index, 'description', e.target.value)} /></label><button onClick={() => content.services.length > 1 && setContent({ ...content, services: content.services.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Eliminar ${service.title}`}><Trash2 size={17} /></button></div>)}</div></section>
        <section className={styles.formCard}><h2>Llamada a la acción</h2><div className={styles.formGrid}><label>Texto del botón<input value={content.ctaLabel} maxLength={60} onChange={(e) => setContent({ ...content, ctaLabel: e.target.value })} /></label><label>Enlace<input value={content.ctaUrl} maxLength={600} onChange={(e) => setContent({ ...content, ctaUrl: e.target.value })} /></label><label>WhatsApp<input value={content.whatsappNumber} maxLength={15} onChange={(e) => setContent({ ...content, whatsappNumber: e.target.value.replace(/\D/g, '') })} /></label></div></section>
        <div className={styles.stickySave}><span>Última edición: {new Date(content.updatedAt).getTime() > 0 ? new Date(content.updatedAt).toLocaleString('es-PE') : 'contenido inicial'}</span><button className={styles.primaryButton} onClick={() => save()} disabled={busy}>{busy ? <LoaderCircle className={styles.spin} /> : <Save size={17} />} Guardar y publicar</button></div>
      </div> : null}

      {tab === 'media' ? <div className={styles.contentArea}>
        <div className={styles.pageHeading}><p className={styles.eyebrow}>Biblioteca multimedia</p><h1>Imágenes, videos y documentos.</h1><p>Los archivos se publican directamente en el brochure y puedes ordenar cómo aparecen.</p></div>
        <label className={styles.uploadZone}><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" onChange={(event) => { void uploadFile(event.target.files?.[0]); event.currentTarget.value = ''; }} disabled={uploading} />{uploading ? <LoaderCircle className={styles.spin} size={30} /> : <UploadCloud size={32} />}<strong>{uploading ? `Subiendo… ${uploadProgress}%` : 'Selecciona o arrastra un archivo'}</strong><span>Imágenes hasta 15 MB · PDF hasta 30 MB · video MP4/WebM hasta 200 MB</span>{uploadProgress > 0 ? <i><b style={{ width: `${uploadProgress}%` }} /></i> : null}</label>
        {content.media.length ? <div className={styles.mediaList}>{content.media.map((item, index) => <article key={item.id} className={styles.mediaItem}><div className={styles.mediaThumb}>{item.kind === 'image' ? <Image src={item.url} alt="" fill unoptimized sizes="96px" /> : item.kind === 'video' ? <Video /> : <FileText />}</div><div className={styles.mediaFields}><span>{item.kind === 'image' ? <><ImageIcon size={13} /> IMAGEN</> : item.kind === 'video' ? <><Video size={13} /> VIDEO</> : <><FileText size={13} /> PDF</>}</span><input value={item.title} placeholder="Título" maxLength={100} onChange={(e) => setContent({ ...content, media: content.media.map((media) => media.id === item.id ? { ...media, title: e.target.value } : media) })} /><input value={item.caption} placeholder="Descripción opcional" maxLength={240} onChange={(e) => setContent({ ...content, media: content.media.map((media) => media.id === item.id ? { ...media, caption: e.target.value } : media) })} /></div><div className={styles.mediaActions}><button onClick={() => moveMedia(index, -1)} disabled={index === 0} aria-label="Mover arriba"><ArrowUp /></button><button onClick={() => moveMedia(index, 1)} disabled={index === content.media.length - 1} aria-label="Mover abajo"><ArrowDown /></button><button className={styles.deleteButton} onClick={() => void removeMedia(item)} aria-label="Eliminar"><Trash2 /></button></div></article>)}</div> : <div className={styles.emptyState}><MonitorPlay size={34} /><h2>Tu biblioteca está lista.</h2><p>Sube el primer proyecto, reel o PDF para llenar el brochure de vida.</p></div>}
        {content.media.length ? <div className={styles.stickySave}><span>{content.media.length} archivo{content.media.length === 1 ? '' : 's'} publicado{content.media.length === 1 ? '' : 's'}</span><button className={styles.primaryButton} onClick={() => save()} disabled={busy}><Save size={17} /> Guardar orden y textos</button></div> : null}
      </div> : null}
    </section>
  </main>;
}

function LinkCard({ icon, label, description, value, onCopy }: { icon: React.ReactNode; label: string; description: string; value: string; onCopy: (value: string, label?: string) => Promise<void> }) {
  return <article className={styles.linkCard}><div className={styles.linkIcon}>{icon}</div><div><span>LINK PERMANENTE</span><h2>{label}</h2><p>{description}</p></div><button className={styles.urlButton} onClick={() => onCopy(value, label)}><span>{value}</span><Copy size={17} /></button><a href={value} target="_blank" rel="noreferrer">Abrir <ExternalLink size={15} /></a></article>;
}
