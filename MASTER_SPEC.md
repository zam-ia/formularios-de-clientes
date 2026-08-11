# MASTER SPEC — Radiografía de Marca / Crisdal Agency

## Resumen ejecutivo
Construir una mini landing de onboarding, mobile-first, con formulario multi-paso y estética premium limpia.

El flujo debe hacer dos cosas al mismo tiempo:
1. capturar información;
2. ayudar al cliente a ordenar mentalmente su marca.

El producto no debe parecer Google Forms.
Debe sentirse como una herramienta propia de Crisdal.

## Objetivo de negocio
- menos reuniones de levantamiento;
- menos retrabajo;
- mejores briefs;
- historial de clientes;
- mejor base para copy y creativos;
- posibilidad futura de upsell y CRM.

## Entregable v1
- 1 landing `/radiografia`;
- 7 pasos;
- lógica condicional;
- autosave local;
- upload;
- resumen;
- Supabase;
- email;
- WhatsApp;
- analytics;
- responsive;
- accesibilidad;
- seguridad básica.

## No negociar
- mobile-first;
- barra de progreso;
- no formularios largos;
- no PII en analytics;
- bucket privado;
- archivos direct-to-storage;
- service role solo server-side;
- correo a `crisdalagency@gmail.com`;
- WhatsApp `51987088359`;
- no envío automático de WhatsApp en v1;
- estética Crisdal limpia: negro, amarillo, marfil, Poppins + Oswald;
- `noindex,nofollow`.

## UX
Pasos:
1. Tu negocio
2. Tu marca
3. Tu prioridad
4. Tu cliente
5. Tu oferta
6. Lo que ya probaste
7. Fechas y contacto
8. Resumen

## UI
Apple-like:
- mucha respiración;
- tarjetas;
- jerarquía simple;
- iconos lineales;
- blur discreto;
- transiciones suaves;
- fondos claros para formulario;
- pantallas oscuras solo para bienvenida/final o acentos.

## Arquitectura
Next.js → Vercel
Supabase → DB + Storage
Resend → email
wa.me → handoff a WhatsApp

## Flujo técnico
1. client inicia;
2. crea draft local;
3. `init` crea pending row;
4. uploads directos a Storage;
5. `complete` persiste answers;
6. email;
7. success;
8. WhatsApp.

## Archivos grandes
No enviar videos de 20MB dentro del POST del formulario.
Subir directo a Storage.

## QA final
La experiencia debe poder completarse en móvil sin zoom, sin pérdida de datos y sin depender de una reunión.

Revisar los documentos numerados para detalle de implementación.
