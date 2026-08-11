# 06 — Arquitectura técnica

## Stack recomendado
### Frontend + backend liviano
Next.js + TypeScript.

Motivo:
- una sola base de código;
- rutas API/server actions;
- despliegue sencillo en Vercel;
- SEO/meta aunque esta página se configure `noindex`;
- buena integración con Supabase y proveedores de email.

## Hosting
Vercel.

## Código
GitHub, repositorio privado recomendado.

## Datos
Supabase Postgres.

## Archivos
Supabase Storage, bucket privado:
`brand-intake-files`

## Email
Proveedor transaccional:
Resend recomendado.

Destino:
`crisdalagency@gmail.com`

## WhatsApp
Número:
`51987088359`

V1:
enlace `https://wa.me/<numero>?text=<mensaje-codificado>`

Importante:
un enlace wa.me abre WhatsApp con el mensaje preparado; el usuario debe confirmar el envío.
El envío automático requiere una integración oficial de WhatsApp Business Platform/API y se deja fuera de la v1.

---

# Arquitectura lógica

Browser
→ Next.js UI
→ `/api/onboarding/init`
→ Supabase DB crea submission `pending`
→ Browser solicita URL de upload
→ Supabase Storage recibe archivos directamente
→ `/api/onboarding/complete`
→ valida
→ marca `submitted`
→ envía email
→ devuelve `submission_code` + `whatsapp_url`
→ pantalla de éxito

## Por qué los archivos no deben pasar por la Function de Vercel
El formulario permite archivos de hasta 20 MB.
El archivo debe subir **directamente del navegador a Storage** mediante URL/token firmado o upload resumible.
La Function recibe JSON y metadata, no el binario completo.

---

# Estructura sugerida de proyecto

```text
app/
  layout.tsx
  page.tsx
  gracias/
    page.tsx
  api/
    onboarding/
      init/
        route.ts
      complete/
        route.ts
    upload-url/
      route.ts

components/
  onboarding/
    OnboardingShell.tsx
    ProgressHeader.tsx
    StepBusiness.tsx
    StepBrand.tsx
    StepGoal.tsx
    StepAudience.tsx
    StepOffer.tsx
    StepHistory.tsx
    StepContact.tsx
    ReviewScreen.tsx
    SuccessScreen.tsx
  ui/
    Button.tsx
    ChoiceCard.tsx
    Field.tsx
    FileUploader.tsx
    AvatarCoach.tsx

lib/
  validation/
    onboarding.ts
  supabase/
    server.ts
  email/
    sendSubmission.ts
  whatsapp/
    buildWhatsAppUrl.ts
  analytics/
    events.ts
  draft/
    localDraft.ts

public/
  assets/
    avatar-female-grid.png
    avatar-male-grid.png

styles/
  globals.css
  tokens.css
```

---

# Estado del formulario

```ts
type OnboardingState = {
  formVersion: "1.0";
  draftId: string;
  step: number;
  answers: Record<string, unknown>;
  uploads: UploadedFileMeta[];
  startedAt: string;
  updatedAt: string;
};
```

Usar un único store local (React state + reducer o librería mínima).
No introducir Redux para esta v1.

---

# Validación
Compartir schema Zod entre:
- frontend;
- endpoint final.

El backend es la fuente de verdad.
Nunca confiar solo en required del navegador.

---

# Draft local
Clave:
`crisdal:brand-xray:v1`

Contenido:
JSON sin archivos binarios.

Al enviar con éxito:
eliminar draft.

---

# SEO / descubrimiento
Esta landing es de onboarding, no de captación pública.

Configurar:
```html
<meta name="robots" content="noindex,nofollow">
```

Opcional:
ruta poco promocionada:
`/radiografia`

No bloquear con contraseña en v1 si se quiere facilidad de acceso desde WhatsApp.

---

# IDs
`submission_id`: UUID interno.
`submission_code`: legible para cliente.

Formato:
`RM-26-7F3A2C`

No exponer UUID como dato principal en WhatsApp.

---

# Fechas
Guardar en UTC en DB.
Mostrar en zona local del negocio/interfaz.

---

# UTM
Capturar si existen:
- utm_source
- utm_medium
- utm_campaign
- utm_content
- utm_term

También:
- referrer
- landing_path

No enviar PII a herramientas de analítica.
