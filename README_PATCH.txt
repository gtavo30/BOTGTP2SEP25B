PATCH de server.js para que el bot RESPONDA por WhatsApp Cloud (eco).

Variables de entorno necesarias en Render:
- VERIFY_TOKEN        (para validación del webhook)
- WHATSAPP_TOKEN      (token de acceso de WhatsApp Cloud / Graph API)
- PHONE_NUMBER_ID     (ID del número de WhatsApp, ej. 123456789012345)

Instrucciones:
1) Reemplaza tu server.js por este server.js (CommonJS).
2) Asegura en package.json: "start": "node server.js"
3) En Render, define las env vars anteriores.
4) Deploy y prueba enviando un WhatsApp. El bot debe responder: "👋 Recibido: <tu texto>".
