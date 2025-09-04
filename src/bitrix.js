import axios from 'axios';

// Base del webhook con / final, ej: https://dominio.bitrix24.es/rest/1/TOKEN/
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
function dbg(...args){ if ((process.env.LOG_LEVEL||'info')==='debug') console.log('[bitrix]', ...args); }

function chooseOwnerId(projectText=''){
  const t = (projectText||'').toLowerCase();
  if (t.includes('venetto')) return 197;
  return Math.random() < 0.5 ? 4 : 185;
}

// === Leads (sin deduplicación) ===
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
  dbg('POST', 'crm.lead.add', payload);
  const { data } = await http.post(url('crm.lead.add'), payload);
  return data;
}

/**
 * Compatibilidad: en algunos builds, esta función CREABA el lead.
 * Aquí asegura la creación siempre, y devuelve { contactId:null, leadId, phone }.
 */
export async function findOrCreateContactByPhone(phone, opts={}){
  const res = await createLeadAlways({ phone, projectText: opts.projectText||'', name: opts.name||'WhatsApp Lead', extraFields: opts.extraFields||{} });
  return { contactId: null, leadId: res?.result, phone };
}

export async function ensureLead({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const res = await createLeadAlways({ phone, name, projectText, extraFields });
  return { leadId: res?.result, raw: res };
}

// === Deals helpers ===
export async function findDealByContact(contactId){
  const payload = {
    ORDER: { ID: 'DESC' },
    FILTER: { 'CONTACT_ID': contactId },
    SELECT: ['ID','TITLE','STAGE_ID','CATEGORY_ID','ASSIGNED_BY_ID']
  };
  dbg('POST', 'crm.deal.list', payload);
  const { data } = await http.post(url('crm.deal.list'), payload);
  const item = data?.result?.[0] || null;
  return item;
}

export async function createDeal(fields){
  const payload = { FIELDS: fields };
  dbg('POST', 'crm.deal.add', payload);
  const { data } = await http.post(url('crm.deal.add'), payload);
  return data;
}

export async function updateDeal(id, fields){
  const payload = { ID: id, FIELDS: fields };
  dbg('POST', 'crm.deal.update', payload);
  const { data } = await http.post(url('crm.deal.update'), payload);
  return data;
}

// === Timeline comment (compat) ===
export async function addTimelineCommentToDeal({ dealId, comment }){
  // Bitrix: crm.timeline.comment.add  (ENTITY_TYPE: 'deal' | 'DEAL' según instancia)
  const payload = { fields: { ENTITY_TYPE: 'deal', ENTITY_ID: dealId, COMMENT: comment } };
  dbg('POST', 'crm.timeline.comment.add', payload);
  const { data } = await http.post(url('crm.timeline.comment.add'), payload);
  return data;
}

// === Activity / Appointment (opcional) ===
export async function addActivity(fields){
  dbg('POST', 'crm.activity.add', { fields });
  const { data } = await http.post(url('crm.activity.add'), { fields });
  return data;
}

export async function createAppointment({ ownerTypeId, ownerId, subject, description, startUtc, endUtc, phone }){
  if (String(process.env.APPOINTMENTS_ENABLED).toLowerCase() === 'false') {
    dbg('appointments disabled, skipping');
    return { skipped: true };
  }
  const fields = {
    OWNER_TYPE_ID: ownerTypeId, // 1=Lead, 2=Deal
    OWNER_ID: ownerId,
    TYPE_ID: 1, // Meeting
    SUBJECT: subject || 'Cita',
    DESCRIPTION: description || '',
    START_TIME: startUtc,
    END_TIME: endUtc,
    COMPLETED: 'N',
    // Bitrix exige COMMUNICATIONS para actividades relacionadas a contacto/telefono
    COMMUNICATIONS: phone ? [{ VALUE: String(phone), TYPE: 'PHONE' }] : undefined
  };
  dbg('POST', 'crm.activity.add', { fields });
  const { data } = await http.post(url('crm.activity.add'), { fields });
  return data;
}

// === Lead helper directo (por compatibilidad) ===
export async function addLead(fields){
  const payload = { FIELDS: fields };
  dbg('POST', 'crm.lead.add', payload);
  const { data } = await http.post(url('crm.lead.add'), payload);
  return data;
}
