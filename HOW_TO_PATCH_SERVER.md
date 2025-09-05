// HOW_TO_PATCH_SERVER.md
// Añade estas dos líneas en tu server.js (antes de app.listen):

import agentsRouter from './src/agents.js';
app.use('/v1/agents', agentsRouter);
