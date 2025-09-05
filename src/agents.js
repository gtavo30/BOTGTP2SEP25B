import express from 'express';
import { registerLead } from './bitrix.js';
import { auditLog } from './logger.js';

const router = express.Router();

// Middleware de auth simple con token
router.use((req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${process.env.AGENTS_TOKEN}`) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// Lead passthrough (activo)
if (process.env.ENABLE_LEAD_ADD === 'true') {
  router.post('/lead.add', async (req, res) => {
    const correlationId = Date.now().toString();
    try {
      auditLog('IN', correlationId, req.body);
      const result = await registerLead(req.body);
      auditLog('OK', correlationId, result);
      res.json(result);
    } catch (err) {
      auditLog('ERR', correlationId, err.message);
      res.status(500).json({ error: err.message });
    }
  });
}

// Otros módulos desactivados (placeholders)
const modules = [
  'timeline.add',
  'activity.add',
  'appointment.create',
  'followup.schedule',
  'vendor.notify',
  'catalog.send',
  'seo.brief',
  'ads.copies'
];
modules.forEach((m) => {
  router.post(`/${m}`, (req, res) => {
    res.status(501).json({ error: `${m} disabled` });
  });
});

export default router;
