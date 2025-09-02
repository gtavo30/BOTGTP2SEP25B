import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.resolve(__dirname, '../data/state.json');
const adapter = new JSONFile(dbFile);
export const db = new Low(adapter, { users: {} });

export async function initDB() {
  await db.read();
  db.data ||= { users: {} };
  await db.write();
}

export function getUser(phone) {
  return db.data.users[phone];
}

export async function ensureUser(phone) {
  const u = db.data.users[phone] || { id: nanoid(), phone, threadId: null, bitrix: { contactId: null, dealId: null }, createdAt: new Date().toISOString() };
  db.data.users[phone] = u;
  await db.write();
  return u;
}

export async function setUserThread(phone, threadId) {
  const u = await ensureUser(phone);
  u.threadId = threadId;
  await db.write();
  return u;
}

export async function setUserDeal(phone, dealId) {
  const u = await ensureUser(phone);
  u.bitrix.dealId = dealId;
  await db.write();
  return u;
}
