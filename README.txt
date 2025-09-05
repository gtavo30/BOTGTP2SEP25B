HOTFIX v3a — Passthrough exacto y compatibilidad
------------------------------------------------
1) `src/bitrix.js` ahora pasa EXACTAMENTE `fields` a Bitrix (`{ FIELDS: {...} }`)
   - No pone defaults de TITLE/NAME → evita "WhatsApp Lead".
   - Si el Assistant manda EMAIL/COMMENTS/ASSIGNED_BY_ID, llegarán tal cual.

2) Stub export `addTimelineCommentToDeal()` para evitar el error de import en `webhooks.js` del proyecto base.

3) `src/agents.js` usa Bearer y monta `/v1/agents/lead.add` (si ENABLE_LEAD_ADD=true o no definido).

**Montaje**
En tu `server.js`:
  import agentsRouter from './src/agents.js';
  app.use('/v1/agents', agentsRouter);

**Env**
  BITRIX_WEBHOOK_BASE = https://constructorasarmientorodas.bitrix24.es/rest/1/5ca93os4y8iz331a/
  AGENTS_TOKEN        = <token>
  ENABLE_LEAD_ADD     = true
  LOG_LEVEL           = debug (opcional)
