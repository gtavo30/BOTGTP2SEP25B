import dotenv from 'dotenv';
dotenv.config();

const bool = (v, d=false) => {
  if (v === undefined || v === null || v === '') return d;
  return String(v).toLowerCase() === 'true';
};
const num = (v, d=0) => (v !== undefined && v !== '' && !isNaN(Number(v)) ? Number(v) : d);

const required = (key) => {
  const v = process.env[key];
  if (!v) console.warn(`[WARN] Missing env: ${key}`);
  return v;
};

export const config = {
  port: num(process.env.PORT, 10000),
  baseUrl: process.env.APP_BASE_URL || '',
  timezone: process.env.TIMEZONE || 'America/Guayaquil',
  logLevel: process.env.LOG_LEVEL || 'info',
  meta: {
    apiVersion: process.env.META_API_VERSION || 'v21.0',
    verifySignature: bool(process.env.ENABLE_META_SIGNATURE, true),
    appSecret: process.env.WHATSAPP_APP_SECRET || ''
  },
  projectName: process.env.PROJECT_NAME || 'Proyecto AI',
  allowFileUploads: bool(process.env.ALLOW_FILE_UPLOADS, true),
  maxFileMB: num(process.env.MAX_FILE_MB, 20),
  allowedMimeList: (process.env.ALLOWED_MIME_LIST || '').split(',').map(s=>s.trim()).filter(Boolean),
  whatsapp: {
    verifyToken: required('WHATSAPP_VERIFY_TOKEN'),
    token: required('WHATSAPP_TOKEN'),
    phoneId: required('WHATSAPP_PHONE_ID')
  },
  openai: {
    apiKey: required('OPENAI_API_KEY'),
    assistantId: required('OPENAI_ASSISTANT_ID'),
    model: process.env.OPENAI_MODEL || '',
    runPollMs: num(process.env.OPENAI_RUN_POLL_MS, 2000)
  },
  bitrix: {
    webhookBase: process.env.BITRIX_WEBHOOK_BASE, // ends with "/"
    oauthToken: process.env.BITRIX_OAUTH_TOKEN,
    baseUrl: process.env.BITRIX_BASE_URL,
    dealCategoryId: process.env.BITRIX_DEAL_CATEGORY_ID || '0',
    dealStageId: process.env.BITRIX_DEAL_STAGE_ID || 'NEW',
    disableFallbackDeal: bool(process.env.BITRIX_DISABLE_FALLBACK_DEAL, false),
    saveTranscripts: bool(process.env.SAVE_TRANSCRIPTS_TO_BITRIX, true),
    saveBotReplies: bool(process.env.SAVE_BOT_REPLIES_TO_BITRIX, true)
  },
  appointments: {
    enabled: bool(process.env.APPOINTMENTS_ENABLED, true),
    durationMin: num(process.env.APPOINTMENT_DURATION_MIN, 60),
    notifySellers: bool(process.env.SELLER_WHATSAPP_NOTIFY, true)
  },
  sellerNumbers: (process.env.SELLER_NUMBERS || '').split(',').map(s => s.trim()).filter(Boolean)
};
