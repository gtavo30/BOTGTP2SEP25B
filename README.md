Patch v3: sin deduplicación + exports completos (compatibles con webhooks.js)
============================================================================

Este patch reemplaza **src/bitrix.js** y corrige el error de deploy:
`addTimelineCommentToDeal` faltante. Además exporta todas las funciones que
`src/webhooks.js` importa, manteniendo el resto del comportamiento.

Incluye:
- **Sin deduplicación**: siempre crea Lead en `crm.lead.add`.
- `findOrCreateContactByPhone` **crea Lead** (compatibilidad).
- Exports completos: `findDealByContact`, `createDeal`, `addTimelineCommentToDeal`,
  `createAppointment`, `addActivity`, `updateDeal`, `addLead`, `ensureLead`.
- `createAppointment` respeta `APPOINTMENTS_ENABLED=false` (si está en env, omite la llamada).

Cómo aplicar
------------
1) Reemplaza `src/bitrix.js` por este archivo.
2) Variables en Render:
   - `BITRIX_WEBHOOK_BASE=https://<dominio>.bitrix24.es/rest/<USER_ID>/<TOKEN>/` (slash final).
   - (opcional) `APPOINTMENTS_ENABLED=false` para omitir citas.
3) Redeploy.
