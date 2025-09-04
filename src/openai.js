import OpenAI from "openai";
import { config } from './config.js';
import { log, error } from './utils/logger.js';

/**
 * Passthrough a la Assistants API (como el bot original):
 * - Crea thread, añade mensaje de usuario, ejecuta run con assistant_id.
 * - Hace polling hasta 'completed' y devuelve el texto del asistente.
 * - Sin modificar el prompt (vive en el Assistant configurado en OpenAI).
 * - Sin reglas extra, sin grounding, sin trucos: comportamiento original.
 * - Logs seguros (no imprimir headers/request).
 *
 * Exporta la misma interfaz usada por el resto del proyecto:
 *   - createThread()
 *   - uploadFile(buffer, filename)   [no-op suave; devuelve marcador]
 *   - addMessage(threadId, role, content, attachments)
 *   - runAssistant(threadId)
 */

const client = new OpenAI({ apiKey: config.openai.apiKey });

function getAssistantId() {
  return (
    (config?.openai?.assistantId) ||
    process.env.OPENAI_ASSISTANT_ID ||
    process.env.ASSISTANT_ID ||
    ""
  );
}

export async function createThread() {
  const t = await client.beta.threads.create();
  log('[assistants] thread.create', { id: t.id });
  return t.id;
}

export async function uploadFile(_buffer, filename = 'upload.bin') {
  // En el bot original rara vez se usó archivo. Para mantener compatibilidad
  // devolvemos un marcador textual; si necesitas subir archivos reales,
  // podemos ampliar a client.files.create con streams.
  return `file:${filename}`;
}

export async function addMessage(threadId, role, content, attachments = []) {
  const text = String(content || '');
  const attNote = attachments && attachments.length
    ? `\n[Adjuntos: ${attachments.join(', ')}]`
    : '';
  await client.beta.threads.messages.create(threadId, {
    role: role === 'assistant' ? 'assistant' : 'user',
    content: text + attNote
  });
  log('[assistants] message.add', { threadId, role });
}

async function waitForRun(threadId, runId, { timeoutMs = 45000, intervalMs = 800 } = {}) {
  const start = Date.now();
  while (true) {
    const run = await client.beta.threads.runs.retrieve(threadId, runId);
    if (run.status === 'completed') return run;
    if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
      throw new Error(`run status=${run.status}`);
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('run timeout');
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

function extractAssistantText(messagesList) {
  // Busca el último mensaje 'assistant' y concatena segmentos de texto
  for (const msg of messagesList.data) {
    if (msg.role === 'assistant' && msg.content?.length) {
      const parts = msg.content
        .filter(p => p.type === 'text' && p.text?.value)
        .map(p => p.text.value);
      if (parts.length) return parts.join('\n').trim();
    }
  }
  // Si no hay 'assistant', intenta devolver lo último legible
  const any = messagesList.data?.[0]?.content?.[0]?.text?.value || '';
  return (any || '').trim();
}

export async function runAssistant(threadId) {
  const assistantId = getAssistantId();
  if (!assistantId) {
    error('[assistants] missing assistant_id');
    return 'Gracias, en un momento te confirmo.';
  }
  try {
    const run = await client.beta.threads.runs.create(threadId, { assistant_id: assistantId });
    log('[assistants] run.create', { threadId, runId: run.id });

    await waitForRun(threadId, run.id);

    const messages = await client.beta.threads.messages.list(threadId, { limit: 10 });
    const out = extractAssistantText(messages) || 'Gracias, en un momento te confirmo.';
    log('[assistants] run.completed', { threadId });
    return out;
  } catch (e) {
    const status = e?.status || e?.response?.status;
    const message = e?.response?.data?.error?.message || e?.message || 'assistants_error';
    error('[assistants] fail', { status, message });
    return 'Gracias, en un momento te confirmo.';
  }
}
