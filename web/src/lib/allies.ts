import { randomUUID } from 'node:crypto';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const ALLIES_BUCKET = 'crisdal-allies-data';
const DATA_PATH = 'private/network.json';
const DATA_FOLDER = 'private';
export type AllyStatus = 'pending' | 'approved' | 'suspended' | 'rejected';
export type Ally = { id:string; document_type:'DNI'|'RUC'; document_number:string; business_name:string; category:string; description:string; contact_name:string; contact_whatsapp:string; contact_email:string|null; logo_url:string|null; status:AllyStatus; visible:boolean; password_hash:string; must_change_password:boolean; last_login_at:string|null; approved_at:string|null; created_at:string; updated_at:string };
export type AllyContact = { id:string; sender_id:string; recipient_id:string; message:string; status:'pending'|'notified'|'contacted'|'closed'; created_at:string; updated_at:string };
export type AlliesData = { version:1; allies:Ally[]; contacts:AllyContact[] };
const emptyData:AlliesData={version:1,allies:[],contacts:[]};
export const allyCategories=['Alimentos y catering','Belleza y bienestar','Educación','Eventos','Fotografía y video','Imprenta y publicidad','Salud','Servicios profesionales','Tecnología','Transporte y logística','Otro'];

export async function ensureAlliesBucket(){const storage=getSupabaseServer().storage;const {data}=await storage.listBuckets();if(!data?.some(b=>b.name===ALLIES_BUCKET)){const {error}=await storage.createBucket(ALLIES_BUCKET,{public:false,fileSizeLimit:6*1024*1024,allowedMimeTypes:['application/json','image/jpeg','image/png','image/webp','image/avif']});if(error)throw error}}
export async function readAlliesData():Promise<AlliesData>{await ensureAlliesBucket();const storage=getSupabaseServer().storage.from(ALLIES_BUCKET);const {data:files}=await storage.list(DATA_FOLDER,{limit:100,sortBy:{column:'name',order:'desc'}});const latest=files?.find(file=>/^network-\d{13}-[a-f0-9-]+\.json$/.test(file.name));const path=latest?`${DATA_FOLDER}/${latest.name}`:DATA_PATH;const {data,error}=await storage.download(path);if(error||!data)return structuredClone(emptyData);try{const parsed=JSON.parse(await data.text()) as AlliesData;return parsed.version===1&&Array.isArray(parsed.allies)&&Array.isArray(parsed.contacts)?parsed:structuredClone(emptyData)}catch{return structuredClone(emptyData)}}
export async function writeAlliesData(data:AlliesData){await ensureAlliesBucket();const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const stamp=String(Date.now()).padStart(13,'0');const path=`${DATA_FOLDER}/network-${stamp}-${randomUUID()}.json`;const {error}=await getSupabaseServer().storage.from(ALLIES_BUCKET).upload(path,blob,{contentType:'application/json',cacheControl:'0'});if(error)throw error;return data}
export async function mutateAlliesData<T>(mutation:(data:AlliesData)=>T|Promise<T>){const data=await readAlliesData();const result=await mutation(data);await writeAlliesData(data);return result}
export async function getAllyById(id:string){return (await readAlliesData()).allies.find(a=>a.id===id)||null}
export async function getAllyByDocument(document:string){return (await readAlliesData()).allies.find(a=>a.document_number===document)||null}
export function createAlly(input:Omit<Ally,'id'|'created_at'|'updated_at'|'last_login_at'|'approved_at'>):Ally{const now=new Date().toISOString();return {...input,id:randomUUID(),last_login_at:null,approved_at:null,created_at:now,updated_at:now}}
export function createAllyContact(input:Pick<AllyContact,'sender_id'|'recipient_id'|'message'>):AllyContact{const now=new Date().toISOString();return {...input,id:randomUUID(),status:'notified',created_at:now,updated_at:now}}
export function publicAlly(ally:Ally){return{id:ally.id,businessName:ally.business_name,category:ally.category,description:ally.description,logoUrl:ally.logo_url}}
export function ownAlly(ally:Ally){return{...publicAlly(ally),documentType:ally.document_type,documentNumberMasked:`••••${ally.document_number.slice(-4)}`,contactName:ally.contact_name,contactWhatsapp:ally.contact_whatsapp,contactEmail:ally.contact_email,status:ally.status,visible:ally.visible,mustChangePassword:ally.must_change_password}}
