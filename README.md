Micro‑patch: pasar teléfono, nombre, email y proyecto a ensureLead (SIN cambiar la lógica del bot)
==================================================================================================

Este micro‑patch NO modifica la conversación del bot. Solo asegura que, desde el webhook,
se envíen al creador del Lead los campos disponibles: phone (del proveedor), name, email y projectText.

Qué contiene
------------
- `snippets/lead_fields_block.js`  → Bloque listo para pegar en `src/webhooks.js`.
- Instrucciones para añadirlo sin romper nada más.

Dónde pegarlo
-------------
En tu `src/webhooks.js`, ubica el lugar donde llamas a `ensureLead(...)` o `findOrCreateContactByPhone(...)`
y pega **antes** el bloque del archivo `snippets/lead_fields_block.js`. Luego reemplaza tu llamada existente
por la que aparece al final del bloque (mantiene tu flujo; solo añade datos).

Variables de entorno (sin cambios)
----------------------------------
- `BITRIX_WEBHOOK_BASE = https://<dominio>.bitrix24.es/rest/<USER_ID>/<TOKEN>/` (con `/` final)
- `LOG_LEVEL=debug` (opcional)
- `APPOINTMENTS_ENABLED=false` si no quieres crear actividades/citas aún.

Checklist de verificación
-------------------------
1) Deploy.
2) Desde un número nuevo: “Quiero info de Villa Venetto; mi correo es juan@ejemplo.com”.
3) Logs: POST …/crm.lead.add.json → `{"result": <id>}`.
4) Lead en Bitrix: PHONE (webhook), NAME/TITLE (si vino nombre; si no, 'WhatsApp Lead'),
   EMAIL (si vino), COMMENTS = “Interesado en: villa venetto”.
