# 13 — Uso de avatar

El paquete incluye dos hojas de avatar originales:
- `avatar-female-grid.png`
- `avatar-male-grid.png`

Cada hoja contiene 6 expresiones/poses en una matriz 3x2.

## Recomendación
No exportar 6 imágenes nuevas en la primera implementación.
Usar la hoja como sprite visual mediante un contenedor con:
- `overflow: hidden`;
- imagen escalada;
- `object-position` o `transform` para mostrar la celda deseada.

Así el developer puede cambiar expresión sin duplicar assets.

## Mapeo conceptual
### Celda 1
Amable / manos al pecho
Uso: bienvenida o trust.

### Celda 2
Thumbs up
Uso: paso completado.

### Celda 3
Preocupado/triste
No usar para errores de validación. Puede sentirse punitivo.

### Celda 4
Pensando
Uso: preguntas de marca/cliente/competencia.

### Celda 5
Celebración
Uso: resumen o pantalla final.

### Celda 6
Enojo
Evitar en onboarding.

## Reglas
- máximo 1 avatar visible por pantalla;
- en móvil: 72–120px;
- en desktop: 220–340px en bienvenida; 72–100px en microcoach;
- no bloquear el CTA;
- `alt=""` si es decorativo;
- si transmite información, usar alt funcional breve.

## Selección
Exponer una constante:
```ts
const AVATAR_VARIANT = "female" // "male" | "none"
```

La v1 puede usar uno solo para consistencia.
