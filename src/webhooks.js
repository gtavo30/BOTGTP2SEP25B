import crypto from 'crypto';
import express from 'express';
import { config } from './config.js';
import { log, error } from './utils/logger.js';
import { getMediaUrl, downloadMedia, sendText } from './whatsapp.js';
import { createThread, uploadFile, addMessage, runAssistant } from './openai.js';
import { ensureUser, getUser, setUserThread, setUserDeal } from './store.js';
import { findOrCreateContactByPhone, findDealByContact, createDeal, addTimelineCommentToDeal, createAppointment } from './bitrix.js';
import { parseIntent } from './nlp.js';

export const router = express.Router();

function verifyMetaSignature(req) {
  if (!config.meta.verifySignature) return true;
  const signature = req.get('X-Hub-Signature-256') || '';
  const expected = 'sha256=' + crypto.createHmac('sha256', config.meta.appSecret).update(req.rawBody || '').digest('hex');
  const ok = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!ok) error('Invalid Meta signature', { signature, expected });
  return ok;
}

// Verification
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Incoming
router.post('/whatsapp', async (req, res) => {
  // --- ensure Bitrix contact/deal + log incoming message (idempotent) ---
try {
  const body = req.body || {};
  const change = body?.entry?.[0]?.changes?.[0];
  const val = change?.value || {};
  const msg = val?.messages?.[0];
  const from = msg?.from || '';
  const textBody = msg?.text?.body || msg?.interactive?.nfm_reply?.response_json || '';
  const profileName = val?.contacts?.[0]?.profile?.name || '';

  const contactId = await findOrCreateContactByPhone(from, profileName);

  let dealId = await findDealByContact(contactId);
  if (!dealId) {
    const title = `${config.projectName || 'Proyecto'} - Lead WhatsApp ${from}`;
    dealId = await createDeal(contactId, title);
  }

  const when = new Date().toISOString().slice(0,19).replace('T',' ');
  const line = `🗨️ *Cliente* (${when}):
${textBody}`;
  await addTimelineCommentToDeal(dealId, line);

  req._bitrix = { contactId, dealId, from, profileName, textBody };
} catch (bxErr) {
  error('Bitrix logging failed', bxErr?.response?.data || bxErr?.message || bxErr);
}
// --- end ensure Bitrix block ---
// --- request start log ---
try {
  console.log('[webhook] POST /webhooks/whatsapp at', new Date().toISOString());
  const body = req.body || {};
  const entry = body?.entry?.[0] || {};
  const change = entry?.changes?.[0] || {};
  const val = change?.value || {};
  const msg = val?.messages?.[0] || {};
  const from = msg?.from || '';
  const type = msg?.type || 'text';
  const textBody = msg?.text?.body || msg?.interactive?.nfm_reply?.response_json || '';
  console.log('[webhook] from=', from, 'type=', type, 'text.len=', textBody?.length || 0);
} catch (e) { console.error('[webhook] start log error', e.message); }
// --- end start log ---
res.sendStatus(200); // respond immediately
  if (!verifyMetaSignature(req)) return;

  try {
    const entry = req.body.entry?.[0]?.changes?.[0]?.value;
    const msg = entry?.messages?.[0];
    if (!msg) return;

    const from = msg.from; // phone in international format without '+'
    await ensureUser(from);
    const user = getUser(from);

    // Handle message types
    let userText = '';
    let attachments = [];
    if (msg.type === 'text') {
      userText = msg.text.body;
    } else if ((msg.type === 'image' || msg.type === 'document') && config.allowFileUploads) {
      const mediaId = (msg.image || msg.document).id;
      const filename = (msg.image && 'image.jpg') || (msg.document?.filename || 'file.bin');
      const url = await getMediaUrl(mediaId);
      const buf = await downloadMedia(url);
      // Very simple size check (bytes to MB)
      if (buf.length > config.maxFileMB * 1024 * 1024) {
        await sendText(from, `El archivo supera el límite de ${config.maxFileMB} MB.`);
      } else {
        const fileId = await uploadFile(buf, filename);
        attachments.push(fileId);
        userText = (msg.caption || 'Archivo recibido. Continúa el análisis en el asistente.');
      }
    } else {
      userText = 'Mensaje recibido.';
    }

    // Ensure thread
    let threadId = user.threadId;
    if (!threadId) {
      threadId = await createThread();
      await setUserThread(from, threadId);
    }

    // Bitrix: ensure or locate deal
    let dealId = user?.bitrix?.dealId;
    if (!dealId) {
      const contactId = await findOrCreateContactByPhone(from);
      const existingDeal = await findDealByContact(contactId);
      if (existingDeal) {
        dealId = existingDeal;
      } else if (!config.bitrix.disableFallbackDeal) {
        dealId = await createDeal(contactId, `${config.projectName} - ${from}`);
      }
      if (dealId) await setUserDeal(from, dealId);
    }

    // Save incoming to Bitrix timeline
    if (dealId && config.bitrix.saveTranscripts) {
      await addTimelineCommentToDeal(dealId, `🟢 *Cliente (${from})*:\n${userText}`);
    }

    // Intent: appointment?
    const intent = parseIntent(userText);
    if (config.appointments.enabled && intent.type === 'book' && intent.datetimeISO && dealId) {
      const actId = await createAppointment(dealId, 'Cita solicitada por WhatsApp', intent.datetimeISO, config.appointments.durationMin, `Agendado automáticamente desde WhatsApp para ${from}`);
      await sendText(from, '✅ Tu cita ha quedado registrada. Un asesor te confirmará el detalle pronto.');
      // Notify sellers
      if (config.appointments.notifySellers) {
        for (const phone of config.sellerNumbers) {
          await sendText(phone, `📅 Nueva *cita* solicitada por ${from} (deal ${dealId}).`);
        }
      }
      // log to timeline
      if (config.bitrix.saveTranscripts) {
        await addTimelineCommentToDeal(dealId, `📅 Cita creada (actividad ${actId}) para ${intent.datetimeISO}`);
      }
      return;
    }

    // Send to OpenAI
    await addMessage(threadId, 'user', userText, attachments);
    const assistantReply = await runAssistant(threadId);

    // Reply to user
    await sendText(from, assistantReply);

    // Save reply to Bitrix timeline
    if (dealId && config.bitrix.saveBotReplies) {
      await addTimelineCommentToDeal(dealId, `🔵 *Bot*:\n${assistantReply}`);
    }

  } catch (e) {
    error('Webhook handling failed', e);
  }
try { console.log('[webhook] POST /webhooks/whatsapp done at', new Date().toISOString()); } catch {}
});

// Health

router.get('/health', (_req, res) => res.json({ ok: true }));
