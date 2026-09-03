import { randomBytes, randomUUID } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const ADMIN_DATA_BUCKET = "crisdal-admin-data";
const DATA_FOLDER = "private";
const DATA_PATH = `${DATA_FOLDER}/agency-os.json`;

export type AdminRole = "owner" | "admin" | "editor" | "calendar" | "project_manager" | "collaborator" | "finance" | "hr" | "sales" | "supervisor";
export type AdminUser = {
  id: string;
  username: string;
  display_name: string;
  email: string | null;
  role: AdminRole;
  password_hash: string;
  active: boolean;
  last_login_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type QuotePlan = {
  id: string;
  name: string;
  description: string;
  price: number;
  billing_label: string;
  features: string[];
  badge: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type DiscountRule = {
  id: string;
  name: string;
  description: string;
  type: "percent" | "fixed";
  value: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type QuoteItem = {
  id: string;
  service_id?: string;
  code?: string;
  category?: string;
  unit?: string;
  base_cost?: number;
  tax_percent?: number;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  features: string[];
};

export type QuoteStrategy = {
  id: string;
  title: string;
  description: string;
};

export type QuoteStatus = "draft" | "sent" | "accepted" | "approved" | "won" | "lost" | "rejected" | "expired";
export type Quote = {
  id: string;
  public_token: string;
  quote_number: string;
  client_name: string;
  company_name: string;
  client_whatsapp: string;
  client_email: string;
  title: string;
  introduction: string;
  client_id?: string;
  currency: "PEN" | "USD";
  items: QuoteItem[];
  strategies: QuoteStrategy[];
  global_discount_type: "percent" | "fixed";
  global_discount_value: number;
  tax_percent?: number;
  valid_until: string;
  terms: string[];
  notes: string;
  status: QuoteStatus;
  advisor_id?: string;
  advisor_name?: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type CalendarEventType =
  | "recording"
  | "meeting"
  | "delivery"
  | "publication"
  | "vacation"
  | "internal"
  | "other";
export type CalendarEvent = {
  id: string;
  client_id?: string;
  title: string;
  client_name: string;
  type: CalendarEventType;
  start_at: string;
  end_at: string;
  all_day: boolean;
  location: string;
  assignees: string[];
  description: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  drive_url: string;
  notify_whatsapp: boolean;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type ClientStatus = "lead" | "active" | "paused" | "completed";
export type FinanceAccount = "bcp" | "bbva" | "interbank" | "cash" | "other";
export type AgencyClient = {
  id: string;
  company_name: string;
  contact_name: string;
  whatsapp: string;
  email: string;
  plan_name: string;
  monthly_fee: number;
  currency: "PEN" | "USD";
  payment_account: FinanceAccount;
  start_date: string;
  end_date: string;
  status: ClientStatus;
  notes: string;
  advisor_id?: string;
  advisor_name?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type FinanceEntry = {
  id: string;
  type: "income" | "expense";
  date: string;
  amount: number;
  currency: "PEN" | "USD";
  account: FinanceAccount;
  category: string;
  client_id: string;
  description: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type ServiceCategory = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CatalogService = {
  id: string;
  code: string;
  category_id: string;
  name: string;
  description: string;
  unit: string;
  base_cost: number;
  suggested_price: number;
  estimated_time: string;
  tax_percent: number;
  max_discount_percent: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionRule = {
  id: string;
  user_id: string;
  category_id: string;
  commission_percent: number;
  fixed_amount: number;
  min_sales_threshold: number;
  extra_percent_above_threshold: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionRecord = {
  id: string;
  user_id: string;
  user_name: string;
  quote_id: string;
  quote_number: string;
  base_amount: number;
  commission_percent: number;
  fixed_amount: number;
  commission_amount: number;
  status: "pending" | "paid";
  created_at: string;
  paid_at: string;
};

export type CommercialSettings = {
  default_tax_percent: number;
  max_global_discount_percent: number;
  allow_below_cost: boolean;
};

export type ProjectColumn = {
  id: string;
  name: string;
  order: number;
  color: string;
};

export type ProjectChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type ProjectTask = {
  id: string;
  client_id: string;
  column_id: string;
  title: string;
  description: string;
  content_type: string;
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string;
  assignees: string[];
  labels: string[];
  checklist: ProjectChecklistItem[];
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at: string;
};

export type Employee = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role_title: string;
  area: string;
  contract_type: "payroll" | "freelance" | "intern" | "partner";
  start_date: string;
  rate: number;
  currency: "PEN" | "USD";
  status: "active" | "leave" | "inactive";
  notes: string;
  created_at: string;
  updated_at: string;
};

export type AdminData = {
  version: 5;
  users: AdminUser[];
  quote_plans: QuotePlan[];
  quotes: Quote[];
  calendar_events: CalendarEvent[];
  clients: AgencyClient[];
  finance_entries: FinanceEntry[];
  discount_rules: DiscountRule[];
  project_columns: ProjectColumn[];
  project_tasks: ProjectTask[];
  employees: Employee[];
  service_categories: ServiceCategory[];
  catalog_services: CatalogService[];
  commission_rules: CommissionRule[];
  commissions: CommissionRecord[];
  commercial_settings: CommercialSettings;
};

const initialDate = new Date(0).toISOString();
const starterPlans: QuotePlan[] = [
  {
    id: "plan-esencial",
    name: "Esencial",
    description: "Para negocios que recién empiezan a mostrarse en redes.",
    price: 200,
    billing_label: "por mes",
    features: ["1 video vertical profesional", "5 publicaciones con diseño y copy", "1 asesoría mensual de marketing", "Entrega lista para publicar"],
    badge: "",
    active: true,
    created_at: initialDate,
    updated_at: initialDate,
  },
  {
    id: "plan-crece",
    name: "Crece",
    description: "Para negocios que ya venden y necesitan presencia constante.",
    price: 420,
    billing_label: "desde / mes",
    features: ["2 videos verticales", "8 publicaciones con diseño y copy", "Manejo completo de redes sociales", "Gestión de campaña en Meta Ads", "Reporte mensual de resultados"],
    badge: "Más elegido",
    active: true,
    created_at: initialDate,
    updated_at: initialDate,
  },
  {
    id: "plan-impulso",
    name: "Impulso",
    description: "Para convertir la presencia digital en un sistema comercial más activo.",
    price: 650,
    billing_label: "desde / mes",
    features: ["3 videos verticales", "12 publicaciones", "Redes sociales + campaña Meta Ads", "Automatización de respuestas", "Seguimiento quincenal"],
    badge: "",
    active: true,
    created_at: initialDate,
    updated_at: initialDate,
  },
];

const starterProjectColumns: ProjectColumn[] = [
  { id: "todo", name: "Por hacer", order: 0, color: "#7b766e" },
  { id: "production", name: "En grabación / diseño", order: 1, color: "#bd7c00" },
  { id: "editing", name: "En edición", order: 2, color: "#7252b8" },
  { id: "review", name: "Revisión cliente", order: 3, color: "#3165b9" },
  { id: "approved", name: "Aprobado", order: 4, color: "#17835a" },
  { id: "published", name: "Publicado", order: 5, color: "#11100e" },
];

const starterServiceCategories: ServiceCategory[] = [
  { id: "cat-video", name: "Video", description: "Producción y edición audiovisual.", active: true, created_at: initialDate, updated_at: initialDate },
  { id: "cat-content", name: "Contenido", description: "Diseño, fotografía y gestión de contenido.", active: true, created_at: initialDate, updated_at: initialDate },
  { id: "cat-ads", name: "Campañas", description: "Publicidad digital y performance.", active: true, created_at: initialDate, updated_at: initialDate },
  { id: "cat-web", name: "Web", description: "Landing pages y activos digitales.", active: true, created_at: initialDate, updated_at: initialDate },
];

const starterCatalogServices: CatalogService[] = [
  { id: "srv-video-vertical", code: "VID-001", category_id: "cat-video", name: "Video vertical profesional", description: "Preproducción, grabación y edición de una pieza vertical.", unit: "por video", base_cost: 120, suggested_price: 200, estimated_time: "3 días", tax_percent: 18, max_discount_percent: 10, active: true, created_at: initialDate, updated_at: initialDate },
  { id: "srv-pack-diseno", code: "CON-001", category_id: "cat-content", name: "Pack de diseños para redes", description: "Cinco piezas gráficas con copy y adaptación para redes.", unit: "por pack", base_cost: 90, suggested_price: 160, estimated_time: "4 días", tax_percent: 18, max_discount_percent: 10, active: true, created_at: initialDate, updated_at: initialDate },
  { id: "srv-meta-ads", code: "ADS-001", category_id: "cat-ads", name: "Gestión de campaña Meta Ads", description: "Configuración, seguimiento y optimización de una campaña.", unit: "por campaña", base_cost: 140, suggested_price: 280, estimated_time: "mensual", tax_percent: 18, max_discount_percent: 8, active: true, created_at: initialDate, updated_at: initialDate },
  { id: "srv-landing", code: "WEB-001", category_id: "cat-web", name: "Landing page comercial", description: "Diseño y desarrollo de página enfocada en conversión.", unit: "por página", base_cost: 350, suggested_price: 650, estimated_time: "10 días", tax_percent: 18, max_discount_percent: 12, active: true, created_at: initialDate, updated_at: initialDate },
];

const emptyData: AdminData = {
  version: 5,
  users: [],
  quote_plans: starterPlans,
  quotes: [],
  calendar_events: [],
  clients: [],
  finance_entries: [],
  discount_rules: [],
  project_columns: starterProjectColumns,
  project_tasks: [],
  employees: [],
  service_categories: starterServiceCategories,
  catalog_services: starterCatalogServices,
  commission_rules: [],
  commissions: [],
  commercial_settings: { default_tax_percent: 18, max_global_discount_percent: 15, allow_below_cost: false },
};

function normalizeData(raw: Partial<AdminData>): AdminData {
  return {
    version: 5,
    users: Array.isArray(raw.users) ? raw.users : [],
    quote_plans: Array.isArray(raw.quote_plans) ? raw.quote_plans : starterPlans,
    quotes: Array.isArray(raw.quotes) ? raw.quotes : [],
    calendar_events: Array.isArray(raw.calendar_events) ? raw.calendar_events : [],
    clients: Array.isArray(raw.clients) ? raw.clients : [],
    finance_entries: Array.isArray(raw.finance_entries) ? raw.finance_entries : [],
    discount_rules: Array.isArray(raw.discount_rules) ? raw.discount_rules : [],
    project_columns: Array.isArray(raw.project_columns) && raw.project_columns.length ? raw.project_columns : starterProjectColumns,
    project_tasks: Array.isArray(raw.project_tasks) ? raw.project_tasks : [],
    employees: Array.isArray(raw.employees) ? raw.employees : [],
    service_categories: Array.isArray(raw.service_categories) && raw.service_categories.length ? raw.service_categories : starterServiceCategories,
    catalog_services: Array.isArray(raw.catalog_services) && raw.catalog_services.length ? raw.catalog_services : starterCatalogServices,
    commission_rules: Array.isArray(raw.commission_rules) ? raw.commission_rules : [],
    commissions: Array.isArray(raw.commissions) ? raw.commissions : [],
    commercial_settings: raw.commercial_settings || { default_tax_percent: 18, max_global_discount_percent: 15, allow_below_cost: false },
  };
}

export async function ensureAdminDataBucket() {
  const storage = getSupabaseServer().storage;
  const { data } = await storage.listBuckets();
  if (!data?.some((bucket) => bucket.name === ADMIN_DATA_BUCKET)) {
    const { error } = await storage.createBucket(ADMIN_DATA_BUCKET, {
      public: false,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["application/json"],
    });
    if (error) throw error;
  }
}

export async function readAdminData(): Promise<AdminData> {
  await ensureAdminDataBucket();
  const storage = getSupabaseServer().storage.from(ADMIN_DATA_BUCKET);
  const { data: files } = await storage.list(DATA_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  const latest = files?.find((file) => /^agency-os-\d{13}-[a-f0-9-]+\.json$/.test(file.name));
  const path = latest ? `${DATA_FOLDER}/${latest.name}` : DATA_PATH;
  const { data, error } = await storage.download(path);
  if (error || !data) return structuredClone(emptyData);
  try {
    return normalizeData(JSON.parse(await data.text()));
  } catch {
    return structuredClone(emptyData);
  }
}

export async function writeAdminData(data: AdminData) {
  await ensureAdminDataBucket();
  const stamp = String(Date.now()).padStart(13, "0");
  const path = `${DATA_FOLDER}/agency-os-${stamp}-${randomUUID()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const { error } = await getSupabaseServer().storage.from(ADMIN_DATA_BUCKET).upload(path, blob, {
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) throw error;
  return data;
}

export async function mutateAdminData<T>(mutation: (data: AdminData) => T | Promise<T>) {
  const data = await readAdminData();
  const result = await mutation(data);
  await writeAdminData(data);
  return result;
}

export function publicAdminUser(user: AdminUser) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
    email: user.email,
    role: user.role,
    active: user.active,
    lastLoginAt: user.last_login_at,
    createdAt: user.created_at,
  };
}

export function nextQuoteNumber(quotes: Quote[]) {
  const year = new Date().getFullYear();
  const highest = quotes
    .filter((quote) => quote.quote_number.startsWith(`COT-${year}-`))
    .map((quote) => Number(quote.quote_number.split("-").at(-1)))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value), 0);
  return `COT-${year}-${String(highest + 1).padStart(4, "0")}`;
}

export function createPublicQuoteToken() {
  return randomBytes(18).toString("base64url");
}

export async function getQuoteByToken(token: string) {
  const quote = (await readAdminData()).quotes.find((item) => item.public_token === token);
  if (!quote) return null;
  return { ...quote, items: quote.items.map((item) => { const sanitized = { ...item }; delete sanitized.base_cost; return sanitized; }) };
}
