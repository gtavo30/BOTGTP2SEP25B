import axios from 'axios';

const BASE = process.env.BITRIX_WEBHOOK_BASE;
if (!BASE) {
  console.error('[FATAL] Falta BITRIX_WEBHOOK_BASE');
  process.exit(1);
}

const http = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
});

const u = (m)=> m.endsWith('.json') ? m : m + '.json';

/**
 * Passthrough EXACTO a crm.lead.add
 * - Recibe "fields" ya formados por el Assistant.
 * - Envía { FIELDS: fields } sin modificar.
 */
export async function registerLead(fields) {
  console.log('[bitrix] POST crm.lead.add', { FIELDS: fields });
  const { data } = await http.post(u('crm.lead.add'), { FIELDS: fields });
  return data;
}
