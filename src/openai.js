import OpenAI from "openai";
import { config } from './config.js';
import { log, error } from './utils/logger.js';

/**
 * Chat Completions shim (replaces Assistants/Threads usage) with
 * strict log sanitization: never log headers, request config, or tokens.
 * Exports keep the same names used elsewhere:
 *  - createThread()
 *  - uploadFile(buffer, filename)
 *  - addMessage(threadId, role, content, attachments)
 *  - runAssistant(threadId)
 */

const client = new OpenAI({ apiKey: config.openai.apiKey });

// In-memory minimal state (last user message per thread)
const __messages = new Map();

const SYSTEM_PROMPT = `Eres un asistente de ventas inmobiliarias de Constructora Sarmiento Rodas.
- Responde corto y claro.
- Si el usuario pide cita, intenta extraer fecha/hora y lugar.
- Si pide precios o disponibilidad, pide datos de contacto si faltan.`;

// Generate lightweight thread id
export async function createThread() {
  return 't_' + Math.random().toString(36).slice(2);
}

// No-op for chat completions; return a marker to append in prompt
export async function uploadFile(_buffer, filename) {
  return `file:${filename}`;
}

// Store last user message and annotate attachments
export async function addMessage(threadId, role, content, attachments = []) {
  let text = String(content || '');
  if (attachments && attachments.length) {
    text += `\n[Adjuntos: ${attachments.join(', ')}]`;
  }
  __messages.set(threadId, { role, content: text });
}

// Call Chat Completions; never print sensitive info
export async function runAssistant(threadId) {
  const msg = __messages.get(threadId);
  const userText = msg?.content || '';
  try {
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userText }
      ],
      temperature: 0.3
    });
    const out = r.choices?.[0]?.message?.content?.trim() || "Gracias, en un momento te confirmo.";
    return out;
  } catch (e) {
    // STRICT SANITIZATION: only log status+message; never e.config/e.request
    const status = e?.status || e?.response?.status;
    const message = e?.response?.data?.error?.message || e?.message || "openai_error";
    try { error('[openai] fail', { status, message }); } catch {}
    // Fallback to keep the flow alive (Bitrix + WA reply)
    return "Gracias por escribirnos. Enseguida te confirmo por aquí.";
  }
}
