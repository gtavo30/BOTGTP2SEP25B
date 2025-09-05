export function auditLog(type, correlationId, message) {
  if (process.env.LOG_LEVEL !== 'debug') return;
  console.log(`[AUDIT][${type}] [${correlationId}]`, message);
}
