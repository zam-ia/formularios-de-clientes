import { randomUUID } from "node:crypto";
import { getSupabaseServer } from "@/lib/supabaseServer";

export const ALLIES_BUCKET = "crisdal-allies-data";
const DATA_PATH = "private/network.json";
const DATA_FOLDER = "private";

export type AllyStatus = "pending" | "approved" | "suspended" | "rejected";
export type LoyaltyStatus = "active" | "frozen";
export type Ally = {
  id: string;
  document_type: "DNI" | "RUC";
  document_number: string;
  business_name: string;
  category: string;
  description: string;
  contact_name: string;
  contact_whatsapp: string;
  contact_email: string | null;
  logo_url: string | null;
  status: AllyStatus;
  visible: boolean;
  password_hash: string;
  must_change_password: boolean;
  loyalty_status: LoyaltyStatus;
  last_login_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};
export type AllyContact = {
  id: string;
  sender_id: string;
  recipient_id: string;
  message: string;
  status: "pending" | "notified" | "contacted" | "closed";
  created_at: string;
  updated_at: string;
};
export type PointMovement = {
  id: string;
  ally_id: string;
  type: "earned" | "redeemed" | "expired" | "adjustment";
  points: number;
  reference: string;
  service_record_id: string | null;
  expires_at: string | null;
  created_at: string;
};
export type ServiceRecord = {
  id: string;
  ally_id: string;
  period: string;
  plan: string;
  services: string;
  amount_paid: number;
  points_awarded: number;
  notes: string;
  created_at: string;
};
export type PerformanceMetric = {
  id: string;
  ally_id: string;
  period: string;
  reach: number;
  audience: number;
  audience_growth: number;
  organic_growth: number;
  engagement: number;
  leads: number;
  sales: number | null;
  revenue: number | null;
  ad_spend: number | null;
  roi: number | null;
  notes: string;
  created_at: string;
};
export type Reward = {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  active: boolean;
  stock: number | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};
export type Redemption = {
  id: string;
  ally_id: string;
  reward_id: string;
  reward_title: string;
  points: number;
  status: "pending" | "approved" | "rejected" | "delivered";
  note: string;
  requested_at: string;
  updated_at: string;
};
export type AlliesData = {
  version: 2;
  allies: Ally[];
  contacts: AllyContact[];
  point_movements: PointMovement[];
  service_records: ServiceRecord[];
  performance_metrics: PerformanceMetric[];
  rewards: Reward[];
  redemptions: Redemption[];
};

const starterRewards: Reward[] = [
  reward("Descuento de S/300", "Aplicable a la mensualidad del mes siguiente.", "Descuento", 400),
  reward("1 video corto para redes", "Producción y edición de una pieza vertical.", "Contenido", 600),
  reward("Sesión de fotografía profesional", "Sesión coordinada con el equipo audiovisual.", "Producción", 700),
  reward("Paquete de 2 videos cortos", "Dos piezas verticales listas para redes.", "Contenido", 1000),
  reward("1 mes de Plan Esencial", "Beneficio sujeto a revisión comercial y disponibilidad.", "Plan", 1000),
  reward("Branding básico", "Logo y manual esencial de identidad.", "Marca", 2000),
  reward("Video corporativo institucional", "Producción audiovisual de mayor alcance.", "Producción", 3500),
];

function reward(title: string, description: string, category: string, points: number): Reward {
  const now = new Date(0).toISOString();
  const id = `reward-${points}-${title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  return { id, title, description, category, points, active: true, stock: null, image_url: null, created_at: now, updated_at: now };
}

const emptyData: AlliesData = {
  version: 2,
  allies: [],
  contacts: [],
  point_movements: [],
  service_records: [],
  performance_metrics: [],
  rewards: starterRewards,
  redemptions: [],
};

export const allyCategories = [
  "Alimentos y catering",
  "Belleza y bienestar",
  "Educación",
  "Eventos",
  "Fotografía y video",
  "Imprenta y publicidad",
  "Salud",
  "Servicios profesionales",
  "Tecnología",
  "Transporte y logística",
  "Otro",
];

export async function ensureAlliesBucket() {
  const storage = getSupabaseServer().storage;
  const { data } = await storage.listBuckets();
  if (!data?.some((bucket) => bucket.name === ALLIES_BUCKET)) {
    const { error } = await storage.createBucket(ALLIES_BUCKET, {
      public: false,
      fileSizeLimit: 6 * 1024 * 1024,
      allowedMimeTypes: ["application/json", "image/jpeg", "image/png", "image/webp", "image/avif"],
    });
    if (error) throw error;
  }
}

function normalizeData(raw: Partial<AlliesData> & { version?: number }): AlliesData {
  const allies = Array.isArray(raw.allies)
    ? raw.allies.map((ally) => ({
        ...ally,
        loyalty_status:
          ally.loyalty_status || (ally.status === "approved" ? "active" : "frozen"),
      }))
    : [];
  return {
    version: 2,
    allies: allies as Ally[],
    contacts: Array.isArray(raw.contacts) ? raw.contacts : [],
    point_movements: Array.isArray(raw.point_movements) ? raw.point_movements : [],
    service_records: Array.isArray(raw.service_records) ? raw.service_records : [],
    performance_metrics: Array.isArray(raw.performance_metrics) ? raw.performance_metrics : [],
    rewards: Array.isArray(raw.rewards) && raw.rewards.length ? raw.rewards : starterRewards,
    redemptions: Array.isArray(raw.redemptions) ? raw.redemptions : [],
  };
}

export async function readAlliesData(): Promise<AlliesData> {
  await ensureAlliesBucket();
  const storage = getSupabaseServer().storage.from(ALLIES_BUCKET);
  const { data: files } = await storage.list(DATA_FOLDER, {
    limit: 100,
    sortBy: { column: "name", order: "desc" },
  });
  const latest = files?.find((file) => /^network-\d{13}-[a-f0-9-]+\.json$/.test(file.name));
  const path = latest ? `${DATA_FOLDER}/${latest.name}` : DATA_PATH;
  const { data, error } = await storage.download(path);
  if (error || !data) return structuredClone(emptyData);
  try {
    return normalizeData(JSON.parse(await data.text()));
  } catch {
    return structuredClone(emptyData);
  }
}

export async function writeAlliesData(data: AlliesData) {
  await ensureAlliesBucket();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const stamp = String(Date.now()).padStart(13, "0");
  const path = `${DATA_FOLDER}/network-${stamp}-${randomUUID()}.json`;
  const { error } = await getSupabaseServer().storage.from(ALLIES_BUCKET).upload(path, blob, {
    contentType: "application/json",
    cacheControl: "0",
  });
  if (error) throw error;
  return data;
}

export async function mutateAlliesData<T>(mutation: (data: AlliesData) => T | Promise<T>) {
  const data = await readAlliesData();
  const result = await mutation(data);
  await writeAlliesData(data);
  return result;
}
export async function getAllyById(id: string) {
  return (await readAlliesData()).allies.find((ally) => ally.id === id) || null;
}
export async function getAllyByDocument(document: string) {
  return (await readAlliesData()).allies.find((ally) => ally.document_number === document) || null;
}
export function createAlly(
  input: Omit<Ally, "id" | "created_at" | "updated_at" | "last_login_at" | "approved_at" | "loyalty_status"> &
    Partial<Pick<Ally, "loyalty_status">>,
): Ally {
  const now = new Date().toISOString();
  return {
    ...input,
    id: randomUUID(),
    loyalty_status: input.loyalty_status || (input.status === "approved" ? "active" : "frozen"),
    last_login_at: null,
    approved_at: null,
    created_at: now,
    updated_at: now,
  };
}
export function createAllyContact(input: Pick<AllyContact, "sender_id" | "recipient_id" | "message">): AllyContact {
  const now = new Date().toISOString();
  return { ...input, id: randomUUID(), status: "notified", created_at: now, updated_at: now };
}
export function pointsSummary(data: AlliesData, allyId: string) {
  const movements = data.point_movements.filter((movement) => movement.ally_id === allyId);
  const latestActivity = movements
    .filter((movement) => movement.points > 0)
    .toSorted((a, b) => b.created_at.localeCompare(a.created_at))[0];
  const expiresAt = latestActivity
    ? new Date(new Date(latestActivity.created_at).setMonth(new Date(latestActivity.created_at).getMonth() + 12)).toISOString()
    : null;
  const expired = Boolean(expiresAt && new Date(expiresAt).getTime() < Date.now());
  const earned = movements
    .reduce((total, movement) => total + movement.points, 0);
  const reserved = data.redemptions
    .filter((redemption) => redemption.ally_id === allyId && redemption.status === "pending")
    .reduce((total, redemption) => total + redemption.points, 0);
  const balance = expired ? 0 : Math.max(0, earned);
  return { balance, reserved: expired ? 0 : reserved, available: expired ? 0 : Math.max(0, balance - reserved), expiresAt, expired };
}
export function publicAlly(ally: Ally) {
  return { id: ally.id, businessName: ally.business_name, category: ally.category, description: ally.description, logoUrl: ally.logo_url };
}
export function ownAlly(ally: Ally) {
  return {
    ...publicAlly(ally),
    documentType: ally.document_type,
    documentNumberMasked: `••••${ally.document_number.slice(-4)}`,
    contactName: ally.contact_name,
    contactWhatsapp: ally.contact_whatsapp,
    contactEmail: ally.contact_email,
    status: ally.status,
    loyaltyStatus: ally.loyalty_status,
    visible: ally.visible,
    mustChangePassword: ally.must_change_password,
  };
}
