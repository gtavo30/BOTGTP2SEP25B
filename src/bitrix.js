import axios from 'axios';

// Base con slash final. Ej: https://dominio.bitrix24.es/rest/1/TOKEN/
const BASE = process.env.BITRIX_WEBHOOK_BASE;
if (!BASE) {
  console.error('[FATAL] Falta BITRIX_WEBHOOK_BASE');
  process.exit(1);
}
const http = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

const dbg = (...a) => { if ((process.env.LOG_LEVEL||'info')==='debug') console.log('[bitrix]', ...a); };
const u = (m)=> m.startsWith('crm.') ? m + '.json' : m;

function chooseOwnerId(projectText=''){
  const t = (projectText||'').toLowerCase();
  if (t.includes('venetto')) return 197;
  return Math.random() < 0.5 ? 4 : 185;
}

// === Cambios ultra-min: SIEMPRE crear Lead ===
async function _createLeadRaw({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const ASSIGNED_BY_ID = chooseOwnerId(projectText);
  const payload = {
    FIELDS: {
      TITLE: name,
      NAME: name,
      SOURCE_ID: 'WHATSAPP',
      ASSIGNED_BY_ID,
      PHONE: [{ VALUE: String(phone||''), VALUE_TYPE: 'MOBILE' }],
      ...extraFields
    }
  };
  dbg('POST', 'crm.lead.add', payload);
  const { data } = await http.post(u('crm.lead.add'), payload);
  return data;
}

/**
 * 1) Compat preservada: en builds anteriores esta función creaba o encontraba contacto.
 *    Ahora **crea siempre el LEAD** (sin deduplicación) y retorna forma compatible.
 */
export async function findOrCreateContactByPhone(phone, opts={}){
  try{
    const res = await _createLeadRaw({
      phone,
      name: opts.name || 'WhatsApp Lead',
      projectText: opts.projectText || '',
      extraFields: opts.extraFields || {}
    });
    return { contactId: null, leadId: res?.result, phone };
  }catch(err){
    dbg('findOrCreateContactByPhone.error', err?.response?.status, err?.response?.data || err?.message);
    throw err;
  }
}

/**
 * 2) Flujo explícito: asegurar Lead -> **crear siempre**.
 */
export async function ensureLead({ phone, name='WhatsApp Lead', projectText='', extraFields={} }={}){
  const res = await _createLeadRaw({ phone, name, projectText, extraFields });
  return { leadId: res?.result, raw: res };
}

// === Exports restantes intactos (compatibilidad). ===
export async function addLead(fields){
  const payload = { FIELDS: fields };
  dbg('POST', 'crm.lead.add', payload);
  const { data } = await http.post(u('crm.lead.add'), payload);
  return data;
}
export async function findDealByContact(contactId){
  const payload = {
    ORDER: { ID: 'DESC' },
    FILTER: { 'CONTACT_ID': contactId },
    SELECT: ['ID','TITLE','STAGE_ID','CATEGORY_ID','ASSIGNED_BY_ID']
  };
  dbg('POST', 'crm.deal.list', payload);
  const { data } = await http.post(u('crm.deal.list'), payload);
  return data?.result?.[0] || null;
}
export async function createDeal(fields){
  const payload = { FIELDS: fields };
  dbg('POST', 'crm.deal.add', payload);
  const { data } = await http.post(u('crm.deal.add'), payload);
  return data;
}
export async function updateDeal(id, fields){
  const payload = { ID: id, FIELDS: fields };
  dbg('POST', 'crm.deal.update', payload);
  const { data } = await http.post(u('crm.deal.update'), payload);
  return data;
}
export async function addTimelineCommentToDeal({ dealId, comment }){
  const payload = { fields: { ENTITY_TYPE: 'deal', ENTITY_ID: dealId, COMMENT: comment } };
  dbg('POST', 'crm.timeline.comment.add', payload);
  const { data } = await http.post(u('crm.timeline.comment.add'), payload);
  return data;
}
export async function addActivity(fields){
  dbg('POST', 'crm.activity.add', { fields });
  const { data } = await http.post(u('crm.activity.add'), { fields });
  return data;
}
export async function createAppointment({ ownerTypeId, ownerId, subject, description, startUtc, endUtc, phone }){
  if (String(process.env.APPOINTMENTS_ENABLED).toLowerCase()==='false'){
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
    COMMUNICATIONS: phone ? [{ VALUE: String(phone), TYPE: 'PHONE' }] : undefined
  };
  dbg('POST', 'crm.activity.add', { fields });
  const { data } = await http.post(u('crm.activity.add'), { fields });
  return data;
}
