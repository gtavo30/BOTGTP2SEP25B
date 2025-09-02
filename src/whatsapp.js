import axios from 'axios';
import { config } from './config.js';
import { log, error } from './utils/logger.js';

const WA_API = `https://graph.facebook.com/${config.meta.apiVersion}`;

export async function sendText(to, text) {
  const url = `${WA_API}/${config.whatsapp.phoneId}/messages`;
  try {
    const { data } = await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    }, { headers: { Authorization: `Bearer ${config.whatsapp.token}` } });
    log('WA sent', data.messages?.[0]?.id || '');
    return data;
  } catch (e) {
    error('WA send error', e.response?.data || e.message);
    throw e;
  }
}

export async function sendTemplate(to, name, lang='es') {
  const url = `${WA_API}/${config.whatsapp.phoneId}/messages`;
  try {
    const { data } = await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name, language: { code: lang } }
    }, { headers: { Authorization: `Bearer ${config.whatsapp.token}` } });
    return data;
  } catch (e) {
    error('WA template error', e.response?.data || e.message);
    throw e;
  }
}

export async function getMediaUrl(mediaId) {
  try {
    const { data } = await axios.get(`https://graph.facebook.com/${config.meta.apiVersion}/${mediaId}`, {
      headers: { Authorization: `Bearer ${config.whatsapp.token}` }
    });
    return data.url;
  } catch (e) {
    error('WA media url error', e.response?.data || e.message);
    throw e;
  }
}

export async function downloadMedia(url) {
  try {
    const { data } = await axios.get(url, {
      headers: { Authorization: `Bearer ${config.whatsapp.token}` },
      responseType: 'arraybuffer'
    });
    return Buffer.from(data);
  } catch (e) {
    error('WA media download error', e.response?.data || e.message);
    throw e;
  }
}
