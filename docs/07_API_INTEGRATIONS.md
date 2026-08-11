# 07 — API e integraciones

## 1. POST /api/onboarding/init

### Propósito
Crear una submission `pending` y obtener un identificador antes de cargar archivos.

### Request
```json
{
  "draftId": "uuid-generado-en-cliente",
  "formVersion": "1.0"
}
```

### Response
```json
{
  "submissionId": "uuid",
  "submissionCode": "RM-26-ABC123"
}
```

### Reglas
- idempotente por `draftId`;
- no duplicar si el usuario reintenta;
- aplicar control anti-spam.

---

## 2. POST /api/upload-url

### Propósito
Autorizar un upload privado sin enviar el archivo a la Function.

### Request
```json
{
  "submissionId": "uuid",
  "category": "brand_assets",
  "fileName": "logo.png",
  "mimeType": "image/png",
  "size": 234567
}
```

### Validaciones
MIME permitidos:
- image/jpeg
- image/png
- image/webp
- application/pdf
- video/mp4
- video/quicktime opcional

Límites recomendados:
### Identidad / logo
- máximo 3 archivos;
- 10 MB por archivo.

### Material de contenido
- máximo 4 archivos;
- 20 MB por archivo;
- máximo 60 MB total por submission.

Videos mayores:
pedir link de Drive/Dropbox en lugar de upload.

### Response
```json
{
  "path": "intake/<submissionId>/<uuid>.png",
  "signedUpload": {
    "url": "...",
    "token": "..."
  }
}
```

---

## 3. Upload directo
El navegador usa el token firmado para subir directamente a Supabase Storage.

Para archivos grandes o red móvil inestable:
usar subida resumible/TUS.

Estados UI:
`queued → uploading → uploaded | error`

---

## 4. POST /api/onboarding/complete

### Request
```json
{
  "submissionId": "uuid",
  "formVersion": "1.0",
  "answers": {},
  "uploads": [
    {
      "path": "intake/...",
      "category": "brand_assets",
      "originalName": "logo.png",
      "size": 234567,
      "mimeType": "image/png"
    }
  ],
  "tracking": {
    "utm_source": null,
    "utm_medium": null,
    "utm_campaign": null,
    "utm_content": null,
    "utm_term": null,
    "referrer": null
  },
  "consent": true
}
```

### Backend
1. validar submission pendiente;
2. validar schema;
3. validar paths;
4. actualizar fila;
5. insertar metadata de archivos;
6. marcar `submitted_at`;
7. enviar correo;
8. devolver URL de WhatsApp.

### Response
```json
{
  "ok": true,
  "submissionCode": "RM-26-ABC123",
  "whatsappUrl": "https://wa.me/51987088359?text=..."
}
```

---

# Correo

## Destino
`crisdalagency@gmail.com`

## Asunto
`Nueva Radiografía · {business_name} · {primary_goal}`

## Contenido
- código;
- fecha;
- contacto;
- WhatsApp clickeable;
- servicio inicial;
- objetivo;
- resumen de marca;
- cliente ideal;
- producto estrella;
- precio;
- diferenciador;
- experiencia previa;
- presupuesto si aplica;
- fecha objetivo;
- número de archivos;
- UTM si existe.

No adjuntar archivos pesados.
Usar links firmados temporales si se desea.

---

# WhatsApp

## Pantalla final
Botón:
`Escribir a Crisdal por WhatsApp`

Mensaje prellenado:
```text
Hola, acabo de completar mi Radiografía de Marca.

Negocio: {business_name}
Contacto: {contact_name}
Prioridad: {primary_goal}
Código: {submission_code}

Quedo atento/a a los siguientes pasos.
```

No incluir toda la radiografía en WhatsApp.
La base de datos ya contiene el detalle.

---

# Google Sheets
No es necesario para v1 porque Supabase ya es la fuente de verdad.

Fase posterior:
- exportación CSV;
- integración con Google Sheets;
- automatización a CRM.

No convertir Google Sheets en la base primaria si ya existe Supabase.

---

# Fallos

## Si DB guarda pero email falla
No mostrar error de envío al cliente.
Guardar:
`email_status = failed`
y registrar el error para reintento.

## Si upload falla
Permitir reintentar solo el archivo.
No perder las respuestas.

## Si submit falla
Mantener draft y mostrar:
“No pudimos enviar tu radiografía todavía. Tus respuestas siguen guardadas en este dispositivo.”

## Idempotencia
`complete` no debe crear submissions duplicadas si el cliente toca dos veces.
