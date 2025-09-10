// server.js — CommonJS, listo para Render
const express = require('express');
const app = express();

// Body parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Logs de todas las requests
app.use((req, res, next) => {
  console.log('INCOMING', req.method, req.url, 'ct=', req.headers['content-type']);
  next();
});

// Healthcheck
app.get('/', (req, res) => res.status(200).send('ok'));

// Verificación del webhook (Meta)
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

// Recepción de eventos
app.post('/webhook', async (req, res) => {
  try {
    console.log('WEBHOOK BODY:', JSON.stringify(req.body));
    // TODO: aquí va tu lógica real (WhatsApp → OpenAI, CRM, etc.)
    return res.sendStatus(200);
  } catch (err) {
    console.error('WEBHOOK ERROR:', err?.response?.data || err);
    // Evita reintentos en bucle
    return res.sendStatus(200);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[BOT] Listening on port ${PORT}`));
