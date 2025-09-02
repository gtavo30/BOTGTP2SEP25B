import axios from 'axios';
import { config } from './config.js';
import { log, error } from './utils/logger.js';

const OA_BASE = 'https://api.openai.com/v1';

function oa() {
  return axios.create({
    baseURL: OA_BASE,
    headers: { Authorization: `Bearer ${config.openai.apiKey}` }
  });
}

export async function createThread() {
  const { data } = await oa().post('/threads', {});
  return data.id;
}

export async function uploadFile(buffer, filename, purpose='assistants') {
  const form = new FormData();
  form.append('file', new Blob([buffer]), filename);
  form.append('purpose', purpose);
  const { data } = await fetch(`${OA_BASE}/files`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.openai.apiKey}` },
    body: form
  }).then(r=>r.json());
  if (data?.error) throw new Error(JSON.stringify(data.error));
  return data.id;
}

export async function addMessage(threadId, role, content, attachments=[]) {
  const { data } = await oa().post(`/threads/${threadId}/messages`, {
    role, content, attachments: attachments.length ? attachments.map(id => ({
      file_id: id, tools: [{ type: 'file_search' }]
    })) : undefined
  });
  return data.id;
}

export async function runAssistant(threadId) {
  const { data } = await oa().post(`/threads/${threadId}/runs`, {
    assistant_id: config.openai.assistantId
  });
  const runId = data.id;
  // poll until completed
  let status = data.status;
  let last;
  for (let i=0; i<60; i++) {
    const { data: d } = await oa().get(`/threads/${threadId}/runs/${runId}`);
    status = d.status;
    last = d;
    if (['completed','failed','cancelled','expired'].includes(status)) break;
    await new Promise(r=>setTimeout(r, 2000));
  }
  if (status !== 'completed') {
    error('Assistant run not completed', status);
  }
  // get latest assistant message
  const { data: msgs } = await oa().get(`/threads/${threadId}/messages?limit=1`);
  const msg = msgs.data?.[0];
  const text = msg?.content?.[0]?.text?.value || '(sin respuesta)';
  return text;
}
