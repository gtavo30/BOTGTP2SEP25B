import axios from 'axios';

export async function registerLead(data) {
  const url = `${process.env.BITRIX_WEBHOOK_BASE}crm.lead.add.json`;
  const payload = {
    fields: {
      TITLE: data.project || 'Nuevo Prospecto',
      NAME: data.name || 'WhatsApp Lead',
      PHONE: [{ VALUE: data.phone, VALUE_TYPE: 'MOBILE' }],
      EMAIL: data.email ? [{ VALUE: data.email, VALUE_TYPE: 'WORK' }] : [],
      COMMENTS: `Proyecto: ${data.project || 'No especificado'}`
    }
  };
  const res = await axios.post(url, payload);
  return res.data;
}
