PATCH de server.js para que el bot RESPONDA (eco) y para probar salida con /__send_test.

Variables de entorno necesarias en Render:
- VERIFY_TOKEN        (para validación del webhook)
- WHATSAPP_TOKEN      (token de acceso de WhatsApp Cloud / Graph API)
- PHONE_NUMBER_ID     (ID del número de WhatsApp, ej. 123456789012345)
- GRAPH_VERSION       (opcional; por defecto v21.0)
- TEST_TO             (opcional; número destino para /__send_test)

Instrucciones:
1) Reemplaza tu server.js por este server.js.
2) "start": "node server.js" en package.json.
3) Define env vars arriba. 
4) Deploy.

Pruebas rápidas:
A) Salud:
   curl -i "https://TU-APP.onrender.com/"

B) Envío directo (sin WhatsApp entrante), REEMPLAZA 593999000111:
   curl -i "https://TU-APP.onrender.com/__send_test?to=593999000111&text=hola"

   - Debe devolver JSON con status 200 y en logs "WA SEND OK ..." 
   - Si hay error, logs mostrarán "WA SEND ERROR <status> {...}"

C) Webhook (si ya está conectado en Meta):
   Envía "hola" desde tu WhatsApp al número de WhatsApp Cloud.
   Debes recibir "👋 Recibido: hola".
