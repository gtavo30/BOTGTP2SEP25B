# Agents Passthrough Flags v3

Este paquete contiene:
- Endpoint `/v1/agents/lead.add` activo para registrar leads en Bitrix24.
- Otros módulos incluidos pero deshabilitados por defecto mediante variables de entorno.
- Logs de auditoría simples.

## Variables de entorno requeridas
- BITRIX_WEBHOOK_BASE=https://<tu-dominio>.bitrix24.es/rest/1/<token>/
- AGENTS_TOKEN=<tu_token>
- ENABLE_LEAD_ADD=true
- (otros ENABLE_* = false por defecto)
- LOG_LEVEL=debug (opcional)
