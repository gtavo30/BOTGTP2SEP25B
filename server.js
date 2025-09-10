// server.js — CommonJS + WhatsApp reply (eco) + debug endpoint
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
  const graphVersion = process.env.GRAPH_VERSION || 'v21.0';
  if (!token || !phoneNumberId) {
    console.error('ENV MISSING: WHATSAPP_TOKEN or PHONE_NUMBER_ID');
    return { status: 0, data: { error: 'missing envs' } };
  }
  const url = `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to,
    text: { body: text }
  };
  try {
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
  } catch (e) {
    console.error('WA SEND EXCEPTION', e);
    return { status: 0, data: { error: String(e) } };
  }
}

// --- Endpoint de debug: envío directo sin webhook ---
// Uso (GET): /__send_test?to=593999000111&text=hola
app.get('/__send_test', async (req, res) => {
  try {
    const to = req.query.to || process.env.TEST_TO;
    const text = req.query.text || 'Prueba directa desde /__send_test';
    if (!to) return res.status(400).json({ error: 'faltó ?to=593...' });
    const out = await sendWhatsAppText(String(to), String(text));
    return res.status(200).json(out);
  } catch (e) {
    console.error('SEND_TEST ERROR', e);
    return res.status(500).json({ error: String(e) });
  }
});

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

    // Siempre responde 200 al webhook (evita reintentos)
    return res.sendStatus(200);
  } catch (err) {
    console.error('WEBHOOK ERROR:', err?.response?.data || err);
    return res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[BOT] Listening on port ${PORT}`));
