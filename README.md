Patch v2: quitar deduplicación y **forzar creación de Lead** en findOrCreateContactByPhone
=========================================================================================

Este ZIP reemplaza **src/bitrix.js**. Mantiene todas tus funciones pero:
- Elimina la deduplicación (no consulta contact/lead list).
- **Crea SIEMPRE un Lead** cuando se invoca `findOrCreateContactByPhone(phone)`
  (compatibilidad con builds donde esa función gatilla el alta).
- Se conserva la asignación Venetto→197; otros→4/185 (balanceado).
- Se mantienen helpers: addActivity, addDeal, updateDeal, addLead.
- `ensureLead()` sigue disponible si tu flujo lo usa.

Cómo aplicar
------------
1) Reemplaza `src/bitrix.js` en tu repo por este archivo.
2) En Render, verifica `BITRIX_WEBHOOK_BASE` con **slash final** (sin `.json`). Ej.:
   https://constructorasarmientorodas.bitrix24.es/rest/1/5ca93os4y8iz331a/
3) Redeploy.
4) Prueba desde WhatsApp: "Quiero info de Villa Venetto".
   Debes ver en logs: POST .../crm.lead.add.json  ->  {"result": <id>}
