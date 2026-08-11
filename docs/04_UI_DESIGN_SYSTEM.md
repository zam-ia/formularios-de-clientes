# 04 — Sistema UI

## Dirección visual
Referencia: producto digital premium, limpio y calmado, con lenguaje visual “Apple-like”, pero conservando la identidad Crisdal.

No copiar interfaces de Apple literalmente.
Usar:
- espacios amplios;
- tipografía legible;
- tarjetas suaves;
- profundidad mínima;
- iconos lineales;
- microanimaciones discretas;
- foco en una sola tarea.

## Paleta
### Base
- Ink / black: `#080807`
- Dark surface: `#11100E`
- Accent yellow: `#FFB800`
- Accent warm: `#F29F05`
- Warm white: `#FFFAF0`
- Paper: `#EEE4D2`
- Muted: `#BCB5A8`

### Superficies sugeridas
- App background light: `#F7F7F5`
- Card: `#FFFFFF`
- Border: `rgba(8,8,7,.08)`
- Focus ring: `rgba(255,184,0,.28)`
- Error: usar rojo de sistema accesible; no convertir el amarillo en estado de error.
- Success: verde solo en la pantalla final.

## Tipografía
- UI/body: Poppins.
- Headings/display: Oswald con moderación.
- Fallback: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif.

Regla:
No usar Oswald en labels, inputs o bloques de texto largos.

## Layout

### Desktop >= 1200
Dos columnas:
- 38–42%: contexto, título, microcopy y avatar.
- 58–62%: tarjeta del formulario.

Form container:
- ancho máximo 720–760px;
- min-height visual estable para evitar saltos;
- card radius 28–32px;
- padding 32–40px.

### Laptop 1024–1199
Mantener dos columnas si hay espacio.
Reducir avatar y padding.

### Tablet 768–1023
Una columna.
Título compacto arriba.
Formulario centrado con max-width 680px.
Avatar pequeño como asistente lateral o escondido si compite con el contenido.

### Mobile <= 767
Una columna.
Padding lateral 16–20px.
Card puede perder sombra y mezclarse con el fondo.
CTA sticky inferior dentro de safe area.
Botones de opción ocupan 100%.

### Mobile pequeño <= 390
- labels 14–15px;
- body 15–16px;
- headings 30–36px;
- min tap target 44px;
- no grids de más de 1 columna.

## Barra de progreso
Posición:
sticky dentro del header del formulario.

Elementos:
- `Paso 3 de 7`
- barra de 4–6px
- título del paso

Animación:
180–240 ms ease-out.
Respetar `prefers-reduced-motion`.

## Componente pregunta
Cada pregunta contiene:
1. número opcional pequeño;
2. label principal;
3. helper text;
4. control;
5. error inline.

Espaciado entre preguntas: 24–32px.

## Inputs
Altura: 52–56px.
Radius: 14–16px.
Borde base: 1px.
Focus: borde amarillo + ring suave.
Placeholder: gris, nunca como sustituto del label.

## Cards de opción
Ejemplo: tono de marca.
- icono lineal 20–22px;
- título 14–16px;
- contorno neutro;
- selected: borde amarillo + fondo amarillo muy suave + check.

## Botones
Primario:
- fondo `#080807` en UI clara;
- texto `#FFFAF0`;
- hover con sombra discreta.
Alternativa en pantallas oscuras:
- fondo `#FFB800`;
- texto `#080807`.

Texto:
- “Continuar”
- “Enviar a Crisdal”
Evitar “Submit”.

## Iconografía
Usar iconografía lineal premium, estilo sistema:
- Building2
- Palette
- Target
- Users
- Sparkles
- Image
- Clock
- MessageCircle
- CheckCircle2
- ChevronRight
- ArrowLeft
- UploadCloud

Implementación sugerida:
Lucide Icons o un set open-source equivalente.
Stroke: 1.75–2px.
No mezclar múltiples estilos de iconos.

## Avatar
El avatar acompaña, no dirige.
Usos:
- bienvenida;
- microcoach de cada 2–3 pasos;
- finalización.

No mostrarlo en todos los campos.
No usar una expresión de enojo o tristeza en validaciones.

## Microinteracciones
- selección de card: scale 0.99 → 1.
- validación correcta: check suave.
- cambio de paso: fade + translateY 6px.
- upload: progreso real.
- submit: botón cambia a “Enviando…” y se bloquea.

## Glassmorphism
Solo en:
- header sticky;
- tarjeta de progreso;
- badge de tiempo.
No aplicar blur fuerte a toda la página.

## Pantalla de resumen
Debe parecer un “diagnóstico preliminar”, no otra lista de campos.
Usar 5–7 tarjetas pequeñas con icono + dato clave.

Ejemplo:
`OBJETIVO`
Más citas y reservas

`PRODUCTO ESTRELLA`
Limpieza facial premium · S/120

`CLIENTE`
Mujeres 25–40 · El Tambo

## Tono visual
Premium no significa lujoso.
La marca debe sentirse:
1. cercana;
2. estratégica;
3. innovadora;
4. tecnológica;
5. premium;
sin convertirse en una interfaz fría.
