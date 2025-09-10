PATCH v4 — Lee VERIFY_TOKEN o WHATSAPP_VERIFY_TOKEN. Soporta /webhook y /webhooks/whatsapp.
Incluye eco y /__send_test.

ENV en Render:
- WHATSAPP_VERIFY_TOKEN  (o VERIFY_TOKEN)
- WHATSAPP_TOKEN
- PHONE_NUMBER_ID
- GRAPH_VERSION (opcional, default v21.0)
- TEST_TO (opcional)

Pasos:
1) Reemplaza tu server.js por este.
2) package.json: "start": "node server.js"
3) Deploy.

Pruebas:
- Verificación simulada (si tu token es 123456):
  curl -i "https://TU-APP.onrender.com/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=123456&hub.challenge=12345"
  (o /webhook)

- Envío directo:
  curl -i "https://TU-APP.onrender.com/__send_test?to=593999000111&text=hola"
