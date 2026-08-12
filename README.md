# Radiografía de Marca — Crisdal Agency

La aplicación lista para desplegar se encuentra en [`web/`](web/README.md). En Vercel selecciona `web` como Root Directory.
## Paquete de especificación funcional, UX/UI y técnica — v1.0

Este ZIP es un handoff para desarrollo. Define cómo construir una mini landing/formulario multi-paso de onboarding para clientes nuevos de Crisdal Agency.

### Objetivo
Recoger, antes de iniciar un trabajo, la información mínima y realmente útil para:
- comprender el negocio y su contexto;
- definir tono, público, oferta y CTA;
- evitar reuniones repetitivas;
- disminuir retrabajos;
- dejar un historial estructurado del cliente;
- preparar copy, diseño, video, catálogo, landing o campaña con mejor contexto.

### Decisión de producto
No se recomienda mostrar 29 preguntas como un formulario largo.
La v1 se organiza en **7 pasos visibles + 1 resumen final**, con lógica condicional. El cliente percibe una conversación guiada, no una auditoría interminable.

### Arquitectura recomendada
- Frontend/full-stack: Next.js + TypeScript.
- Hosting: Vercel.
- Repositorio: GitHub.
- Base de datos: Supabase Postgres.
- Archivos: Supabase Storage, bucket privado.
- Notificación por correo: Resend o proveedor transaccional equivalente.
- WhatsApp: enlace `wa.me` con mensaje prellenado después del envío.
- Validación: Zod.
- UI: CSS/Tailwind o CSS Modules; evitar dependencias pesadas innecesarias.

### Destinos configurados
- Correo de notificación: `crisdalagency@gmail.com`
- WhatsApp de destino: `51987088359`

### Marca aplicada
Tokens tomados del sistema digital vigente de Crisdal:
- Negro principal: `#080807`
- Negro secundario: `#11100E`
- Amarillo: `#FFB800`
- Amarillo secundario: `#F29F05`
- Marfil: `#FFFAF0`
- Papel: `#EEE4D2`
- Muted: `#BCB5A8`
- Tipografía de cuerpo: Poppins
- Display: Oswald

### Principio de experiencia
**“Crecer con orden” debe sentirse en el formulario.**
Cada pantalla debe verse limpia, clara y calmada. Una sola decisión principal por bloque.

### Archivos incluidos
- `MASTER_SPEC.md`: documento principal.
- `docs/01_PRODUCT_STRATEGY.md`: alcance y decisiones de producto.
- `docs/02_UX_FLOW.md`: recorrido detallado.
- `docs/03_FORM_CONTENT.md`: preguntas, textos y lógica condicional.
- `docs/04_UI_DESIGN_SYSTEM.md`: UI, componentes y estilo Apple-like.
- `docs/05_RESPONSIVE_ACCESSIBILITY.md`: responsive y accesibilidad.
- `docs/06_TECH_ARCHITECTURE.md`: arquitectura técnica.
- `docs/07_API_INTEGRATIONS.md`: API, email, WhatsApp y archivos.
- `docs/08_SECURITY_PRIVACY.md`: privacidad, seguridad y anti-spam.
- `docs/09_ANALYTICS.md`: eventos de medición.
- `docs/10_DEPLOYMENT.md`: GitHub + Vercel + Supabase.
- `docs/11_QA_ACCEPTANCE.md`: checklist y criterios de aceptación.
- `docs/12_COPY_EMAIL_WHATSAPP.md`: mensajes de sistema.
- `docs/13_AVATAR_USAGE.md`: uso de las hojas de avatar adjuntas.
- `config/form-schema.json`: esquema funcional del formulario.
- `config/design-tokens.css`: tokens visuales.
- `config/.env.example`: variables de entorno.
- `config/supabase-schema.sql`: modelo de base de datos inicial.
- `assets/`: hojas de avatar aportadas por el cliente.

### Prioridad de desarrollo
1. Flujo multi-paso y validación.
2. Persistencia en Supabase.
3. Carga privada de archivos.
4. Correo de notificación.
5. Pantalla de éxito + WhatsApp.
6. Analítica.
7. Refinamiento de microinteracciones.

### No incluido en v1
- Panel administrativo propio.
- Login de clientes.
- IA generativa.
- Envío automático por WhatsApp API.
- Sincronización bidireccional con Google Sheets.
- CRM.
Estos pueden agregarse después sin rehacer la estructura principal.
