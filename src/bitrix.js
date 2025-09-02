import axios from 'axios';
import qs from 'qs';
import { config } from './config.js';
import { error } from './utils/logger.js';

function base() {
  if (config.bitrix.webhookBase) return config.bitrix.webhookBase.replace(/\/$/,'') + '/';
  if (config.bitrix.oauthToken && config.bitrix.baseUrl) return `${config.bitrix.baseUrl.replace(/\/$/,'')}/rest/`;
  throw new Error('Bitrix24 not configured');
}

function headers() {
  return config.bitrix.oauthToken ? { Authorization: `Bearer ${config.bitrix.oauthToken}` } : {};
}

async function call(method, params={}) {
  const url = base() + method;
  const data = config.bitrix.oauthToken ? qs.stringify(params) : params;
  const opts = config.bitrix.oauthToken ? { headers: { ...headers(), 'Content-Type': 'application/x-www-form-urlencoded' } } : {};
  const { data: res } = await axios.post(url, data, opts);
  if (res.error) throw new Error(JSON.stringify(res));
  return res.result;
}

// --- Minimal helpers focused on our scope (save chat & create appointment) ---

export async function findOrCreateContactByPhone(phone) {
  // Try search contact by phone
  const contacts = await call('crm.contact.list', { filter: { '%PHONE': phone }, select: ['ID'] });
  if (contacts.length) return contacts[0].ID;
  // Create new contact if not found
  const id = await call('crm.contact.add', { fields: { NAME: phone, PHONE: [{ VALUE: phone, VALUE_TYPE: 'WORK' }] } });
  return id;
}

export async function findDealByContact(contactId) {
  const deals = await call('crm.deal.list', { filter: { CONTACT_ID: contactId }, order: { ID: 'DESC' }, select: ['ID'] });
  return deals[0]?.ID || null;
}

export async function createDeal(contactId, title) {
  const id = await call('crm.deal.add', { fields: { TITLE: title, CATEGORY_ID: Number(config.bitrix.dealCategoryId), STAGE_ID: config.bitrix.dealStageId, CONTACT_ID: contactId } });
  return id;
}

export async function addTimelineCommentToDeal(dealId, text) {
  // crm.timeline.comment.add requires binding to owner
  return await call('crm.timeline.comment.add', {
    fields: {
      ENTITY_TYPE: 'deal',
      ENTITY_ID: Number(dealId),
      COMMENT: text
    }
  });
}

export async function createAppointment(dealId, subject, isoStart, durationMinutes=60, description='') {
  // Create an activity linked to the deal
  const start = new Date(isoStart);
  const end = new Date(start.getTime() + durationMinutes*60000);
  return await call('crm.activity.add', {
    fields: {
      OWNER_TYPE_ID: 2, // Deal
      OWNER_ID: Number(dealId),
      TYPE_ID: 1, // Meeting
      SUBJECT: subject,
      DESCRIPTION: description,
      START_TIME: start.toISOString().slice(0,19),
      END_TIME: end.toISOString().slice(0,19),
      COMPLETED: 'N'
    }
  });
}
