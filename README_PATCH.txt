PATCH v5 — Respeta *exactamente* tus ENV principales:
- WHATSAPP_PHONE_ID (ID del número de WhatsApp)  ← **principal**
- WHATSAPP_VERIFY_TOKEN (token de verificación de Meta)
- WHATSAPP_TOKEN (token de WhatsApp Cloud)

También acepta como **fallback** (sin exigirlos):
- PHONE_NUMBER_ID, VERIFY_TOKEN, TOKEN, MYTOKEN

Incluye:
- Rutas GET/POST en /webhook y /webhooks/whatsapp
- Endpoint /__send_test para probar salida sin webhook
- Logging fuerte y diagnóstico de ENV (sin exponer secretos)

Instrucciones:
1) Reemplaza tu server.js por este server.js.
2) package.json: "start": "node server.js"
3) Verifica que en Render existan:
   - WHATSAPP_VERIFY_TOKEN
   - WHATSAPP_TOKEN (o TOKEN)
   - WHATSAPP_PHONE_ID (o PHONE_NUMBER_ID)
4) Deploy.

Pruebas:
- Salud:
  curl -i "https://TU-APP.onrender.com/"
- Handshake (usa tu token real):
  curl -i "https://TU-APP.onrender.com/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=TU_TOKEN&hub.challenge=12345"
- Envío directo:
  curl -i "https://TU-APP.onrender.com/__send_test?to=593999000111&text=hola"
