# 11 — QA y criterios de aceptación

## Funcional
- [ ] Puede empezar.
- [ ] Puede volver atrás.
- [ ] No pierde respuestas.
- [ ] No avanza si falta un required visible.
- [ ] Preguntas condicionales funcionan.
- [ ] Progreso no retrocede.
- [ ] Resumen coincide con respuestas.
- [ ] Doble clic no duplica submission.
- [ ] Éxito devuelve código.
- [ ] WhatsApp abre número correcto.
- [ ] Email llega a `crisdalagency@gmail.com`.

## Upload
- [ ] JPG.
- [ ] PNG.
- [ ] WEBP.
- [ ] PDF.
- [ ] MP4.
- [ ] Rechaza MIME no permitido.
- [ ] Rechaza > límite.
- [ ] Muestra progreso.
- [ ] Reintenta.
- [ ] Elimina archivo.
- [ ] No expone bucket público.
- [ ] 20MB no pasan por el body de la Function.

## Validación
- [ ] teléfono;
- [ ] email;
- [ ] 3 palabras;
- [ ] máximo 2 servicios iniciales;
- [ ] consentimiento;
- [ ] fecha;
- [ ] caracteres máximos.

## Responsive
Probar:
- [ ] 360x800
- [ ] 390x844
- [ ] 430x932
- [ ] 768x1024
- [ ] 1024x768
- [ ] 1280x800
- [ ] 1440x900
- [ ] 1920x1080

## Navegadores
- [ ] Chrome Android
- [ ] Safari iPhone
- [ ] Safari macOS
- [ ] Chrome Desktop
- [ ] Edge Desktop
- [ ] Firefox Desktop

## Accesibilidad
- [ ] tab completo;
- [ ] focus visible;
- [ ] labels;
- [ ] fieldsets;
- [ ] aria-live en errores;
- [ ] contraste;
- [ ] 200% zoom;
- [ ] reduced motion.

## Performance
Objetivo de percepción:
- primera pantalla rápida;
- avatar optimizado;
- no cargar videos;
- lazy load de assets no esenciales;
- evitar librerías grandes.

## Seguridad
- [ ] service role no aparece en bundle.
- [ ] bucket privado.
- [ ] RLS activo.
- [ ] no hay PII en analytics.
- [ ] no hay PII en logs.
- [ ] honeypot/anti-spam activo.
- [ ] rutas API validan payload.

## Criterio de aceptación final
La v1 está lista cuando un cliente puede completar todo desde un teléfono con una mano, adjuntar material, recibir confirmación, abrir WhatsApp y Crisdal puede localizar la submission en Supabase y recibir el resumen por correo sin intervención manual.
