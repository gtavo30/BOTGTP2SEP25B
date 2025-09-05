import axios from 'axios';

// Asegura base URL válida (con o sin / final)
function normalizeBase(base) {
  if (!base) throw new Error('Falta BITRIX_WEBHOOK_BASE');
  return base.endsWith('/') ? base : base + '/';
}

const BASE = normalizeBase(process.env.BITRIX_WEBHOOK_BASE);

/**
 * Passthrough EXACTO a Bitrix -> crm.lead.add.json
 * NO deduplica, NO inventa campos. Envía tal cual los 'fields' que reciba.
 * Ejemplo esperado de 'fields':
 * {
 *   TITLE: "Juan Pérez",
 *   NAME: "Juan Pérez",
 *   SOURCE_ID: "WHATSAPP",
 *   PHONE: [{ VALUE: "+593...", VALUE_TYPE: "MOBILE" }],
 *   EMAIL: [{ VALUE: "correo@...", VALUE_TYPE: "WORK" }],
 *   COMMENTS: "Interesado en: Porto Alegre",
 *   ASSIGNED_BY_ID: 4
 * }
 */
export async function createLead(fields) {
  if (!fields || typeof fields !== 'object') {
    throw new Error('missing fields');
  }
  const url = `${BASE}crm.lead.add.json`;
  const payload = { fields }; // Bitrix en JSON espera 'fields' (lowercase)
  console.log('[bitrix] POST crm.lead.add', JSON.stringify(payload, null, 2));
  const { data } = await axios.post(url, payload, {
    headers: { 'Content-Type': 'application/json' }
  });
  return data;
}

// ---- STUBS de compatibilidad (no hacen nada) ----
// Existen solo para que imports antiguos en webhooks.js NO rompan el deploy.
export function addTimelineCommentToDeal(/* dealId, text */) {
  return { ok: true, skipped: true };
}

export function createAppointment(/* payload */) {
  return { ok: true, skipped: true };
}
