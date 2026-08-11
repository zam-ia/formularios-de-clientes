# 05 — Responsive y accesibilidad

## Breakpoints de referencia
No diseñar por dispositivo concreto; diseñar por contenido.

- `360–479`: móvil pequeño
- `480–767`: móvil
- `768–1023`: tablet
- `1024–1199`: laptop
- `1200–1439`: desktop
- `1440+`: desktop amplio

## Reglas mobile-first
1. Una sola columna por defecto.
2. Botones 100% cuando existan dos CTAs.
3. Cards de selección en una columna en <= 480.
4. En 600–767 se pueden usar 2 columnas solo para opciones muy cortas.
5. Textarea mínimo 120px.
6. Upload debe aceptar cámara/galería desde móvil cuando el navegador lo permita.
7. CTA inferior debe respetar `env(safe-area-inset-bottom)`.

## Teclado
Todo el formulario debe completarse sin mouse.
- Tab order natural.
- Enter no debe enviar todo el formulario antes del último paso.
- Space/Enter seleccionan cards accesibles.
- Back button nunca borra información.

## Screen readers
- `fieldset` + `legend` para grupos.
- `aria-describedby` para ayudas/errores.
- `aria-live="polite"` para mensajes de validación y upload.
- barra de progreso con `role="progressbar"`.

## Contraste
- Negro sobre amarillo: recomendado para CTA.
- Negro sobre marfil: base de lectura.
- No usar amarillo como texto pequeño sobre blanco.

## Tamaños
- body mínimo 16px en móvil.
- helper 13–14px.
- hit target mínimo 44x44px.
- no inputs de 12px.

## Estados
Todo control debe tener:
- default;
- hover;
- focus-visible;
- selected;
- disabled;
- error;
- success cuando aplique.

## Errores
Mal:
“Campo inválido.”

Bien:
“Escribe un número de WhatsApp válido, por ejemplo +51 987 088 359.”

No limpiar el campo tras error.

## Motion
- duraciones 160–240ms;
- no usar parallax;
- no animar fondos continuamente;
- si `prefers-reduced-motion: reduce`, eliminar transiciones no esenciales.

## Zoom
La app debe funcionar al 200% sin cortar contenido ni exigir scroll horizontal.

## Upload accesible
Mostrar:
- nombre de archivo;
- tamaño;
- progreso;
- estado;
- botón eliminar/reintentar.

## QA de pantallas
Probar como mínimo:
- 360x800
- 390x844
- 430x932
- 768x1024
- 1024x768
- 1280x800
- 1440x900
- 1920x1080
