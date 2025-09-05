function now(){ return new Date().toISOString(); }
const isDebug = () => String(process.env.LOG_LEVEL||'info').toLowerCase()==='debug';

export function auditIn(tool, cid, info={}){
  if (!isDebug()) return;
  const safe = JSON.stringify(info);
  console.log(`[AUDIT][IN] ts=${now()} tool=${tool} cid=${cid} ${safe}`);
}
export function auditOk(tool, cid, info={}){
  const safe = JSON.stringify(info);
  console.log(`[BITRIX][OK] ts=${now()} tool=${tool} cid=${cid} ${safe}`);
}
export function auditErr(tool, cid, info={}){
  const safe = JSON.stringify(info);
  console.error(`[BITRIX][ERR] ts=${now()} tool=${tool} cid=${cid} ${safe}`);
}
