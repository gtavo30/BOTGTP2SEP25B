FASE 0–1 — Passthrough a Bitrix (lead.add)
------------------------------------------
- No pidas teléfono: viene del canal/metadata.
- Pide/valida solo nombre y correo si faltan.
- Cuando tengas teléfono + nombre + correo + proyecto, llama la tool `register_lead`
  y pasa los campos a `fields` en formato Bitrix:
  - SOURCE_ID = WHATSAPP
  - TITLE = <nombre>
  - NAME  = <nombre>
  - PHONE = [{ VALUE: <telefono>, VALUE_TYPE: MOBILE }]
  - EMAIL = [{ VALUE: <correo>,  VALUE_TYPE: WORK   }]
  - COMMENTS = "Interesado en: <proyecto>"
  - ASSIGNED_BY_ID = 197 si 'Venetto'; si no, 4 o 185.
- No inventes/confirmes citas en Fase 0–1.
