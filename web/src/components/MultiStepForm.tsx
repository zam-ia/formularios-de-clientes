'use client';

import Script from 'next/script';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ImageUp,
  LoaderCircle,
  MessageCircle,
  Palette,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UploadCloud,
  Users,
} from 'lucide-react';
import { FORM_VERSION, formSteps, type FormField } from '@/data/formSchema';
import { getSupabaseBrowser } from '@/lib/supabaseClient';
import { isFieldVisible, normalizeWhatsapp } from '@/lib/formUtils';

type Values = Record<string, string | string[] | boolean | undefined>;
type UploadMeta = {
  category: 'brand_assets' | 'materials';
  storage_path: string;
  original_name: string;
  mime_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf' | 'video/mp4';
  size_bytes: number;
};
type View = 'welcome' | 'form' | 'review' | 'success';
type Draft = {
  formVersion: string;
  draftId: string;
  submissionCode: string;
  lastStep: number;
  answers: Values;
  files: UploadMeta[];
  startedAt: string;
  updatedAt: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; theme: string }) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const STORAGE_KEY = `crisdal-radiografia-${FORM_VERSION}`;
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
const maxFileSize = 20 * 1024 * 1024;
const stepIcons = [BriefcaseBusiness, Palette, Target, Users, Sparkles, ImageUp, Clock3];

function newDraft(): Draft {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => chars[n % chars.length]).join('');
  return {
    formVersion: FORM_VERSION,
    draftId: crypto.randomUUID(),
    submissionCode: `RM-${code}`,
    lastStep: 0,
    answers: {},
    files: [],
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return value;
  return String(value ?? '').trim().length > 0;
}

function fieldError(field: FormField, value: unknown) {
  if (field.required && !hasValue(value)) return 'Completa este campo para continuar.';
  if (!hasValue(value)) return '';
  if (field.type === 'chips' && Array.isArray(value) && value.length !== 3) return 'Agrega exactamente 3 palabras.';
  if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return 'Escribe un correo válido.';
  if (field.type === 'tel') {
    const normalized = normalizeWhatsapp(String(value));
    if (!/^\+[1-9]\d{7,14}$/.test(normalized)) return 'Escribe un WhatsApp válido.';
  }
  if (field.maxLength && String(value).length > field.maxLength) return `Usa máximo ${field.maxLength} caracteres.`;
  return '';
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function MultiStepForm() {
  const [view, setView] = useState<View>('welcome');
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Values>({});
  const [files, setFiles] = useState<UploadMeta[]>([]);
  const [draftId, setDraftId] = useState('');
  const [submissionCode, setSubmissionCode] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<Draft | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadState, setUploadState] = useState<Record<string, number>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notified, setNotified] = useState<boolean | null>(null);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [website, setWebsite] = useState('');
  const [tracking, setTracking] = useState<Record<string, string | null>>({});
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidget = useRef<string>('');
  const topRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const step = formSteps[stepIndex];
  const visibleFields = useMemo(() => step?.fields.filter((field) => isFieldVisible(field.id, values)) ?? [], [step, values]);
  const progress = Math.round(((stepIndex + 1) / formSteps.length) * 100);

  const renderTurnstile = useCallback(() => {
    if (!siteKey || !window.turnstile || !turnstileRef.current || turnstileWidget.current) return;
    turnstileWidget.current = window.turnstile.render(turnstileRef.current, {
      sitekey: siteKey,
      callback: setTurnstileToken,
      'expired-callback': () => setTurnstileToken(''),
      theme: 'light',
    });
  }, [siteKey]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTracking({
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      referrer: document.referrer || null,
      landing_path: `${window.location.pathname}${window.location.search}`,
    });

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Draft;
        if (parsed.formVersion === FORM_VERSION && Object.keys(parsed.answers ?? {}).length) setResumeDraft(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    const fresh = newDraft();
    setDraftId(fresh.draftId);
    setSubmissionCode(fresh.submissionCode);
    setStartedAt(fresh.startedAt);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || view === 'welcome' || view === 'success' || !draftId) return;
    const draft: Draft = { formVersion: FORM_VERSION, draftId, submissionCode, lastStep: stepIndex, answers: values, files, startedAt, updatedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draftId, files, initialized, startedAt, stepIndex, submissionCode, values, view]);

  useEffect(() => {
    if (view !== 'form') return;
    topRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIndex, view]);

  useEffect(() => {
    if (view !== 'review') {
      turnstileWidget.current = '';
      setTurnstileToken('');
      return;
    }
    const timer = window.setInterval(() => {
      if (window.turnstile && turnstileRef.current) {
        renderTurnstile();
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [renderTurnstile, view]);

  function startFresh() {
    const fresh = newDraft();
    localStorage.removeItem(STORAGE_KEY);
    setValues({});
    setFiles([]);
    setDraftId(fresh.draftId);
    setSubmissionCode(fresh.submissionCode);
    setStartedAt(fresh.startedAt);
    setStepIndex(0);
    setErrors({});
    setResumeDraft(null);
    setView('form');
  }

  function continueDraft() {
    if (!resumeDraft) return;
    setValues(resumeDraft.answers);
    setFiles(resumeDraft.files ?? []);
    setDraftId(resumeDraft.draftId);
    setSubmissionCode(resumeDraft.submissionCode);
    setStartedAt(resumeDraft.startedAt);
    setStepIndex(Math.min(resumeDraft.lastStep, formSteps.length - 1));
    setResumeDraft(null);
    setView('form');
  }

  function setField(id: string, value: Values[string]) {
    setValues((current) => ({ ...current, [id]: value }));
    setErrors((current) => ({ ...current, [id]: '' }));
  }

  function validateStep(index = stepIndex) {
    const nextErrors: Record<string, string> = {};
    for (const field of formSteps[index].fields) {
      if (!isFieldVisible(field.id, values)) continue;
      const error = fieldError(field, values[field.id]);
      if (error) nextErrors[field.id] = error;
    }
    setErrors(nextErrors);
    const first = Object.keys(nextErrors)[0];
    if (first) requestAnimationFrame(() => document.getElementById(first)?.focus());
    return !first;
  }

  function nextStep() {
    if (!validateStep()) return;
    if (stepIndex === formSteps.length - 1) setView('review');
    else setStepIndex((current) => current + 1);
  }

  function previousStep() {
    if (stepIndex === 0) setView('welcome');
    else setStepIndex((current) => current - 1);
  }

  function editStep(index: number) {
    setStepIndex(index);
    setView('form');
  }

  async function uploadFile(field: FormField, file: File) {
    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({ ...current, [field.id]: 'Formato no permitido. Usa JPG, PNG, WEBP, PDF o MP4.' }));
      return;
    }
    if (file.size > maxFileSize) {
      setErrors((current) => ({ ...current, [field.id]: 'El archivo supera el límite de 20 MB.' }));
      return;
    }

    setUploadState((current) => ({ ...current, [field.id]: 15 }));
    setErrors((current) => ({ ...current, [field.id]: '' }));
    try {
      const response = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, category: field.category, filename: file.name, contentType: file.type, size: file.size }),
      });
      const signed = await response.json();
      if (!response.ok) throw new Error(signed.error || 'No pudimos preparar la carga.');
      setUploadState((current) => ({ ...current, [field.id]: 55 }));

      const supabase = getSupabaseBrowser();
      const { error } = await supabase.storage
        .from(process.env.NEXT_PUBLIC_SUPABASE_FILES_BUCKET || 'brand-intake-files')
        .uploadToSignedUrl(signed.storagePath, signed.token, file, { contentType: file.type });
      if (error) throw error;

      const meta = signed.file as UploadMeta;
      setFiles((current) => [...current.filter((item) => item.category !== meta.category), meta]);
      setField(field.id, meta.storage_path);
      setUploadState((current) => ({ ...current, [field.id]: 100 }));
    } catch (error) {
      setUploadState((current) => ({ ...current, [field.id]: 0 }));
      setErrors((current) => ({ ...current, [field.id]: error instanceof Error ? error.message : 'No pudimos subir el archivo.' }));
    }
  }

  async function removeFile(field: FormField, file: UploadMeta) {
    setUploadState((current) => ({ ...current, [field.id]: 10 }));
    try {
      await fetch('/api/upload-url', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftId, storagePath: file.storage_path }),
      });
    } finally {
      setFiles((current) => current.filter((item) => item.storage_path !== file.storage_path));
      setField(field.id, undefined);
      setUploadState((current) => ({ ...current, [field.id]: 0 }));
    }
  }

  async function submit() {
    setSubmitError('');
    if (siteKey && !turnstileToken) {
      setSubmitError('Completa la verificación antes de enviar.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        marketing_invested: values.marketing_invested === 'Sí',
        contact_whatsapp: normalizeWhatsapp(String(values.contact_whatsapp ?? '')),
        deadline_date: values.deadline_type === 'Tengo una fecha exacta' ? values.deadline_date : null,
        draft_id: draftId,
        submission_code: submissionCode,
        form_version: FORM_VERSION,
        files,
        started_at: startedAt,
        turnstile_token: turnstileToken || undefined,
        website,
        ...tracking,
      };
      const response = await fetch('/api/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No pudimos enviar la radiografía.');
      setNotified(result.notified ?? null);
      localStorage.removeItem(STORAGE_KEY);
      setView('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'No pudimos enviar la radiografía.');
      window.turnstile?.reset(turnstileWidget.current);
      setTurnstileToken('');
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappNumber = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '51987088359').replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hola, envié mi Radiografía de Marca con el código ${submissionCode}.`)}`;

  if (!initialized) return <div className="loading-state" role="status"><LoaderCircle className="spin" /> Preparando tu radiografía…</div>;

  return (
    <>
      {siteKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={renderTurnstile} />}
      {resumeDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="resume-title">
          <div className="resume-modal">
            <span className="modal-icon"><RotateCcw size={22} /></span>
            <p className="eyebrow">Tu avance está guardado</p>
            <h2 id="resume-title">Encontramos una radiografía sin terminar.</h2>
            <p>Puedes continuar desde donde la dejaste o empezar con respuestas nuevas.</p>
            <div className="modal-actions">
              <button className="button button-primary" onClick={continueDraft}>Continuar</button>
              <button className="button button-ghost" onClick={startFresh}>Empezar de nuevo</button>
            </div>
          </div>
        </div>
      )}

      <div className={`intake-shell view-${view}`}>
        <aside className="brand-panel" aria-label="Crisdal Agency">
          <div className="brand-lockup">
            <Image src="/logo.svg" alt="Crisdal Agency" width={112} height={48} priority />
            <span>Estrategia antes que diseño</span>
          </div>
          <div className="brand-copy">
            <p className="eyebrow">Radiografía de marca</p>
            <h1>{view === 'success' ? 'Todo listo para empezar.' : 'Entendemos tu negocio antes de crear.'}</h1>
            <p>{view === 'success' ? 'Tu información ya quedó organizada para que nuestro equipo trabaje con mayor claridad.' : 'No hay respuestas perfectas. Solo necesitamos el contexto que hace única a tu marca.'}</p>
          </div>
          <div className={`avatar-sprite ${view === 'success' ? 'avatar-success' : ''}`} role="img" aria-label="Asistente de Crisdal" />
          <div className="trust-note"><ShieldCheck size={18} /><span>Tus respuestas y archivos se manejan de forma privada.</span></div>
        </aside>

        <main className="form-panel">
          {view === 'welcome' && (
            <section className="welcome-card" aria-labelledby="welcome-title">
              <div className="welcome-mark"><Sparkles size={24} /></div>
              <p className="eyebrow">Antes de empezar</p>
              <h2 id="welcome-title">Ordenemos lo esencial de tu marca.</h2>
              <p className="welcome-lead">En unos minutos entenderemos qué vendes, a quién ayudas, qué quieres lograr y qué materiales ya tienes.</p>
              <div className="welcome-facts">
                <span><Clock3 size={18} /> 6–8 minutos</span>
                <span><FileCheck2 size={18} /> Tu avance se guarda</span>
              </div>
              <button className="button button-primary button-large" onClick={() => Object.keys(values).length ? setView('form') : startFresh()}>{Object.keys(values).length ? 'Continuar mi radiografía' : 'Empezar mi radiografía'} <ArrowRight size={19} /></button>
              <p className="privacy-line">No compartas contraseñas, datos bancarios ni información sensible innecesaria.</p>
            </section>
          )}

          {view === 'form' && step && (
            <section className="form-card" aria-labelledby="step-title">
              <div ref={topRef} tabIndex={-1} className="step-focus" />
              <header className="progress-header">
                <div className="progress-meta"><span>Paso {stepIndex + 1} de {formSteps.length}</span><strong>{progress}%</strong></div>
                <div className="progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
              </header>

              <div className="step-heading">
                <span className="step-icon">{(() => { const Icon = stepIcons[stepIndex]; return <Icon size={22} />; })()}</span>
                <p className="eyebrow">{step.eyebrow}</p>
                <h2 id="step-title">{step.title}</h2>
                <p>{step.description}</p>
              </div>

              <div className="fields">
                {visibleFields.map((field) => (
                  <FieldControl
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                    error={errors[field.id]}
                    uploadedFile={files.find((file) => file.category === field.category)}
                    uploadProgress={uploadState[field.id] ?? 0}
                    onChange={(value) => setField(field.id, value)}
                    onUpload={(file) => uploadFile(field, file)}
                    onRemove={(file) => removeFile(field, file)}
                  />
                ))}
              </div>

              {step.id === 'resources' && values.own_materials === 'No, hay que producir' && <div className="inline-note"><Check size={18} /> Perfecto. Lo tendremos en cuenta para la propuesta de producción.</div>}
              {step.id === 'contact' && values.deadline_date && new Date(String(values.deadline_date)).getTime() - Date.now() < 72 * 60 * 60 * 1000 && <div className="warning-note">Esta fecha requiere validar disponibilidad antes de confirmar el inicio.</div>}
              {step.insight && <p className="step-insight">{step.insight}</p>}

              <div className="form-actions">
                <button className="button button-ghost" onClick={previousStep}><ArrowLeft size={18} /> Volver</button>
                <button className="button button-primary" onClick={nextStep}>{stepIndex === formSteps.length - 1 ? 'Revisar respuestas' : 'Continuar'} <ArrowRight size={18} /></button>
              </div>
            </section>
          )}

          {view === 'review' && (
            <section className="form-card review-card" aria-labelledby="review-title">
              <p className="eyebrow">Antes de enviar</p>
              <h2 id="review-title">Tu radiografía, en una vista</h2>
              <p className="review-intro">Confirma que todo esté correcto. Puedes volver a cualquier sección.</p>
              <div className="summary-grid">
                <Summary title="Marca" body={`${values.business_name || '—'} · ${(values.brand_words as string[] || []).join(', ')}`} onEdit={() => editStep(1)} />
                <Summary title="Prioridad" body={`${values.primary_goal || '—'} · ${values.four_week_result || '—'}`} onEdit={() => editStep(2)} />
                <Summary title="Cliente" body={String(values.ideal_customer || '—')} onEdit={() => editStep(3)} />
                <Summary title="Oferta" body={`${values.star_offer || '—'} · ${values.average_price || '—'}`} onEdit={() => editStep(4)} />
                <Summary title="Acción esperada" body={String(values.primary_cta || '—')} onEdit={() => editStep(2)} />
                <Summary title="Material" body={String(values.own_materials || '—')} onEdit={() => editStep(5)} />
                <Summary title="Fecha" body={String(values.deadline_date || values.deadline_type || '—')} onEdit={() => editStep(6)} />
                <Summary title="Contacto" body={`${values.contact_name || '—'} · ${normalizeWhatsapp(String(values.contact_whatsapp || ''))}`} onEdit={() => editStep(6)} />
              </div>

              <label className="honeypot" aria-hidden="true">Sitio web<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
              {siteKey && <div className="turnstile-wrap" ref={turnstileRef} />}
              {submitError && <div className="submit-error" role="alert">{submitError}</div>}
              <div className="form-actions">
                <button className="button button-ghost" onClick={() => editStep(formSteps.length - 1)}><ArrowLeft size={18} /> Editar</button>
                <button className="button button-primary" onClick={submit} disabled={submitting}>{submitting ? <><LoaderCircle className="spin" size={18} /> Enviando…</> : <>Enviar a Crisdal <ArrowRight size={18} /></>}</button>
              </div>
            </section>
          )}

          {view === 'success' && (
            <section className="success-card" aria-labelledby="success-title">
              <span className="success-icon"><CheckCircle2 size={36} /></span>
              <p className="eyebrow">Envío completado</p>
              <h2 id="success-title">Radiografía recibida.</h2>
              <p>Ya tenemos el contexto para empezar con más claridad. Revisaremos tus respuestas y te escribiremos por WhatsApp.</p>
              <div className="code-card"><span>Tu código de seguimiento</span><strong>{submissionCode}</strong></div>
              {notified === false && <p className="success-note">Tu información quedó guardada correctamente. La notificación por correo está pendiente, pero no necesitas volver a enviarla.</p>}
              <a className="button button-primary button-large" href={whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={20} /> Escribir a Crisdal por WhatsApp</a>
              <button className="button button-ghost" onClick={() => navigator.clipboard.writeText(submissionCode)}><FileCheck2 size={18} /> Copiar mi código</button>
            </section>
          )}
        </main>
      </div>
    </>
  );
}

function Summary({ title, body, onEdit }: { title: string; body: string; onEdit: () => void }) {
  return <article className="summary-item"><div><span>{title}</span><p>{body}</p></div><button onClick={onEdit}>Editar</button></article>;
}

function FieldControl({ field, value, error, uploadedFile, uploadProgress, onChange, onUpload, onRemove }: {
  field: FormField;
  value: Values[string];
  error?: string;
  uploadedFile?: UploadMeta;
  uploadProgress: number;
  onChange: (value: Values[string]) => void;
  onUpload: (file: File) => void;
  onRemove: (file: UploadMeta) => void;
}) {
  const [chipText, setChipText] = useState('');
  const describedBy = `${field.id}-help ${field.id}-error`;
  const common = { id: field.id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy };

  function addChip() {
    const next = chipText.trim().replace(/,$/, '');
    const current = Array.isArray(value) ? value : [];
    if (!next || current.length >= 3 || current.some((chip) => chip.toLowerCase() === next.toLowerCase())) return;
    onChange([...current, next]);
    setChipText('');
  }

  return (
    <fieldset className={`field ${error ? 'field-error' : ''}`}>
      <legend>{field.label}{field.required && <span aria-hidden="true"> *</span>}{field.optional && <em>Opcional</em>}</legend>
      {field.helper && <p id={`${field.id}-help`} className="field-help">{field.helper}</p>}

      {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'date') && (
        <input {...common} type={field.type === 'text' ? 'text' : field.type} value={String(value ?? '')} placeholder={field.placeholder} maxLength={field.maxLength} min={field.type === 'date' ? new Date().toISOString().slice(0, 10) : undefined} inputMode={field.type === 'tel' ? 'tel' : undefined} autoComplete={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : undefined} onChange={(event) => onChange(event.target.value)} />
      )}

      {field.type === 'textarea' && (
        <><textarea {...common} value={String(value ?? '')} placeholder={field.placeholder} maxLength={field.maxLength} rows={4} onChange={(event) => onChange(event.target.value)} /><span className="counter">{String(value ?? '').length}{field.maxLength ? ` / ${field.maxLength}` : ''}</span></>
      )}

      {field.type === 'single_select' && (
        <div className="options-grid" id={field.id} role="radiogroup" aria-describedby={describedBy}>
          {field.options?.map((option) => <button key={option} type="button" role="radio" aria-checked={value === option} className={value === option ? 'option-card selected' : 'option-card'} onClick={() => onChange(option)}><span>{option}</span>{value === option && <Check size={17} />}</button>)}
        </div>
      )}

      {field.type === 'multiselect_cards' && (
        <div className="options-grid" id={field.id} role="group" aria-describedby={describedBy}>
          {field.options?.map((option) => {
            const selected = Array.isArray(value) && value.includes(option);
            return <button key={option} type="button" aria-pressed={selected} className={selected ? 'option-card selected' : 'option-card'} onClick={() => {
              const current = Array.isArray(value) ? value : [];
              if (selected) onChange(current.filter((item) => item !== option));
              else if (!field.maxSelections || current.length < field.maxSelections) onChange([...current, option]);
            }}><span>{option}</span>{selected && <Check size={17} />}</button>;
          })}
        </div>
      )}

      {field.type === 'chips' && (
        <div className="chip-control">
          <div className="chips">{(Array.isArray(value) ? value : []).map((chip) => <button type="button" key={chip} onClick={() => onChange((value as string[]).filter((item) => item !== chip))}>{chip}<span aria-label={`Quitar ${chip}`}>×</span></button>)}</div>
          <input {...common} value={chipText} placeholder="Ej. cercana" disabled={Array.isArray(value) && value.length >= 3} onChange={(event) => setChipText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); addChip(); } }} onBlur={addChip} />
        </div>
      )}

      {field.type === 'file_upload' && (
        <div id={field.id} className="upload-control">
          {uploadedFile ? (
            <div className="uploaded-file"><span className="file-badge"><FileCheck2 size={20} /></span><div><strong>{uploadedFile.original_name}</strong><small>{formatBytes(uploadedFile.size_bytes)}</small></div><button type="button" onClick={() => onRemove(uploadedFile)} aria-label={`Eliminar ${uploadedFile.original_name}`}><Trash2 size={18} /></button></div>
          ) : (
            <label className="upload-drop"><UploadCloud size={25} /><span><strong>Seleccionar archivo</strong><small>También puedes arrastrarlo aquí</small></span><input type="file" accept={allowedTypes.join(',')} onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} /></label>
          )}
          {uploadProgress > 0 && uploadProgress < 100 && <div className="upload-progress" role="progressbar" aria-valuenow={uploadProgress}><span style={{ width: `${uploadProgress}%` }} /></div>}
        </div>
      )}

      {field.type === 'checkbox' && (
        <label className="checkbox-control"><input {...common} type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} /><span><Check size={15} /></span><b>{field.label}</b></label>
      )}

      {error && <p id={`${field.id}-error`} className="error-message" role="alert">{error}</p>}
    </fieldset>
  );
}
