# Radiografía de Marca — Crisdal Agency

Ecosistema responsive de Crisdal construido con Next.js 16, Supabase Storage/Database y notificaciones por Resend o Gmail SMTP. Incluye el formulario de onboarding, un brochure multimedia público y un panel privado para gestionar contenido, enlaces y el QR de impresión.

## Desarrollo

1. Copia `.env.example` como `.env.local` y completa las credenciales.
2. Ejecuta `npm install`.
3. Ejecuta `npm run dev`.
4. Abre `http://localhost:3000`.

## Preparar Supabase

1. Ejecuta `../config/supabase-schema.sql` en el SQL Editor.
2. En Storage crea un bucket **privado** llamado `brand-intake-files`.
3. Configura los MIME permitidos: JPG, PNG, WEBP, PDF y MP4.
4. Configura un límite de 20 MB por archivo.

El panel crea automáticamente un segundo bucket público, `crisdal-brochure-assets`, la primera vez que se guarda contenido. Allí se almacenan imágenes, videos, PDF y `content/brochure.json`.

La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en rutas del servidor. Nunca debe llevar el prefijo `NEXT_PUBLIC_`.

## Correo

La app selecciona automáticamente el proveedor disponible:

- Resend: `RESEND_API_KEY` + `RESEND_FROM` (dominio verificado).
- Gmail SMTP: `SMTP_USER` + `SMTP_PASS` (contraseña de aplicación).

El destinatario final se define en `NOTIFY_EMAIL` y por defecto es `crisdalagency@gmail.com`.

## Panel y brochure

- `/panel`: acceso privado mediante `ADMIN_USERNAME` y `ADMIN_PASSWORD`.
- `/brochure`: landing multimedia pública y responsive.
- `/api/qr`: ticket QR descargable en SVG o PNG, con el isotipo de Crisdal.

Define `ADMIN_PASSWORD` con al menos 12 caracteres y preferentemente `ADMIN_SESSION_SECRET` con un valor aleatorio de al menos 32 caracteres. Si este último no existe, el servidor usa `SUPABASE_SERVICE_ROLE_KEY` como secreto de firma. La sesión se guarda en una cookie firmada, `HttpOnly`, `SameSite=Lax` y segura en producción. La URL o el parámetro `access=ok` no conceden acceso.

Desde el panel puedes editar textos y servicios, generar enlaces identificables por campaña, subir hasta 40 recursos y reordenar o eliminar la biblioteca. Las cargas grandes se envían directamente a Supabase mediante URLs firmadas, sin pasar por el límite de archivos de Vercel. El límite es de 15 MB por imagen, 30 MB por PDF y 50 MB por video.

## Vercel

Al importar el repositorio, define **Root Directory** como `web`. Copia las variables de `.env.example` en los entornos Production y Preview. `NEXT_PUBLIC_SITE_URL` debe contener la URL pública sin una barra final. Después ejecuta un envío `TEST CRISDAL QA` y confirma:

- fila en `onboarding_submissions`;
- archivo privado asociado en `onboarding_files`;
- correo recibido;
- enlace de WhatsApp correcto.
- acceso con usuario y contraseña a `/panel`;
- edición persistente del brochure;
- lectura y descarga del QR.

## Comprobaciones

```bash
npm run lint
npm run build
```
