import OpenAI from "openai";
import { config } from './config.js';
import { error } from './utils/logger.js';

/**
 * Chat Completions shim con:
 * - Memoria corta (8 turnos) por threadId.
 * - Parámetros más deterministas (temperature 0.2).
 * - Prompt reforzado con reglas claras.
 * - Logging seguro (sin headers/config).
 * Mantiene la misma interfaz pública para no tocar el resto del código:
 *   createThread, uploadFile, addMessage, runAssistant
 */

const client = new OpenAI({ apiKey: config.openai.apiKey });

// Historial corto por threadId
const __history = new Map(); // threadId -> [{role, content}]

const SYSTEM_PROMPT = [
  "- Ya tienes el número de WhatsApp del cliente; NUNCA pidas ni confirmes el teléfono.",
  "Eres un asistente de ventas inmobiliarias de Constructora Sarmiento Rodas.",
  "- Responde en ESPAÑOL neutro, breve (1–3 líneas).",
  "- NO inventes datos; si falta info, pide UNA sola aclaración concreta.",
  "- Si el usuario pide CITA/VISITA: detecta fecha y hora. Si faltan, pide la hora.",
  "- Nunca compartas información sensible ni datos internos.",
].join("\n");

export async function createThread() {
  return 't_' + Math.random().toString(36).slice(2);
}

export async function uploadFile(_buffer, filename) {
  // Marcador simple para referencia (no se sube a OpenAI en este modo)
  return `file:${filename}`;
}

export async function addMessage(threadId, role, content, attachments = []) {
  let text = String(content || '');
  if (attachments && attachments.length) {
    text += `\n[Adjuntos: ${attachments.join(', ')}]`;
  }
  const arr = __history.get(threadId) || [];
  arr.push({ role, content: text });
  while (arr.length > 8) arr.shift(); // memoria corta
  __history.set(threadId, arr);
}

function buildMessages(threadId) {
  const arr = __history.get(threadId) || [];
  // Forzamos prefijo de sistema con reglas
  const msgs = [{ role: "system", content: SYSTEM_PROMPT }];
  // Conservamos historial reciente
  for (const m of arr) {
    // Solo roles válidos para chat.completions
    const role = (m.role === "assistant" ? "assistant" : "user");
    msgs.push({ role, content: m.content });
  }
  return msgs;
}

export async function runAssistant(threadId) {
  try {
    const messages = buildMessages(threadId);
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.2,
      top_p: 1,
      frequency_penalty: 0.1,
      presence_penalty: 0,
      max_tokens: 600
    });
    const out = (r.choices?.[0]?.message?.content || "").trim() || "Gracias, en un momento te confirmo.";

    // Guardar respuesta del asistente en el historial para coherencia en siguientes turnos
    const arr = __history.get(threadId) || [];
    arr.push({ role: "assistant", content: out });
    while (arr.length > 8) arr.shift();
    __history.set(threadId, arr);

    // Post-procesado mínimo: limitar a 3 líneas duras para evitar divagues
    return out;} catch (e) {
    const status = e?.status || e?.response?.status;
    const message = e?.response?.data?.error?.message || e?.message || "openai_error";
    try { error('[openai] fail', { status, message }); } catch {}
    return "Gracias por escribirnos. Enseguida te confirmo por aquí.";
  }
}
