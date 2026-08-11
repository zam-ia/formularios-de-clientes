# 03 — Contenido del formulario y lógica condicional

## Reglas generales
- `required` solo en campos que Crisdal utilizará.
- Textareas: mostrar contador suave; no obligar a escribir párrafos largos.
- Máximo recomendado por respuesta abierta: 400–600 caracteres.
- Teléfono: normalizar a E.164.
- Links sociales: permitir varios links en un mismo textarea.
- Fechas: usar selector de fecha + alternativa “Aún no tengo fecha fija”.

---

## Paso 1 — Tu negocio

### Q01 — ¿Qué vamos a trabajar primero?
Tipo: cards, selección múltiple, máximo 2.
Obligatoria: sí.

Opciones:
- Diseño / flyer
- Video / reel
- Catálogo / brochure
- Landing / web
- Campaña publicitaria
- Branding / identidad
- Otro

Ayuda:
“Selecciona lo que quieres resolver primero. Después podremos ampliar el alcance.”

### Q02 — Nombre del negocio
Texto corto.
Placeholder: `Ej. Café Central`

### Q03 — ¿En qué rubro estás?
Cards/select.
- Salud / clínica / consultorio
- Belleza / estética / bienestar
- Educación / capacitación
- Restaurante / pollería / gastronomía
- Retail / tienda
- Servicios profesionales
- Otro

### Q04 — ¿Dónde atiendes principalmente?
Texto corto.
Placeholder: `Ej. El Tambo, Huancayo`

### Q05 — ¿Cuánto tiempo lleva funcionando?
- Menos de 1 año
- 1–3 años
- Más de 3 años

### Q06 — Redes sociales o web
Opcional.
Placeholder: `Pega Instagram, Facebook, TikTok o tu web`

---

## Paso 2 — Tu marca

### Q07 — Si tu negocio fuera una persona, ¿qué 3 palabras lo describirían?
Interfaz: chips + entrada libre.
Obligatoria.
Límite: exactamente 3 conceptos.

### Q08 — ¿Qué tan definida está hoy tu identidad?
- Tengo logo y colores listos
- Tengo logo, pero los colores/estilo aún no están claros
- Quiero ordenar o renovar mi identidad
- Empezamos desde cero

### Q09 — Comparte tu logo, colores o manual de marca
Condicional:
mostrar si Q08 != “Empezamos desde cero”.

Controles:
- Upload.
- Campo texto de colores.
- Link a Drive opcional.

### Q10 — ¿Cómo quieres que suene tu marca?
Cards.
- Cercana y familiar
- Profesional y clara
- Divertida y juvenil
- Elegante y exclusiva
- Directa y comercial
- Técnica pero fácil de entender

### Q11 — ¿Hay algo que NO quieres que hagamos o digamos?
Opcional.
Ejemplo: “No usar demasiados emojis”, “No comunicar como marca barata”.

---

## Paso 3 — Tu prioridad

### Q12 — ¿Qué necesitas conseguir primero?
- Más ventas directas
- Más citas / reservas
- Más consultas calificadas
- Más reconocimiento
- Recuperar clientes
- Mejorar imagen de marca
- Lanzar un producto/servicio
- Otro

### Q13 — Si en 4 semanas solo pudiéramos mejorar UNA cosa, ¿cuál sería?
Texto corto.
Ayuda: “Ej. recibir 20 consultas de personas realmente interesadas.”

### Q14 — Después de ver el trabajo, ¿qué debería hacer la persona?
- Escribir por WhatsApp
- Reservar / agendar
- Comprar
- Completar un formulario
- Visitar el local
- Seguir la cuenta
- Recordar la marca
- Otro

---

## Paso 4 — Tu cliente

### Q15 — Describe a tu cliente ideal
Textarea.
Prompt:
“Edad aproximada, zona, qué busca, qué valora y cómo suele decidir.”

### Q16 — ¿Qué problema importante le resuelves?
Textarea.

### Q17 — ¿Dónde suele encontrarte o informarse?
Multi-select:
- Facebook
- Instagram
- WhatsApp
- TikTok
- Google
- Recomendaciones
- Local físico
- No lo tengo claro

### Q18 — ¿Qué duda suele frenar la compra?
Opcional.
Ejemplos:
- precio
- confianza
- tiempo
- distancia
- no entiende el beneficio
- compara demasiado
- otro

---

## Paso 5 — Tu oferta

### Q19 — ¿Cuál es tu producto o servicio estrella?
Texto corto.

### Q20 — ¿Cuál es su precio promedio?
Texto corto.
No forzar formato monetario porque puede haber rangos.

### Q21 — ¿Por qué deberían elegirte a ti?
Textarea.
Prompt:
“Cuéntanos algo real: experiencia, rapidez, especialidad, garantía, método, ubicación, atención, resultado, etc.”

### Q22 — ¿Tienes una promoción u oferta vigente?
Opcional.
Texto corto.

### Q23 — Menciona 1–2 competidores directos
Opcional.

### Q24 — ¿Qué admiras o qué NO quieres copiar de cómo se promocionan?
Opcional.

---

## Paso 6 — Experiencia y recursos

### Q25 — ¿Ya invertiste en publicidad, influencers o agencia?
Sí / No.

### Q26 — ¿Qué resultado tuviste y qué no quieres que se repita?
Condición: Q25 = Sí.
Textarea.
Este campo debe tratarse como información estratégica prioritaria.

### Q27 — ¿Cuánto podrías destinar a pauta al mes, aparte del servicio?
Condicional.
Opciones:
- Menos de S/150
- S/150–300
- S/300–600
- Más de S/600
- Aún no sé
- No aplica por ahora

### Q28 — ¿Tienes fotos o videos propios que podamos usar?
- Sí, tengo material
- Tengo algo, pero falta completar
- No, hay que producir

### Q29 — Comparte tu material
Condición: Q28 != “No, hay que producir”.
Controles:
- upload;
- link a Drive/Dropbox;
- microcopy: “Si tus videos pesan mucho, comparte un link.”

---

## Paso 7 — Fechas y contacto

### Q30 — ¿Para cuándo necesitas el primer entregable?
Control híbrido:
- Fecha exacta
- Aún no tengo fecha fija

### Q31 — ¿Hay una fecha comercial importante?
Opcional.
Ejemplos:
“apertura, campaña, evento, aniversario, temporada”.

### Q32 — Persona de contacto
Texto corto.

### Q33 — WhatsApp
Teléfono.
Obligatorio.

### Q34 — Correo de contacto
Email.
Opcional.

### Q35 — Mejor horario para escribirte
- 9 am–12 pm
- 12 pm–3 pm
- 3 pm–6 pm
- 6 pm–9 pm
- Cualquiera

### Q36 — Consentimiento
Checkbox obligatorio:
“Autorizo a Crisdal Agency a usar esta información para evaluar y gestionar mi solicitud y contactarme por WhatsApp o correo.”

Debajo:
“No compartas contraseñas, datos bancarios ni información sensible que no sea necesaria para el proyecto.”

---

# Lógica condicional

## Marketing previo
Si Q25 = No:
ocultar Q26.

## Presupuesto
Mostrar Q27 si:
- Q01 contiene `Campaña publicitaria`;
- o Q01 contiene `Landing / web`;
- o Q12 es ventas, reservas, consultas calificadas o recuperar clientes.

## Identidad
Si Q08 = Empezamos desde cero:
Q09 se vuelve opcional/oculto y se reemplaza por:
“¿Hay colores o estilos que te gusten?” opcional.

## Material
Si Q28 = No, hay que producir:
ocultar upload de Q29.
Mostrar:
“Perfecto. Lo tendremos en cuenta para la propuesta de producción.”

## Urgencia
Si la fecha elegida está a menos de 72 horas:
mostrar aviso:
“Esta fecha requiere validación de disponibilidad antes de confirmar el inicio.”

No prometer entrega automática.

---

# Preguntas eliminadas o fusionadas respecto del formulario inicial
- “Ubicación” se convierte en “Dónde atiendes principalmente” para ser más natural.
- “Redes actuales” permanece opcional.
- “Objetivo” + “resultado de 4 semanas” se mantienen porque cumplen roles distintos.
- Competencia se vuelve opcional.
- Presupuesto se vuelve condicional.
- Se agrega `qué vamos a trabajar primero` porque permite adaptar el onboarding.
- Se agrega `CTA deseado` porque es crítico para cualquier pieza de conversión.
- Se agrega `qué NO hacer/decir` para reducir retrabajo.
- Se agrega `objeción principal` como insumo para copy.
