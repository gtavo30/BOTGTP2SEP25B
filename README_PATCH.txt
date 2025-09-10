PATCH: Reemplazar server.js (CommonJS) para corregir "Cannot use import statement outside a module".

Instrucciones:
1) Descarga este ZIP.
2) En tu proyecto, reemplaza el archivo server.js por el contenido de este server.js.
3) Asegúrate de que en package.json el script "start" sea: "node server.js".
4) Deploy en Render.
5) Prueba:
   curl -i https://TU-APP.onrender.com/
   curl -i -X POST https://TU-APP.onrender.com/webhook -H "Content-Type: application/json" --data '{"test":true}'
