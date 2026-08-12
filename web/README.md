# Radiografía de Marca — Crisdal Agency

Formulario responsive de onboarding construido con Next.js 16, Supabase Storage/Database y notificaciones por Resend o Gmail SMTP.

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

La clave `SUPABASE_SERVICE_ROLE_KEY` solo se usa en rutas del servidor. Nunca debe llevar el prefijo `NEXT_PUBLIC_`.

## Correo

La app selecciona automáticamente el proveedor disponible:

- Resend: `RESEND_API_KEY` + `RESEND_FROM` (dominio verificado).
- Gmail SMTP: `SMTP_USER` + `SMTP_PASS` (contraseña de aplicación).

El destinatario final se define en `NOTIFY_EMAIL` y por defecto es `crisdalagency@gmail.com`.

## Vercel

Al importar el repositorio, define **Root Directory** como `web`. Copia las variables de `.env.example` en los entornos Production y Preview. Después ejecuta un envío `TEST CRISDAL QA` y confirma:

- fila en `onboarding_submissions`;
- archivo privado asociado en `onboarding_files`;
- correo recibido;
- enlace de WhatsApp correcto.

## Comprobaciones

```bash
npm run lint
npm run build
```
