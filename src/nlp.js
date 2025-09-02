export function parseIntent(text) {
  const t = text.toLowerCase();
  const booking = /(agendar|agendame|agenda|cita|reunion|visita)/.test(t);
  if (booking) {
    // naive date parser – expect formats like 'mañana 10am', 'hoy 15:30', 'viernes 9'
    // For production, integrate a proper NLP lib or duckling server.
    const matchHour = t.match(/(\d{1,2})([:\.](\d{2}))?\s*(am|pm)?/);
    let hour = 10, minute = 0;
    if (matchHour) {
      hour = Number(matchHour[1]);
      minute = matchHour[3] ? Number(matchHour[3]) : 0;
      const ap = matchHour[4];
      if (ap === 'pm' && hour < 12) hour += 12;
    }
    let date = new Date();
    if (/mañana/.test(t)) date.setDate(date.getDate()+1);
    // Default timezone assumption; Render uses UTC. Users in America/Guayaquil (-05:00).
    const iso = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hour+5, minute, 0)).toISOString(); // crude shift
    return { type: 'book', datetimeISO: iso };
  }
  return { type: 'chat' };
}
