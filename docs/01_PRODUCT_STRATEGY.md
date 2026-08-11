# 01 — Estrategia de producto

## 1. Problema a resolver
El onboarding tradicional mezcla preguntas de marca, campaña, diseño y operación en un único formulario largo. Eso genera abandono, respuestas poco pensadas y retrabajo.

La Radiografía de Marca debe funcionar como una **conversación diagnóstica breve** que:
1. recoge contexto reutilizable;
2. muestra al cliente qué aspectos importan para construir su comunicación;
3. entrega a Crisdal un perfil estructurado;
4. adapta el resto del formulario según el servicio contratado.

## 2. Usuario principal
Dueño, encargado comercial o responsable de marketing de un negocio local o empresa de servicios.

Sectores previstos:
- Salud / clínica / consultorio
- Belleza / estética / bienestar
- Educación / capacitación
- Restaurante / pollería / gastronomía
- Retail / tienda
- Servicios profesionales
- Otro

## 3. Job to be done
“Ya decidí trabajar con Crisdal. Quiero explicar mi negocio sin tener una reunión eterna, sentir que entendieron lo que necesito y dejar todo listo para que empiecen.”

## 4. Métricas de éxito de la landing
- Inicio de formulario / visitas.
- Finalización / formularios iniciados.
- Tiempo medio de finalización.
- Abandono por paso.
- Errores de validación por campo.
- Uso de carga de archivos.
- Clic en WhatsApp tras envío.
- Porcentaje de formularios con objetivo claro y producto estrella definido.

## 5. Meta UX
Tiempo objetivo percibido: **6–8 minutos**.
No mostrar “29 preguntas”.
Mostrar: **Paso 1 de 7**, **Paso 2 de 7**, etc.

## 6. Recomendación estructural
### Capa A — Radiografía de Marca
Se llena una sola vez por cliente nuevo.

### Capa B — Brief de proyecto
En una futura v1.1, cada nuevo trabajo usa solo preguntas específicas del entregable:
- flyer/diseño;
- reel/video;
- catálogo/brochure;
- landing/web;
- campaña ads;
- branding.

La v1 ya pregunta “¿Qué vamos a trabajar primero?” para adaptar algunas preguntas sin crear todavía un segundo sistema.

## 7. Principios de UX
- Una intención principal por pantalla.
- Máximo 4–5 controles visibles por paso.
- Campos abiertos solo cuando aportan criterio real.
- Opciones visuales en tarjetas para preguntas de elección.
- Preguntas condicionales no ocupan espacio si no aplican.
- Autosave local.
- Volver atrás sin perder respuestas.
- Resumen antes de enviar.
- Mensajes de ayuda cortos y concretos.
- Nunca pedir información que Crisdal no vaya a usar.

## 8. Lo que debe sentir el cliente
1. “Esto está hecho para entender mi negocio.”
2. “No me están haciendo perder tiempo.”
3. “Ahora tengo más claro qué quiero.”
4. “Crisdal trabaja con método, no improvisa.”

## 9. Naming interno
Producto: `Brand X-Ray / Radiografía de Marca`
Ruta sugerida: `/radiografia`
Versión de formulario: `1.0`
Estado de envío: `pending | submitted | reviewed | archived`
