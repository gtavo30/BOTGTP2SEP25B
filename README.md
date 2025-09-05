Agents Passthrough — MÍNIMO (sin tokens, sin deduplicación)
============================================================

Qué hace
--------
- Expone **POST /v1/agents/lead.add** (sin auth, sin lógica extra).
- Reenvía EXACTO lo que mande el Asistente a Bitrix (`crm.lead.add.json`).
- NO pide teléfono, NO inventa campos, NO deduplica.

Variables de entorno (solo 1 obligatoria)
-----------------------------------------
- BITRIX_WEBHOOK_BASE = https://constructorasarmientorodas.bitrix24.es/rest/1/<token>/
- LOG_LEVEL           = debug  (opcional)

Cómo montarlo (2 líneas)
------------------------
En tu `server.js` agrega antes del `app.listen(...)`:

    import agentsRouter from './src/agents.js';
    app.use('/v1/agents', agentsRouter);

OpenAI (function/tool)
----------------------
- Registra la función `register_lead` (archivo OPENAI_TOOL.json).
- Cuando tengas nombre + correo + teléfono (del canal) + proyecto,
  llama la tool y el backend reenviará a Bitrix tal cual.

Prueba rápida (cURL)
--------------------
curl -X POST "https://<tu-app>/v1/agents/lead.add"   -H "Content-Type: application/json"   -d '{
    "fields": {
      "TITLE": "Juan Pérez",
      "NAME": "Juan Pérez",
      "SOURCE_ID": "WHATSAPP",
      "PHONE": [{ "VALUE": "+593984679525", "VALUE_TYPE": "MOBILE" }],
      "EMAIL": [{ "VALUE": "juan.perez@example.com", "VALUE_TYPE": "WORK" }],
      "COMMENTS": "Interesado en: Porto Alegre",
      "ASSIGNED_BY_ID": 4
    }
  }'

Logs esperados
--------------
- [bitrix] POST crm.lead.add ... → payload exacto
- Respuesta con `result` = <ID del lead> si todo salió bien.
