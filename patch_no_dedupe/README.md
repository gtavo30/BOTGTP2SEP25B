Patch: quitar deduplicación (manteniendo el resto de funciones)
===============================================================

Este ZIP es un *drop-in replacement* para **src/bitrix.js** del bot.
Solo elimina la lógica de deduplicación: ahora SIEMPRE crea el Lead en Bitrix
(`crm.lead.add.json`) y mantiene el resto de funciones (citas, timeline, etc.) tal
como las invoque tu código actual.

Cómo aplicar
------------
1) En tu repo del bot, **reemplaza** el archivo `src/bitrix.js` por el de este ZIP.
2) Confirma en Render:
   - `BITRIX_WEBHOOK_BASE=https://<tu-dominio>.bitrix24.es/rest/<USER_ID>/<TOKEN>/`  (con `/` final)
3) Deploy.
4) Prueba: enviar "Quiero info de Villa Venetto" (Lead debe crearse con owner 197).

Notas
-----
- No se consulta `crm.contact.list` ni `crm.lead.list`.
- Se respeta la asignación: Venetto→197, otros→4/185.
- Si tu flujo crea Deal o actividades, ese código seguirá funcionando (este módulo
  expone helpers compatibles y no cambia nombres públicos).
