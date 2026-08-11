'use client';
import React, { useEffect, useState } from 'react';

type Field = any;
type Step = {
  id: string;
  title: string;
  fields: Field[];
};

export default function MultiStepForm() {
  const [schema, setSchema] = useState<any | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  useEffect(() => {
    fetch('/form-schema.json')
      .then((r) => r.json())
      .then((json) => setSchema(json))
      .catch((err) => console.error(err));
  }, []);

  if (!schema) return <div className="text-center py-16">Cargando...</div>;
  const steps: Step[] = schema.steps;
  const step = steps[stepIndex];

  function setField(id: string, v: any) {
    setValues((s) => ({ ...s, [id]: v }));
  }

  function canGoNext() {
    // simple required check
    for (const f of step.fields || []) {
      if (f.required && (values[f.id] === undefined || values[f.id] === '' || values[f.id] === null)) {
        return false;
      }
    }
    return true;
  }

  async function handleNext() {
    if (!canGoNext()) return alert('Completa los campos requeridos');
    if (stepIndex < steps.length - 1) setStepIndex((i) => i + 1);
  }

  async function handlePrev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const resp = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const json = await resp.json();
      setSubmissionResult(json);

      if (json?.submission) {
        // Notify server to send email
        await fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission: json.submission }) });
      }

      // Prepare whatsapp link
      const wa = `https://wa.me/${schema.whatsappE164}?text=${encodeURIComponent(`Hola! He enviado la radiografía: ${json?.submission?.id ?? ''}`)}`;

      setSubmitting(false);
      window.location.href = wa; // redirect to WhatsApp per spec after submission
    } catch (err) {
      console.error(err);
      setSubmitting(false);
      alert('Error al enviar');
    }
  }

  const progress = Math.round(((stepIndex + 1) / steps.length) * 100);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-[var(--color-black-main)]">{schema.title}</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">Tiempo estimado: {schema.estimatedMinutes}</p>
      </header>

      <div className="flex gap-6 items-start">
        {/* Left column: progress + steps */}
        <aside className="w-48 hidden md:block">
          <div className="sticky top-24">
            <div className="mb-4 text-sm text-[var(--color-muted)]">Progreso</div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div className="h-3 bg-[var(--color-yellow)] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>

            <nav className="mt-6 space-y-2">
              {steps.map((s, idx) => (
                <div key={s.id} className={`px-3 py-2 rounded-lg ${idx === stepIndex ? 'bg-[var(--color-yellow)] text-black font-medium' : 'text-[var(--color-muted)] bg-transparent'}`}>
                  {s.title}
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main card */}
        <section className="flex-1">
          <div className="bg-white text-[var(--color-black-main)] rounded-2xl shadow-lg p-8" style={{ minHeight: 240 }}>
            <div className="mb-4">
              <div className="text-sm text-[var(--color-muted)]">Paso {stepIndex + 1} de {steps.length}</div>
              <h2 className="text-2xl font-semibold mt-1">{step.title}</h2>
            </div>

            <div className="mt-6 space-y-6">
              {(step.fields || []).map((f: Field) => {
                if (f.type === 'text' || f.type === 'email' || f.type === 'tel') {
                  return (
                    <div key={f.id}>
                      <label className="block text-base font-medium mb-2 text-[var(--color-black-secondary)]">{f.label}{f.required ? ' *' : ''}</label>
                      <input placeholder={f.placeholder ?? ''} className="border border-gray-200 rounded-xl p-3 w-full text-[var(--color-black-main)]" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)} />
                    </div>
                  );
                }

                if (f.type === 'textarea') {
                  return (
                    <div key={f.id}>
                      <label className="block text-base font-medium mb-2 text-[var(--color-black-secondary)]">{f.label}{f.required ? ' *' : ''}</label>
                      <textarea placeholder={f.placeholder ?? ''} className="border border-gray-200 rounded-xl p-3 w-full text-[var(--color-black-main)] min-h-[120px]" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)} />
                    </div>
                  );
                }

                if (f.type === 'single_select' && f.options) {
                  return (
                    <div key={f.id}>
                      <label className="block text-base font-medium mb-2 text-[var(--color-black-secondary)]">{f.label}{f.required ? ' *' : ''}</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {f.options.map((o: any) => (
                          <button key={o} type="button" onClick={() => setField(f.id, o)} className={`text-left p-3 rounded-xl border ${values[f.id] === o ? 'border-[var(--color-yellow)] bg-[var(--color-yellow)] text-black' : 'border-gray-200 bg-white text-[var(--color-black-secondary)]`}>{o}</button>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (f.type === 'file_upload') {
                  return (
                    <div key={f.id}>
                      <label className="block text-base font-medium mb-2 text-[var(--color-black-secondary)]">{f.label}</label>
                      <input type="file" className="w-full" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        // simple direct upload using supabase client
                        const mod = await import('@/lib/supabaseClient');
                        const supabase = mod.supabase;
                        const path = `submissions/${Date.now()}-${file.name}`;
                        const { data, error } = await supabase.storage.from('brand-intake-files').upload(path, file, { upsert: false });
                        if (error) {
                          alert('Error subiendo archivo: ' + error.message);
                          return;
                        }
                        // register file with server
                        await fetch('/api/register-file', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ submission_id: null, category: f.id === 'brand_assets' ? 'brand_assets' : 'materials', storage_path: data?.path, original_name: file.name, mime_type: file.type, size_bytes: file.size }) });
                        setField(f.id, data?.path);
                      }} />
                    </div>
                  );
                }

                // default fallback
                return (
                  <div key={f.id}>
                    <label className="block text-base font-medium mb-2 text-[var(--color-black-secondary)]">{f.label}</label>
                    <input className="border border-gray-200 rounded-xl p-3 w-full text-[var(--color-black-main)]" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)} />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center mt-8">
              <button onClick={handlePrev} disabled={stepIndex === 0} className="px-4 py-2 rounded-full border border-gray-200 text-[var(--color-black-secondary)] disabled:opacity-40">Volver</button>

              {stepIndex < steps.length - 1 ? (
                <button onClick={handleNext} className="px-6 py-3 rounded-full bg-[var(--color-yellow)] text-black font-medium">Siguiente</button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} className="px-6 py-3 rounded-full bg-[var(--color-black-main)] text-white font-medium">{submitting ? 'Enviando...' : 'Enviar'}</button>
              )}
            </div>
          </div>

          {submissionResult && <pre className="mt-4 bg-gray-50 p-3 rounded">{JSON.stringify(submissionResult, null, 2)}</pre>}
        </section>
      </div>
    </div>
  );
}
