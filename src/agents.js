import express from 'express';
import { registerLead } from './bitrix.js';
import { auditIn, auditOk, auditErr } from './logger.js';

const router = express.Router();

// SIN AUTH — passthrough puro (lo pediste explícito)
router.post('/lead.add', async (req, res) => {
  const t0 = Date.now();
  const cid = Math.random().toString(36).slice(2,10);
  const { fields, meta } = req.body || {};
  auditIn('lead.add', cid, { from_phone: meta?.from_phone, fields });

  try {
    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ ok: false, error: 'missing fields' });
    }
    const result = await registerLead(fields);
    auditOk('lead.add', cid, { method: 'crm.lead.add', result_id: result?.result, duration_ms: Date.now()-t0 });
    return res.json({ ok: true, result });
  } catch (err) {
    const status = err?.response?.status || 500;
    const body = err?.response?.data || err?.message || 'error';
    auditErr('lead.add', cid, { method: 'crm.lead.add', status, error: body, duration_ms: Date.now()-t0 });
    return res.status(status).json({ ok: false, error: body });
  }
});

export default router;
