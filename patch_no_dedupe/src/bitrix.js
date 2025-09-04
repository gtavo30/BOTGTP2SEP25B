import axios from 'axios';

// URL base con slash final, p.ej. https://dominio.bitrix24.es/rest/1/TOKEN/
const BASE = process.env.BITRIX_WEBHOOK_BASE;
if (!BASE) {
  console.error('[FATAL] Falta BITRIX_WEBHOOK_BASE');
  process.exit(1);
}
const http = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

function url(method){ return method.startsWith('crm.') ? `${method}.json` : method; }

function chooseOwnerId(projectText=''){
  const t = (projectText||'').toLowerCase();
  if (t.includes('venetto')) return 197;
  return Math.random() < 0.5 ? 4 : 185;
}

/**
 * Quita deduplicación: SIEMPRE crea Lead.
 * Retorna { result: <leadId> } del API de Bitrix.
 */
export async function createLeadAlways({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const ASSIGNED_BY_ID = chooseOwnerId(projectText);
  const payload = {
    FIELDS: {
      TITLE: name,
      NAME: name,
      SOURCE_ID: 'WHATSAPP',
      ASSIGNED_BY_ID,
      PHONE: [{ VALUE: String(phone || ''), VALUE_TYPE: 'MOBILE' }],
      ...extraFields,
    }
  };
  const { data } = await http.post(url('crm.lead.add'), payload);
  return data;
}

/**
 * Compatibilidad: muchas bases llamaban a "findOrCreateContactByPhone".
 * Ahora solo devolvemos un contenedor mínimo sin buscar nada.
 */
export async function findOrCreateContactByPhone(phone){
  return { contactId: null, phone };
}

/**
 * Compatibilidad: flujo de alto nivel que algunos zips usaban.
 * Crea el Lead sin dedupe y devuelve { leadId }.
 */
export async function ensureLead({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const res = await createLeadAlways({ phone, name, projectText, extraFields });
  return { leadId: res?.result, raw: res };
}

/**
 * Helpers opcionales que otros módulos podrían importar.
 * No cambiamos su firma para no romper imports existentes.
 */
export async function addActivity(fields){
  // Permite mantener citas/timeline si tu código las llama.
  const { data } = await http.post(url('crm.activity.add'), { fields });
  return data;
}
export async function addDeal(fields){
  // Si tu flujo crea Deal, lo mantiene igual.
  const { data } = await http.post(url('crm.deal.add'), { fields });
  return data;
}
export async function updateDeal(id, fields){
  const { data } = await http.post(url('crm.deal.update'), { ID: id, FIELDS: fields });
  return data;
}
export async function addLead(fields){
  const { data } = await http.post(url('crm.lead.add'), { FIELDS: fields });
  return data;
}
