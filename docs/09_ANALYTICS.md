# 09 — Analítica

## Objetivo
Medir fricción del onboarding sin capturar el contenido privado de las respuestas.

## Eventos

### `brand_xray_view`
Al cargar la landing.

Params:
- device_class
- source
- campaign

### `brand_xray_start`
Al tocar “Empezar mi radiografía”.

### `brand_xray_step_view`
Params:
- step_id
- step_number

### `brand_xray_step_complete`
Params:
- step_id
- step_number
- elapsed_seconds

### `brand_xray_validation_error`
Params:
- step_id
- field_id
- error_type

No enviar el valor del campo.

### `brand_xray_upload_start`
Params:
- category
- mime_group
- size_bucket

### `brand_xray_upload_success`
### `brand_xray_upload_error`

### `brand_xray_review_view`
Cuando se abre el resumen.

### `brand_xray_submit_start`
### `brand_xray_submit_success`
Params:
- submission_code_hash opcional
- total_time_seconds
- files_count
- service_type_count

### `brand_xray_submit_error`
Params:
- error_code
- endpoint

### `brand_xray_whatsapp_click`
Después del envío.

## Funnel
1. view
2. start
3. step 1 complete
4. step 3 complete
5. step 5 complete
6. review
7. submit success
8. WhatsApp click

## Dashboard mínimo
- visitas;
- starts;
- completion rate;
- abandono por step;
- mediana de tiempo;
- errores por field;
- porcentaje mobile;
- submit errors;
- WhatsApp click rate.

## Privacidad
La analítica mide comportamiento del formulario, no las respuestas del cliente.
