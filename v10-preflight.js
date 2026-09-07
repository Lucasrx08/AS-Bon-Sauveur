(()=>{
'use strict';
const STORE='bs-app-data-v4', MARK='bs-v10-preflight';
try{
  const raw=localStorage.getItem(STORE); if(!raw)return;
  const d=JSON.parse(raw)||{};
  const map={
    'Section foot Benjamin':'Benjamin','Section foot Benjamine':'Benjamine',
    'Section foot Minime garçon':'Minime garçon','Section foot Minime fille':'Minime fille',
    'Lycée':'Lycéen'
  };
  d.licenses=(d.licenses||[]).map(l=>({...l,category:map[l.category]||l.category}));
  d.convocations=(d.convocations||[]).map(c=>{
    const equipment=String(c.equipment||'').trim();
    let extra=String(c.extraInfo||'').trim();
    if(equipment && !extra.toLowerCase().includes(equipment.toLowerCase())) extra=[extra,equipment].filter(Boolean).join(' · ');
    const out={...c,teacher:c.teacher||'',extraInfo:extra}; delete out.equipment; return out;
  });
  d.orders=(d.orders||[]).map(o=>{const x={...o}; delete x.ready; return x;});
  d.specialtyNotes=d.specialtyNotes||{};
  ['Section Football','Option Escalade','Sport-études Gymnastique'].forEach(s=>{
    d.specialtyNotes[s]={message:'',expiresAt:'',active:false,...(d.specialtyNotes[s]||{})};
  });
  localStorage.setItem(STORE,JSON.stringify(d));
  localStorage.setItem(MARK,'v10');
}catch(e){console.warn('V10 preflight',e)}
})();
