// server.js — CommonJS; respeta tus ENV: WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN, WHATSAPP_TOKEN
const express = require('express');
const app = express();

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Logs globales
app.use((req, res, next) => {
  console.log('INCOMING', req.method, req.url, 'ct=', req.headers['content-type']);
  next();
});

// Health
app.get('/', (req, res) => res.status(200).send('ok'));

// Helpers de ENV (sin exponer secretos)
function getVerifyToken() {
  return process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN || process.env.MYTOKEN || 'dev';
}
function getPhoneId() {
  return process.env.WHATSAPP_PHONE_ID || process.env.PHONE_NUMBER_ID || '';
}
function getWhatsToken() {
  return process.env.WHATSAPP_TOKEN || process.env.TOKEN || '';
}

// Verificación Webhook (Meta): ambas rutas
function verifyWebhook(req, res) {
  const VERIFY_TOKEN = getVerifyToken();
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[VERIFY] OK for', req.path);
    return res.status(200).send(challenge);
  }
  console.warn('[VERIFY] FAIL for', req.path, { mode, tokenOK: token === VERIFY_TOKEN });
  return res.sendStatus(403);
}
app.get('/webhook', verifyWebhook);
app.get('/webhooks/whatsapp', verifyWebhook);

// Util: enviar texto por WhatsApp Cloud
async function sendWhatsAppText(to, text) {
  const token = getWhatsToken();
  const phoneNumberId = getPhoneId(); // WHATSAPP_PHONE_ID preferente
  const graphVersion = process.env.GRAPH_VERSION || 'v21.0';
  if (!token || !phoneNumberId) {
    console.error('ENV MISSING', {
      WHATSAPP_TOKEN: !!process.env.WHATSAPP_TOKEN || !!process.env.TOKEN,
      WHATSAPP_PHONE_ID: !!process.env.WHATSAPP_PHONE_ID,
      PHONE_NUMBER_ID: !!process.env.PHONE_NUMBER_ID
    });
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

// Endpoint de debug: envío directo sin webhook
// Uso: GET /__send_test?to=593999000111&text=hola
app.get('/__send_test', async (req, res) => {
  try {
    const to = String(req.query.to || process.env.TEST_TO || '');
    const text = String(req.query.text || 'Prueba directa /__send_test');
    if (!to) return res.status(400).json({ error: 'faltó ?to=593...' });
    const out = await sendWhatsAppText(to, text);
    return res.status(200).json(out);
  } catch (e) {
    console.error('SEND_TEST ERROR', e);
    return res.status(500).json({ error: String(e) });
  }
});

// Handler de webhook (ambas rutas)
async function handleWebhook(req, res) {
  try {
    console.log('WEBHOOK BODY:', JSON.stringify(req.body));

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg = value?.messages?.[0];

    if (msg && msg.type === 'text') {
      const from = msg.from;
      const text = msg.text?.body || '';
      await sendWhatsAppText(from, `👋 Recibido: ${text}`);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error('WEBHOOK ERROR:', err?.response?.data || err);
    return res.sendStatus(200);
  }
}
app.post('/webhook', handleWebhook);
app.post('/webhooks/whatsapp', handleWebhook);

// Arranque + diagnóstico de ENV (sin valores)
const PORT = process.env.PORT || 3000;
(function diagENV() {
  const has = n => (process.env[n] ? '✅' : '❌');
  console.log('[ENV]',
    'WHATSAPP_VERIFY_TOKEN', has('WHATSAPP_VERIFY_TOKEN'),
    'WHATSAPP_TOKEN', has('WHATSAPP_TOKEN') || has('TOKEN'),
    'WHATSAPP_PHONE_ID', has('WHATSAPP_PHONE_ID'),
    'PHONE_NUMBER_ID', has('PHONE_NUMBER_ID'),
    'GRAPH_VERSION', process.env.GRAPH_VERSION || 'v21.0'
  );
})();
app.listen(PORT, () => console.log(`[BOT] Listening on port ${PORT}`));
