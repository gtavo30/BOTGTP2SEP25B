# WhatsApp Assistant Bot (Render-ready)

Ajustado para reflejar **todas las variables y banderas** acordadas en el chat anterior: validación de firmas de Meta, flags para **no crear deals**, control de guardado a Bitrix, notificación a vendedores, citas, tamaño máximo de archivos y lista de MIME permitidos.

## Variables de entorno (paridad con lo acordado)
- **Server/App**: `PORT`, `APP_BASE_URL`, `TIMEZONE`, `LOG_LEVEL`
- **Meta/WhatsApp**: `META_API_VERSION`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `ENABLE_META_SIGNATURE`, `WHATSAPP_APP_SECRET`
- **OpenAI**: `OPENAI_API_KEY`, `OPENAI_ASSISTANT_ID`, `OPENAI_MODEL` (opcional), `OPENAI_RUN_POLL_MS`
- **Bitrix** (elige modo): `BITRIX_WEBHOOK_BASE` **o** (`BITRIX_OAUTH_TOKEN` + `BITRIX_BASE_URL`)
  - Ajustes: `BITRIX_DEAL_CATEGORY_ID`, `BITRIX_DEAL_STAGE_ID`, `BITRIX_DISABLE_FALLBACK_DEAL`, `SAVE_TRANSCRIPTS_TO_BITRIX`, `SAVE_BOT_REPLIES_TO_BITRIX`
- **Citas**: `APPOINTMENTS_ENABLED`, `APPOINTMENT_DURATION_MIN`, `SELLER_WHATSAPP_NOTIFY`, `SELLER_NUMBERS`
- **Archivos**: `ALLOW_FILE_UPLOADS`, `MAX_FILE_MB`, `ALLOWED_MIME_LIST`

## Cambios clave
- **Validación de firma** (`X-Hub-Signature-256`) si `ENABLE_META_SIGNATURE=true`.
- Flag **`BITRIX_DISABLE_FALLBACK_DEAL`** para **no crear Deals** si no existen.
- Flags de **guardado en Bitrix** por tipo de mensaje.
- Control de **citas** y **alerta a vendedores** por envs.
- Límite de tamaño y MIME para **archivos adjuntos**.
- `META_API_VERSION` parametrizable.

## Deploy en Render
1. Subir el repo / ZIP.
2. Render detecta `render.yaml` con todas las `envVars`.
3. Pegar valores reales (usa `.env.sample` de guía).
4. En Meta: Webhook `https://<tu-app>.onrender.com/webhooks/whatsapp` y `WHATSAPP_VERIFY_TOKEN`.

## Flujo resumido
1) WhatsApp → webhook → (firma verificada)  
2) Persistimos thread por teléfono, Bitrix (según flags)  
3) Adjuntos → OpenAI Files (si habilitado y dentro de límites)  
4) Intento de **cita** (si enabled) → actividad en Bitrix + aviso a vendedores  
5) Respuesta del Assistant → WhatsApp + (opcional) timeline

