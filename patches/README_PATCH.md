Cómo aplicar el snippet en webhooks.js (sin romper nada)
-------------------------------------------------------
1) Abre `src/webhooks.js` y localiza la parte donde **se crea el Lead** (la llamada actual
   a `ensureLead(...)` o `findOrCreateContactByPhone(...)`).
2) Pega el contenido de `snippets/lead_fields_block.js` **justo antes** de esa llamada.
3) Sustituye tu llamada actual por la que aparece al final del snippet:
   ```js
   await ensureLead({ phone, name: prospectName, email: prospectEmail, projectText: projectRaw });
   ```
4) Guarda, deploy y prueba.

No elimines tu lógica conversacional ni otras integraciones. El snippet solo **añade** los datos si están disponibles.
