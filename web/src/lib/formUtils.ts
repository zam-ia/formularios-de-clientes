export function normalizeWhatsapp(value: string): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.length === 9) digits = `51${digits}`;
  return digits ? `+${digits}` : '';
}

export function shouldShowAdBudget(values: Record<string, unknown>): boolean {
  const services = Array.isArray(values.service_types) ? values.service_types : [];
  const goals = ['Más ventas directas', 'Más citas / reservas', 'Más consultas calificadas', 'Recuperar clientes'];
  return services.includes('Campaña publicitaria') || services.includes('Landing / web') || goals.includes(String(values.primary_goal ?? ''));
}

export function isFieldVisible(fieldId: string, values: Record<string, unknown>): boolean {
  if (fieldId === 'brand_upload') return values.brand_assets_status !== 'Empezamos desde cero';
  if (fieldId === 'marketing_history') return values.marketing_invested === 'Sí' || values.marketing_invested === true;
  if (fieldId === 'ad_budget') return shouldShowAdBudget(values);
  if (fieldId === 'materials_upload' || fieldId === 'materials_link') return values.own_materials !== 'No, hay que producir';
  if (fieldId === 'deadline_date') return values.deadline_type === 'Tengo una fecha exacta';
  return true;
}
