# 02 — UX Flow

## Vista 0 — Bienvenida
### Objetivo
Reducir ansiedad y explicar el valor antes de pedir datos.

### Copy
**Radiografía de Marca**
“Queremos entender tu negocio antes de diseñar, grabar o pautar.”

Texto:
“En unos minutos vamos a ordenar lo esencial de tu marca: qué vendes, a quién ayudas, qué quieres lograr y qué materiales ya tienes. No hay respuestas perfectas.”

Meta:
“Tiempo estimado: 6–8 min · Puedes volver atrás sin perder lo avanzado.”

CTA:
**Empezar mi radiografía**

Avatar:
Una expresión amable/neutra. No debe ocupar más atención que el título.

---

## Paso 1 — Tu negocio
### Pregunta mental que responde
“¿Qué negocio estamos entendiendo y qué vamos a trabajar primero?”

Campos:
- Qué vamos a trabajar primero.
- Nombre del negocio.
- Rubro/sector.
- Distrito/ciudad.
- Antigüedad.
- Redes sociales actuales (opcional).

Microcopy:
“Contexto antes que diseño.”

Al completar:
“Perfecto. Ya tenemos el punto de partida.”

---

## Paso 2 — La personalidad de tu marca
### Pregunta mental
“¿Cómo debe sentirse esta marca?”

Campos:
- 3 palabras que describen el negocio.
- Estado de logo/colores.
- Archivos de identidad o colores escritos.
- Tono deseado.
- Algo que NO debemos hacer/decir (opcional).

Microcopy:
“Tu identidad no es solo el logo: también es cómo quieres que te recuerden.”

---

## Paso 3 — Tu prioridad
### Pregunta mental
“¿Qué debería conseguir el trabajo?”

Campos:
- Objetivo principal.
- Resultado único de las próximas 4 semanas.
- Acción principal que debe realizar el público después de ver la pieza/campaña.

Microcopy:
“Una prioridad clara evita piezas bonitas que no ayudan al negocio.”

Insight al completar:
“Este será el criterio principal para decidir el mensaje y el CTA.”

---

## Paso 4 — Tu cliente
### Pregunta mental
“¿Para quién estamos diseñando?”

Campos:
- Cliente ideal.
- Problema principal que resuelves.
- Canales donde suele estar.
- Duda/objeción que más frena la compra (opcional).

Microcopy:
“Una marca que intenta hablarle a todos suele conectar con nadie.”

---

## Paso 5 — Tu oferta
### Pregunta mental
“¿Qué vendemos primero y por qué deberían elegirte?”

Campos:
- Producto/servicio estrella.
- Precio promedio.
- Diferenciador.
- Promoción vigente (opcional).
- 1–2 competidores.
- Qué admiras/no te gusta de su promoción (opcional).

Microcopy:
“La creatividad necesita una oferta real que defender.”

---

## Paso 6 — Lo que ya tienes y lo que ya probaste
### Campos
- ¿Invertiste antes en publicidad/influencers/agencia?
- Si Sí: qué pasó y qué no quieres repetir.
- Presupuesto mensual de pauta (condicional).
- ¿Tienes fotos/videos propios?
- Carga de materiales o link de Drive (condicional).

Microcopy:
“No empezamos de cero si ya existe algo útil.”

Condicional de presupuesto:
Mostrar si:
- servicio inicial incluye campaña/landing;
- o el objetivo es ventas, reservas, recuperar clientes o captación.

---

## Paso 7 — Fechas y contacto
Campos:
- Fecha objetivo.
- Fecha comercial importante (opcional).
- Nombre de contacto.
- WhatsApp.
- Email de contacto (opcional).
- Mejor horario.
- Consentimiento.

Microcopy:
“Último paso. Esto nos ayuda a organizar tiempos y comunicación.”

---

## Paso 8 — Tu radiografía, en una vista
No mostrar un formulario. Mostrar una **tarjeta-resumen**.

Bloques:
- Marca: nombre + 3 palabras.
- Prioridad: objetivo + resultado a 4 semanas.
- Cliente: resumen del cliente ideal.
- Oferta: producto estrella + precio.
- CTA: acción deseada.
- Material: listo / requiere producción.
- Fecha: objetivo.

Botones:
- **Enviar a Crisdal**
- Editar respuestas

Nota:
“Puedes corregir cualquier dato antes de enviarlo.”

---

## Pantalla final
Icono: check simple.
Avatar: celebración/confirmación.

Título:
**Radiografía recibida.**

Texto:
“Ya tenemos el contexto para empezar con más claridad. Revisaremos tus respuestas y te escribiremos por WhatsApp.”

SLA:
“En menos de 24 h” solo si Crisdal puede cumplirlo de forma consistente.

CTA principal:
**Escribir a Crisdal por WhatsApp**

CTA secundario:
**Guardar mi código**
Código visual: `RM-XXXXXX`

---

## Autosave
Guardar cada cambio en `localStorage` con:
- `formVersion`
- `draftId`
- `lastStep`
- `answers`
- `updatedAt`

No sincronizar borradores a servidor en v1 salvo que exista una razón operativa.

## Comportamiento al volver
Si existe un borrador:
“Encontramos una radiografía sin terminar.”
- Continuar
- Empezar de nuevo

## Progreso
Usar progreso por paso, no por número bruto de preguntas.
Ejemplo:
`Paso 4 de 7`
Barra visual: 57%.

El progreso nunca debe disminuir al aparecer una pregunta condicional.
