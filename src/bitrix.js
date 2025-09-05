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
 * - Si viene { fields: {...} } lo pasa tal cual como { FIELDS: {...} }
 * - Si viene plano, intenta usarlo como FIELDS directamente.
 * - No aplica defaults ni deduplicación.
 */
export async function registerLead(body) {
  const fields = body?.fields ? body.fields : body;
  if (!fields || typeof fields !== 'object') throw new Error('missing fields');
  const payload = { FIELDS: fields };
  // Log simple
  console.log('[bitrix] POST crm.lead.add', JSON.stringify(payload, null, 2));
  const { data } = await http.post(u('crm.lead.add'), payload);
  return data;
}

/**
 * Stub para compatibilidad con imports existentes en webhooks.js del proyecto
 * (no hace nada; mantiene el build sin romper hasta su fase)
 */
export function addTimelineCommentToDeal() {
  return { ok: true, skipped: true };
}
