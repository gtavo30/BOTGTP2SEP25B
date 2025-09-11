const express = require('express');
const app = express();
app.use(express.json({ limit: '2mb' }));

app.use((req, _res, next) => { console.log(`[INCOMING] ${req.method} ${req.path} ct=${req.get('content-type')}`); next(); });

const PORT = process.env.PORT || 10000;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN || 'dev-verify';
const TOKEN = process.env.WHATSAPP_TOKEN || '';
const PHONE_ID = process.env.WHATSAPP_PHONE_ID || process.env.phone_no_id || process.env.PHONE_NUMBER_ID || '';
const GRAPH_VERSION = process.env.GRAPH_VERSION || 'v23.0';

console.log(`[ENV] WHATSAPP_VERIFY_TOKEN ${!!process.env.WHATSAPP_VERIFY_TOKEN} WHATSAPP_TOKEN ${!!TOKEN} WHATSAPP_PHONE_ID ${!!PHONE_ID} GRAPH_VERSION ${GRAPH_VERSION}`);

app.get('/', (_req, res) => res.status(200).send('hello bro'));
app.get('/__health', (_req, res) => res.status(200).json({ ok: true }));

function verify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) return res.status(200).send(challenge);
  return res.sendStatus(403);
}
app.get('/webhook', verify);
app.get('/webhooks/whatsapp', verify);

async function handleWebhook(req, res) {
  console.log('[WEBHOOK BODY]', JSON.stringify(req.body));
  res.sendStatus(200);
}
app.post('/webhook', handleWebhook);
app.post('/webhooks/whatsapp', handleWebhook);

app.get('/__send_test', async (req, res) => {
  try {
    const to = req.query.to;
    const text = req.query.text || 'hola';
    if (!to) return res.status(400).json({ error: 'missing to' });
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${PHONE_ID}/messages`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } })
    });
    const body = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : r.status).json({ ok: r.ok, status: r.status, body });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`[BOT] Listening on port ${PORT}`));
