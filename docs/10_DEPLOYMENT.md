# 10 — Despliegue: GitHub + Vercel + Supabase

## Fase 1 — Repositorio
1. Crear repo privado.
2. Inicializar Next.js + TypeScript.
3. Copiar tokens y assets.
4. Añadir `.env.example`.
5. Añadir `.env.local` a `.gitignore`.
6. Proteger rama principal si trabaja más de una persona.

## Fase 2 — Supabase
1. Crear proyecto.
2. Ejecutar `config/supabase-schema.sql`.
3. Crear bucket privado `brand-intake-files`.
4. Configurar límite de tamaño/MIME en bucket.
5. Confirmar RLS.
6. Guardar URL, publishable key y service role.

## Fase 3 — Email
1. Crear proveedor transaccional.
2. Verificar un dominio de envío.
3. Crear sender, por ejemplo:
   `onboarding@tu-dominio`
4. Destino:
   `crisdalagency@gmail.com`
5. Guardar API key en Vercel.

## Fase 4 — Vercel
1. Importar repo desde GitHub.
2. Configurar variables.
3. Deploy preview.
4. Ejecutar QA.
5. Conectar dominio/subdominio.
6. Deploy production.

## Ruta sugerida
Si ya existe web principal:
`https://<dominio>/radiografia`

Alternativa:
`https://onboarding.<dominio>`

Temporal:
dominio `.vercel.app`.

## Variables
Ver `config/.env.example`.

## Entornos
Configurar:
- Development
- Preview
- Production

No usar la misma DB de producción para pruebas destructivas si el volumen empieza a crecer.

## Prueba de producción
Enviar una radiografía real de prueba:
Negocio:
`TEST CRISDAL QA`

Después verificar:
- fila en DB;
- archivos privados;
- correo recibido;
- código;
- WhatsApp;
- UTM;
- responsive.

Eliminar el test después.

## Dominio
La landing de onboarding puede vivir como subpágina de la web principal para reforzar confianza y no pagar un dominio adicional.

## Operación
Cada cambio de preguntas debe incrementar:
`formVersion`

Ejemplo:
`1.0` → `1.1`

Nunca reinterpretar respuestas antiguas con un schema nuevo sin conservar versión.
