# 08 — Seguridad y privacidad

## Principio
El formulario recoge información comercial privada del cliente. Debe tratarse como onboarding confidencial, no como un formulario público de marketing.

## Supabase
- habilitar RLS en tablas expuestas;
- la app pública no necesita permisos de lectura;
- inserts finales se realizan desde servidor;
- `service_role` solo en servidor;
- bucket privado;
- no usar URLs públicas para archivos.

## Keys
Nunca incluir:
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- secretos anti-spam
en GitHub o frontend.

Configurar secretos en Vercel Environment Variables.

## Upload
- validar extensión y MIME;
- renombrar archivos en servidor/path;
- no confiar en el nombre original;
- no permitir HTML, JS, EXE, ZIP en v1;
- sanitizar metadata;
- impedir path traversal.

## Datos que NO se solicitan
No pedir:
- contraseñas;
- acceso a redes;
- datos bancarios;
- DNI;
- tarjetas;
- información sensible innecesaria.

Los accesos de redes/Meta/hosting, si se necesitan para un proyecto, deben gestionarse después por un canal separado y con método seguro.

## Consentimiento
Requerir checkbox explícito antes del envío.

Texto propuesto:
“Autorizo a Crisdal Agency a usar esta información para evaluar y gestionar mi solicitud y contactarme por WhatsApp o correo.”

Agregar link a una política de privacidad cuando exista.

## Retención
Definir internamente:
- cuánto tiempo conservar formularios de prospectos/no clientes;
- cuándo archivar;
- cómo eliminar a solicitud.

No hardcodear una política legal que Crisdal aún no haya aprobado.

## Anti-spam
MVP:
- honeypot invisible;
- tiempo mínimo razonable entre start y submit;
- rate limit por endpoint si se implementa;
- `noindex,nofollow`.

Recomendado:
Cloudflare Turnstile o alternativa equivalente en submit y creación de signed upload.

## Logs
No loguear:
- respuestas completas;
- teléfono completo;
- contenidos de archivos.

Log mínimo:
- submission id;
- endpoint;
- status;
- error code;
- timestamp.

## Analítica
No enviar PII a GA/GTM/Meta Pixel.
Nunca incluir:
- nombre;
- WhatsApp;
- email;
- respuesta abierta;
- nombre de archivo.

## Error messages
No exponer:
- SQL;
- stack traces;
- keys;
- nombres internos de tablas;
- respuesta completa de proveedores.
