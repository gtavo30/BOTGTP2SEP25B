// --- [SNIPPET] Mapeo mínimo para crear Lead con datos del webhook ---
// Pega este bloque **antes** de llamar a ensureLead(...) o findOrCreateContactByPhone(...).
// No cambia la lógica del bot: solo rellena campos desde el payload del proveedor.

const b = req.body || {};

// 1) Teléfono desde el proveedor (NO pedir al usuario)
let phone =
  b.from ||
  b.phone ||
  // Meta WhatsApp Cloud:
  b?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from ||
  b?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.wa_id ||
  // Twilio:
  (typeof b?.From === 'string' && b.From.replace('whatsapp:', '')) ||
  // Gupshup / otros:
  b?.payload?.source?.phone ||
  b?.sender?.phone;

if (phone && typeof phone === 'string') {
  phone = phone.replace(/^whatsapp:/, '');
  if (!phone.startsWith('+')) phone = '+' + phone;
}

// 2) Texto del usuario (para proyecto y detectar email si viene)
const userText =
  b.text || b.message ||
  b?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body || '';

// 3) Nombre (si lo trae el proveedor; si no, el Assistant lo pedirá)
const prospectName =
  b?.entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ||
  b?.sender?.name ||
  b?.profile_name || undefined;

// 4) Email (si ya viene en el texto; si no, undefined: lo pedirá el Assistant)
const emailMatch = String(userText).match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
const prospectEmail = emailMatch ? emailMatch[0] : undefined;

// 5) Proyecto en texto crudo (para asignación y COMMENTS)
const projectRaw = (userText || '').toLowerCase();

// --- Llamada al creador del lead (SIN dedupe, SIN preguntar en código) ---
// Usa una de las dos, según tu flujo:
await ensureLead({
  phone,
  name: prospectName,
  email: prospectEmail,
  projectText: projectRaw
});

// O bien:
// await findOrCreateContactByPhone(phone, {
//   name: prospectName,
//   email: prospectEmail,
//   projectText: projectRaw
// });
// --- [FIN SNIPPET] ---
