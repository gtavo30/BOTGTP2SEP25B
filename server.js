import express from 'express';
import bodyParser from 'body-parser';
import { router as webhooks } from './src/webhooks.js';
import { initDB } from './src/store.js';
import { config } from './src/config.js';

const app = express();
app.use(bodyParser.json({
  limit: '20mb',
  verify: (req, _res, buf) => { req.rawBody = buf; }
}));
app.use('/webhooks', webhooks);

app.get('/', (_req, res) => res.send('WhatsApp Assistant Bot is running.'));

await initDB();

app.listen(config.port, () => {
  console.log(`[BOT] Listening on port ${config.port}`);
});
