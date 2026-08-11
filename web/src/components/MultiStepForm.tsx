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

  if (!schema) return <div>Cargando...</div>;
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{schema.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">Tiempo estimado: {schema.estimatedMinutes}</p>

      <div className="mb-4">
        <div className="flex items-center gap-2">
          {steps.map((s, idx) => (
            <div key={s.id} className={`px-3 py-1 rounded ${idx === stepIndex ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-700'}`}>
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-3">{step.title}</h2>

        <div className="space-y-4">
          {(step.fields || []).map((f: Field) => {
            if (f.type === 'text' || f.type === 'email' || f.type === 'tel') {
              return (
                <div key={f.id}>
                  <label className="block text-sm font-medium mb-1">{f.label}{f.required ? ' *' : ''}</label>
                  <input className="border p-2 w-full rounded" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)} />
                </div>
              );
            }
            if (f.type === 'textarea') {
              return (
                <div key={f.id}>
                  <label className="block text-sm font-medium mb-1">{f.label}{f.required ? ' *' : ''}</label>
                  <textarea className="border p-2 w-full rounded" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)} />
                </div>
              );
            }
            if (f.type === 'single_select' && f.options) {
              return (
                <div key={f.id}>
                  <label className="block text-sm font-medium mb-1">{f.label}{f.required ? ' *' : ''}</label>
                  <select className="border p-2 w-full rounded" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)}>
                    <option value="">Seleccionar</option>
                    {f.options.map((o: any) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            }
            if (f.type === 'file_upload') {
              return (
                <div key={f.id}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <input type="file" className="w-full" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    // simple direct upload using supabase client
                    const { supabase } = await import('@/lib/supabaseClient');
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
                <label className="block text-sm font-medium mb-1">{f.label}</label>
                <input className="border p-2 w-full rounded" value={values[f.id] ?? ''} onChange={(e) => setField(f.id, e.target.value)} />
              </div>
            );
          })}
        </div>

        <div className="flex justify-between mt-6">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={handlePrev} disabled={stepIndex === 0}>Volver</button>
          {stepIndex < steps.length - 1 ? (
            <button className="px-4 py-2 bg-yellow-500 text-black rounded" onClick={handleNext}>Siguiente</button>
          ) : (
            <button className="px-4 py-2 bg-black text-white rounded" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar'}</button>
          )}
        </div>
      </div>

      {submissionResult && <pre className="mt-4 bg-gray-100 p-3 rounded">{JSON.stringify(submissionResult, null, 2)}</pre>}
    </div>
  );
}
