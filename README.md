Consolidado LEADS v1 — (sin dedupe) + pasa teléfono/nombre/email/proyecto
=========================================================================

Objetivo
--------
- **No** cambiar la lógica conversacional del bot.
- Asegurar que el **Lead** en Bitrix siempre se cree con:
  - PHONE (desde webhook, sin pedirlo)
  - TITLE/NAME (si hay nombre; si no, 'WhatsApp Lead')
  - EMAIL (si viene o lo detectas)
  - COMMENTS = "Interesado en: <proyecto>"
  - ASSIGNED_BY_ID: Venetto→197; otros→4/185
  - SOURCE_ID = WHATSAPP
- **Sin deduplicación** (siempre `crm.lead.add`).

Contenido del ZIP
-----------------
1) `src/bitrix.js`  → Reemplazo directo (payload completo a Bitrix).
2) `snippets/lead_fields_block.js` → Bloque listo para pegar en tu `src/webhooks.js` para pasar `name/email/projectText` junto con `phone`.
3) `patches/README_PATCH.md` → Guía para aplicar el snippet sin romper tu archivo actual.

Pasos (2-3 minutos)
-------------------
1) **Reemplaza** tu `src/bitrix.js` por el de este ZIP.
2) Abre tu `src/webhooks.js` y **antes de** la llamada a `ensureLead(...)` o `findOrCreateContactByPhone(...)`,
   pega el contenido de `snippets/lead_fields_block.js`.
   - No borres nada: solo añade el bloque y usa la llamada a `ensureLead({ phone, name, email, projectText })` que está al final del snippet.
3) Variables en Render (sin cambios):
   - `BITRIX_WEBHOOK_BASE=https://constructorasarmientorodas.bitrix24.es/rest/1/5ca93os4y8iz331a/`
   - `LOG_LEVEL=debug` (opcional)
   - `APPOINTMENTS_ENABLED=false` (para que no intente crear citas reales en esta fase)
4) Deploy y prueba desde un número nuevo: “Quiero info de Villa Venetto, mi correo es juan@ejemplo.com”.
   - Logs: `POST …/crm.lead.add.json` → `{"result": <id>}`.
   - En Bitrix, el lead debe tener: PHONE, NAME/TITLE, EMAIL, COMMENTS (proyecto), ASSIGNED_BY_ID correcto.

Compatibilidad
--------------
- No se toca `server.js` ni tus imports en `webhooks.js`.
- `bitrix.js` mantiene los exports que suelen usarse (`ensureLead`, `findOrCreateContactByPhone`, `addActivity`, `createDeal`, etc.).
