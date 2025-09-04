Patch ULTRA-MIN (solo quitar dedupe) — reemplaza src/bitrix.js
===============================================================
- Mantiene TODOS los exports esperados por webhooks.js (compat 1:1).
- Cambios mínimos:
  1) findOrCreateContactByPhone(phone, opts) -> **crea siempre el Lead** (crm.lead.add).
  2) ensureLead(args) -> **crea siempre el Lead** (crm.lead.add).
- NO toca citas, timeline, deals, ni otras firmas. Si se llaman, funcionan igual.

Env requerido:
- BITRIX_WEBHOOK_BASE = https://<dominio>.bitrix24.es/rest/<USER_ID>/<TOKEN>/   (con slash final)
- LOG_LEVEL=debug (opcional)

Prueba: al enviar un mensaje con cualquier texto, verás POST a .../crm.lead.add.json y {"result": <id>}.
