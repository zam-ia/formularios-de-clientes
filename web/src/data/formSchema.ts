export type FieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'date'
  | 'single_select'
  | 'multiselect_cards'
  | 'chips'
  | 'file_upload'
  | 'checkbox';

export type FormField = {
  id: string;
  type: FieldType;
  label: string;
  helper?: string;
  placeholder?: string;
  required?: boolean;
  optional?: boolean;
  options?: string[];
  maxSelections?: number;
  maxLength?: number;
  category?: 'brand_assets' | 'materials';
};

export type FormStep = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  insight?: string;
  fields: FormField[];
};

export const FORM_VERSION = '1.1';

export const formSteps: FormStep[] = [
  {
    id: 'business',
    eyebrow: 'Contexto antes que diseño',
    title: 'Tu negocio',
    description: 'Empecemos por lo esencial para entender qué vamos a trabajar primero.',
    insight: 'Perfecto. Ya tenemos el punto de partida.',
    fields: [
      {
        id: 'service_types',
        type: 'multiselect_cards',
        label: '¿Qué vamos a trabajar primero?',
        helper: 'Selecciona hasta 2 prioridades. Después podremos ampliar el alcance.',
        required: true,
        maxSelections: 2,
        options: ['Diseño / flyer', 'Video / reel', 'Catálogo / brochure', 'Landing / web', 'Campaña publicitaria', 'Branding / identidad', 'Otro'],
      },
      { id: 'business_name', type: 'text', label: 'Nombre del negocio', placeholder: 'Ej. Café Central', required: true, maxLength: 120 },
      {
        id: 'sector',
        type: 'single_select',
        label: '¿En qué rubro estás?',
        required: true,
        options: ['Salud / clínica / consultorio', 'Belleza / estética / bienestar', 'Educación / capacitación', 'Restaurante / gastronomía', 'Retail / tienda', 'Servicios profesionales', 'Otro'],
      },
      { id: 'location', type: 'text', label: '¿Dónde atiendes principalmente?', placeholder: 'Ej. El Tambo, Huancayo', required: true, maxLength: 120 },
      { id: 'business_age', type: 'single_select', label: '¿Cuánto tiempo lleva funcionando?', required: true, options: ['Menos de 1 año', '1–3 años', 'Más de 3 años'] },
      { id: 'social_links', type: 'textarea', label: 'Redes sociales o web', helper: 'Puedes pegar varios enlaces, uno por línea.', placeholder: 'Instagram, Facebook, TikTok o sitio web', optional: true, maxLength: 600 },
    ],
  },
  {
    id: 'brand',
    eyebrow: 'Cómo quieres que te recuerden',
    title: 'La personalidad de tu marca',
    description: 'Tu identidad no es solo el logo: también es la sensación que dejas.',
    fields: [
      { id: 'brand_words', type: 'chips', label: 'Si tu negocio fuera una persona, ¿qué 3 palabras lo describirían?', helper: 'Escribe una palabra y presiona Enter. Necesitamos exactamente 3.', required: true },
      {
        id: 'brand_assets_status',
        type: 'single_select',
        label: '¿Qué tan definida está hoy tu identidad?',
        required: true,
        options: ['Tengo logo y colores listos', 'Tengo logo, pero el estilo aún no está claro', 'Quiero ordenar o renovar mi identidad', 'Empezamos desde cero'],
      },
      { id: 'brand_upload', type: 'file_upload', category: 'brand_assets', label: 'Comparte tu logo o manual de marca', helper: 'JPG, PNG, WEBP o PDF. Máximo 20 MB.', optional: true },
      { id: 'brand_colors_text', type: 'text', label: 'Colores o estilos que te gustan', placeholder: 'Ej. negro, dorado y un estilo minimalista', optional: true, maxLength: 300 },
      {
        id: 'brand_tone',
        type: 'single_select',
        label: '¿Cómo quieres que suene tu marca?',
        required: true,
        options: ['Cercana y familiar', 'Profesional y clara', 'Divertida y juvenil', 'Elegante y exclusiva', 'Directa y comercial', 'Técnica pero fácil de entender'],
      },
      { id: 'brand_avoid', type: 'textarea', label: '¿Hay algo que NO quieres que hagamos o digamos?', placeholder: 'Ej. no usar demasiados emojis ni comunicar como marca barata', optional: true, maxLength: 500 },
    ],
  },
  {
    id: 'goal',
    eyebrow: 'Una dirección clara',
    title: 'Tu prioridad',
    description: 'Así evitamos crear piezas bonitas que no ayudan al negocio.',
    insight: 'Este será el criterio principal para decidir el mensaje y el llamado a la acción.',
    fields: [
      {
        id: 'primary_goal',
        type: 'single_select',
        label: '¿Qué necesitas conseguir primero?',
        required: true,
        options: ['Más ventas directas', 'Más citas / reservas', 'Más consultas calificadas', 'Más reconocimiento', 'Recuperar clientes', 'Mejorar imagen de marca', 'Lanzar un producto / servicio', 'Otro'],
      },
      { id: 'four_week_result', type: 'text', label: 'Si en 4 semanas mejoráramos UNA cosa, ¿cuál sería?', placeholder: 'Ej. recibir 20 consultas de personas interesadas', required: true, maxLength: 300 },
      {
        id: 'primary_cta',
        type: 'single_select',
        label: 'Después de ver el trabajo, ¿qué debería hacer la persona?',
        required: true,
        options: ['Escribir por WhatsApp', 'Reservar / agendar', 'Comprar', 'Completar un formulario', 'Visitar el local', 'Seguir la cuenta', 'Recordar la marca', 'Otro'],
      },
    ],
  },
  {
    id: 'customer',
    eyebrow: 'Diseñamos para alguien concreto',
    title: 'Tu cliente',
    description: 'Una marca que intenta hablarle a todos suele conectar con nadie.',
    fields: [
      { id: 'ideal_customer', type: 'textarea', label: 'Describe a tu cliente ideal', helper: 'Edad aproximada, zona, qué busca, qué valora y cómo decide.', required: true, maxLength: 600 },
      { id: 'customer_problem', type: 'textarea', label: '¿Qué problema importante le resuelves?', required: true, maxLength: 500 },
      {
        id: 'customer_channels',
        type: 'multiselect_cards',
        label: '¿Dónde suele encontrarte o informarse?',
        required: true,
        options: ['Facebook', 'Instagram', 'WhatsApp', 'TikTok', 'Google', 'Recomendaciones', 'Local físico', 'No lo tengo claro'],
      },
      { id: 'main_objection', type: 'text', label: '¿Qué duda suele frenar la compra?', placeholder: 'Ej. precio, confianza, tiempo o distancia', optional: true, maxLength: 300 },
    ],
  },
  {
    id: 'offer',
    eyebrow: 'Una oferta real que defender',
    title: 'Tu oferta',
    description: 'Queremos entender qué vendemos primero y por qué deberían elegirte.',
    fields: [
      { id: 'star_offer', type: 'text', label: '¿Cuál es tu producto o servicio estrella?', required: true, maxLength: 200 },
      { id: 'average_price', type: 'text', label: '¿Cuál es su precio promedio?', helper: 'Puedes escribir un precio o un rango.', placeholder: 'Ej. S/ 120–180', required: true, maxLength: 100 },
      { id: 'differentiator', type: 'textarea', label: '¿Por qué deberían elegirte a ti?', helper: 'Cuéntanos algo real: experiencia, rapidez, especialidad, garantía, método o atención.', required: true, maxLength: 600 },
      { id: 'current_promo', type: 'text', label: '¿Tienes una promoción u oferta vigente?', optional: true, maxLength: 300 },
      { id: 'competitors', type: 'text', label: 'Menciona 1–2 competidores directos', optional: true, maxLength: 300 },
      { id: 'competitor_notes', type: 'textarea', label: '¿Qué admiras o qué NO quieres copiar de cómo se promocionan?', optional: true, maxLength: 500 },
    ],
  },
  {
    id: 'resources',
    eyebrow: 'Aprovechemos lo que ya existe',
    title: 'Experiencia y recursos',
    description: 'No empezamos de cero si ya tienes aprendizajes o materiales útiles.',
    fields: [
      { id: 'marketing_invested', type: 'single_select', label: '¿Ya invertiste en publicidad, influencers o agencia?', required: true, options: ['Sí', 'No'] },
      { id: 'marketing_history', type: 'textarea', label: '¿Qué resultado tuviste y qué no quieres que se repita?', required: true, maxLength: 600 },
      { id: 'ad_budget', type: 'single_select', label: '¿Cuánto podrías destinar a pauta al mes, aparte del servicio?', required: true, options: ['Menos de S/150', 'S/150–300', 'S/300–600', 'Más de S/600', 'Aún no sé', 'No aplica por ahora'] },
      { id: 'own_materials', type: 'single_select', label: '¿Tienes fotos o videos propios que podamos usar?', required: true, options: ['Sí, tengo material', 'Tengo algo, pero falta completar', 'No, hay que producir'] },
      { id: 'materials_upload', type: 'file_upload', category: 'materials', label: 'Comparte una muestra de tu material', helper: 'JPG, PNG, WEBP, PDF o MP4. Máximo 20 MB.', optional: true },
      { id: 'materials_link', type: 'text', label: 'Link de Drive o Dropbox', helper: 'Recomendado para videos o carpetas pesadas.', placeholder: 'https://drive.google.com/...', optional: true, maxLength: 600 },
    ],
  },
  {
    id: 'contact',
    eyebrow: 'Último paso',
    title: 'Fechas y contacto',
    description: 'Esto nos ayuda a organizar tiempos y comunicación contigo.',
    fields: [
      { id: 'deadline_type', type: 'single_select', label: '¿Para cuándo necesitas el primer entregable?', required: true, options: ['Tengo una fecha exacta', 'Aún no tengo fecha fija'] },
      { id: 'deadline_date', type: 'date', label: 'Fecha objetivo', required: true },
      { id: 'key_date', type: 'text', label: '¿Hay una fecha comercial importante?', placeholder: 'Ej. apertura, evento, aniversario o temporada', optional: true, maxLength: 300 },
      { id: 'contact_name', type: 'text', label: 'Persona de contacto', required: true, maxLength: 120 },
      { id: 'contact_whatsapp', type: 'tel', label: 'WhatsApp', helper: 'Incluye el código de país si no es un número de Perú.', placeholder: '987 654 321', required: true, maxLength: 30 },
      { id: 'contact_email', type: 'email', label: 'Correo de contacto', placeholder: 'nombre@empresa.com', optional: true, maxLength: 180 },
      { id: 'best_contact_time', type: 'single_select', label: 'Mejor horario para escribirte', required: true, options: ['9 am–12 pm', '12 pm–3 pm', '3 pm–6 pm', '6 pm–9 pm', 'Cualquiera'] },
      { id: 'consent', type: 'checkbox', label: 'Autorizo a Crisdal Agency a usar esta información para evaluar y gestionar mi solicitud y contactarme por WhatsApp o correo.', required: true },
    ],
  },
];

export const totalSteps = formSteps.length;
