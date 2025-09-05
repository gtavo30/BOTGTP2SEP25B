import express from 'express';
import { registerLead, addTimelineCommentToDeal } from './bitrix.js';
import { auditLog } from './logger.js';

const router = express.Router();

// Auth Bearer minimal
router.use((req, res, next) => {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!process.env.AGENTS_TOKEN || token !== process.env.AGENTS_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
});

// Lead passthrough (activo por bandera; default ON si no está definida)
const leadOn = String(process.env.ENABLE_LEAD_ADD ?? 'true').toLowerCase() === 'true';
if (leadOn) {
  router.post('/lead.add', async (req, res) => {
    const correlationId = Date.now().toString();
    try {
      auditLog('IN', correlationId, { path: 'lead.add', body: req.body });
      const result = await registerLead(req.body);
      auditLog('OK', correlationId, result);
      res.json(result);
    } catch (err) {
      auditLog('ERR', correlationId, err?.response?.data || err.message);
      res.status(err?.response?.status || 500).json({ error: err?.response?.data || err.message });
    }
  });
}

// Placeholders desactivados
const off = (name)=>(req,res)=>res.status(501).json({ error: `${name} disabled` });
const flags = (k)=> String(process.env[k]||'false').toLowerCase()==='true';

if (flags('ENABLE_TIMELINE')) router.post('/timeline.add', off('timeline.add'));
if (flags('ENABLE_ACTIVITIES')) router.post('/activity.add', off('activity.add'));
if (flags('ENABLE_APPOINTMENTS')) router.post('/appointment.create', off('appointment.create'));
if (flags('ENABLE_FOLLOWUP')) router.post('/followup.schedule', off('followup.schedule'));
if (flags('ENABLE_VENDOR_NOTIFY')) router.post('/vendor.notify', off('vendor.notify'));
if (flags('ENABLE_CATALOG')) router.post('/catalog.send', off('catalog.send'));
if (flags('ENABLE_SEO')) router.post('/seo.brief', off('seo.brief'));
if (flags('ENABLE_ADS')) router.post('/ads.copies', off('ads.copies'));

export default router;
