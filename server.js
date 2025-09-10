// server.js — CommonJS + WhatsApp reply (echo), listo para Render
const express = require('express');
const app = express();

// --- Body parsers ---
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Logs globales ---
app.use((req, res, next) => {
  console.log('INCOMING', req.method, req.url, 'ct=', req.headers['content-type']);
  next();
});

// --- Healthcheck ---
app.get('/', (req, res) => res.status(200).send('ok'));

// --- Verificación Webhook (Meta) ---
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'dev';
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// --- Util: enviar texto por WhatsApp Cloud ---
async function sendWhatsAppText(to, text) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.PHONE_NUMBER_ID; // ej: 123456789012345
  if (!token || !phoneNumberId) {
    console.error('ENV MISSING: WHATSAPP_TOKEN or PHONE_NUMBER_ID');
    return;
  }
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error('WA SEND ERROR', r.status, JSON.stringify(data));
  } else {
    console.log('WA SEND OK', data?.messages?.[0]?.id || data);
  }
  return { status: r.status, data };
}

// --- Webhook POST ---
app.post('/webhook', async (req, res) => {
  try {
    console.log('WEBHOOK BODY:', JSON.stringify(req.body));

    // WhatsApp Cloud payload:
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];

    if (msg && msg.type === 'text') {
      const from = msg.from; // ej: '593999000111'
      const text = msg.text?.body || '';
      // Responder eco para validar que "el bot responde"
      await sendWhatsAppText(from, `👋 Recibido: ${text}`);
    }

    // Siempre responde 200 al webhook (evita reintentos en bucle)
    return res.sendStatus(200);
  } catch (err) {
    console.error('WEBHOOK ERROR:', err?.response?.data || err);
    return res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[BOT] Listening on port ${PORT}`));
