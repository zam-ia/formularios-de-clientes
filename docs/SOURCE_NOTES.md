# Notas de fuentes y decisiones

Este handoff usa:
- la estructura de preguntas proporcionada para “Radiografía de Marca”;
- el sistema visual digital previo de Crisdal Agency;
- las hojas de avatar adjuntas por el usuario;
- prácticas actuales de Vercel/Supabase para separar uploads grandes de Functions;
- una arquitectura orientada a empezar con costos mínimos y poder escalar.

## Decisiones importantes
1. El formulario se redujo de 11 secciones percibidas a 7 pasos visibles.
2. Se mantuvo el contenido estratégico de las preguntas originales y se añadieron:
   - servicio inicial;
   - CTA principal;
   - objeción;
   - restricciones de marca.
3. Presupuesto y experiencia previa son condicionales.
4. Supabase es la fuente de verdad; Google Sheets queda opcional.
5. WhatsApp V1 usa deeplink con mensaje prellenado.
6. Los archivos son privados y no pasan por el POST principal.
7. Los assets de avatar se entregan sin modificación.
