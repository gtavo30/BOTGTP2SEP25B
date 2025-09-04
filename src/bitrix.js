import axios from 'axios';

// Base del webhook con slash final, ej: https://dominio.bitrix24.es/rest/1/TOKEN/
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

export async function createLeadAlways({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const ASSIGNED_BY_ID = chooseOwnerId(projectText);
  const payload = {
    FIELDS: {
      TITLE: name,
      NAME: name,
      SOURCE_ID: 'WHATSAPP',
      ASSIGNED_BY_ID,
      PHONE: [{ VALUE: String(phone||''), VALUE_TYPE: 'MOBILE' }],
      ...extraFields,
    }
  };
  const { data } = await http.post(url('crm.lead.add'), payload);
  return data;
}

/**
 * Compatibilidad reforzada:
 * En algunos builds, findOrCreateContactByPhone era quien *creaba* el Lead.
 * Aquí lo preservamos: SIEMPRE crea Lead y devuelve { contactId:null, leadId, phone }.
 */
export async function findOrCreateContactByPhone(phone, opts={}){
  const res = await createLeadAlways({ phone, projectText: opts.projectText||'', name: opts.name||'WhatsApp Lead', extraFields: opts.extraFields||{} });
  return { contactId: null, leadId: res?.result, phone };
}

/**
 * Flujo explícito por si tu bot lo usa.
 */
export async function ensureLead({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const res = await createLeadAlways({ phone, name, projectText, extraFields });
  return { leadId: res?.result, raw: res };
}

// Helpers que otros módulos podrían requerir (no se modifican).
export async function addActivity(fields){
  const { data } = await http.post(url('crm.activity.add'), { fields });
  return data;
}
export async function addDeal(fields){
  const { data } = await http.post(url('crm.deal.add'), { FIELDS: fields });
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
