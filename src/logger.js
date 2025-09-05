export function auditLog(type, correlationId, message) {
  const lvl = String(process.env.LOG_LEVEL || 'info').toLowerCase();
  if (lvl !== 'debug' && type === 'IN') return; // entrada solo en debug
  const msg = typeof message === 'string' ? message : JSON.stringify(message);
  console.log(`[AUDIT][${type}] [${correlationId}] ${msg}`);
}
