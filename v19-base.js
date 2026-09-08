(()=>{
'use strict';
const V={
 VERSION:'v19-20260908-1',STORE:'bs-app-data-v4',ROLE_KEY:'bs-demo-role-v4',MIGRATION_KEY:'bs-v19-migrated',
 BLUE:'0757C9',NAVY:'13213A',YELLOW:'FFD21A',LIGHT:'F5F8FC',MUTED:'65738A',
 ECOLE_DIRECTE:'https://www.ecoledirecte.com/',LOGO:'assets/logo-as.png',
 TEACHERS:['Thomas GONTIER','Guillaume DHERVILLY','Lucas RIGAUX','Maxime PETIT'],
 LICENSE_CATEGORIES:['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne'],
 AGE_CATEGORIES:['Benjamin','Benjamine','Minime fille','Minime garçon','Lycéen','Lycéenne','Toutes catégories'],
 SPECIALTIES:['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'],
 EDU_SPECIALTIES:['Section Football','Option Escalade','Sport-études Gymnastique'],
 PAYMENTS:['Chèque','Espèces','Ticket Spot 50','Cart’@too','Virement'],
 SHOP_PAYMENTS:['Espèces','Virement','Chèque'],
 SIZES:['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'],
 CLASSES:['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP'],
 ACTIVITIES:['Réunion d’organisation','AG UGSEL Manche','Renforcement - Relaxation','Kayak','Volley-Ball','Handball','Cross de l’établissement','Cross-Country','Trisports','Football','Futsal','Basket-ball','Badminton','Tennis de table','Escalade','Gymnastique','Athlétisme','Course d’orientation','Natation','VTT','Laser Run','Multisports','Autre'],
 LEVELS:['Entraînement','District','Comité','Territoire','National','Autre'],
 ROLE_SPECIALTY:{educator_escalade:'Option Escalade',educator_football:'Section Football',educator_gymnastique:'Sport-études Gymnastique'},
 SPEC_COLOR:{'Association Sportive':'FFD21A','Section Football':'3F95F4','Option Escalade':'6974DE','Sport-études Gymnastique':'9C63D5'}
};
V.esc=(v='')=>String(v??'').replace(/[&<>\"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
V.read=()=>{try{return JSON.parse(localStorage.getItem(V.STORE)||'{}')||{}}catch{return{}}};
V.write=d=>localStorage.setItem(V.STORE,JSON.stringify(d));
V.role=()=>localStorage.getItem(V.ROLE_KEY)||'public';
V.isAdmin=()=>V.role()==='admin';
V.isManager=()=>['teacher_as','admin'].includes(V.role());
V.edu=()=>V.ROLE_SPECIALTY[V.role()]||null;
V.uid=(p='x')=>p+Math.random().toString(36).slice(2,10);
V.norm=(s='')=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').trim();
V.today=()=>new Date().toISOString().slice(0,10);
V.fmtLong=d=>!d?'—':new Intl.DateTimeFormat('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(d+'T12:00:00'));
V.fmtShort=d=>!d?'':new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00'));
V.clean=s=>String(s||'export').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9_-]+/g,'_').replace(/^_+|_+$/g,'');
V.studentName=(d,id)=>(d.students||[]).find(s=>s.id===id)?.fullName||(d.licenses||[]).find(l=>l.studentId===id)?.fullName||'';
V.options=(items,current='',blank='')=>(blank!==null?`<option value="">${V.esc(blank)}</option>`:'')+items.map(x=>`<option value="${V.esc(x)}" ${x===current?'selected':''}>${V.esc(x)}</option>`).join('');
V.hex=hex=>{hex=hex.replace('#','');return[parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]};
V.logoData=async()=>{try{const r=await fetch(V.LOGO);const b=await r.blob();return await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(b)})}catch{return null}};
function closeModal(){document.getElementById('v19-modal')?.remove()}
V.modal=(title,body,wide=true)=>{closeModal();const w=document.createElement('div');w.id='v19-modal';w.className='modal-backdrop';w.innerHTML=`<div class="modal ${wide?'wide':''} v19-modal"><div class="modal-head"><h2>${V.esc(title)}</h2><button class="icon-btn" type="button" data-v19-close>×</button></div>${body}</div>`;document.body.appendChild(w);w.querySelector('[data-v19-close]').onclick=closeModal;w.addEventListener('click',e=>e.target===w&&closeModal());return w};
V.closeModal=closeModal;
window.ASV7=V;
(function migrate(){
 if(localStorage.getItem(V.MIGRATION_KEY)===V.VERSION)return;
 const d=V.read();
 d.licenses=(d.licenses||[]).map(l=>{let c=l.category||'';if(/^Section foot /i.test(c))c=c.replace(/^Section foot /i,'');if(c==='Lycée')c='Lycéen';if(!V.LICENSE_CATEGORIES.includes(c))c=V.LICENSE_CATEGORIES[0];return{...l,category:c}});
 d.convocations=(d.convocations||[]).map(c=>{let info=String(c.extraInfo||'').trim(),eq=String(c.equipment||'').trim();if(eq&&!V.norm(info).includes(V.norm(eq)))info=[info,eq].filter(Boolean).join(' · ');const x={...c,teacher:c.teacher||'',extraInfo:info};delete x.equipment;return x});
 d.specialtyNotes=d.specialtyNotes||{};V.EDU_SPECIALTIES.forEach(s=>d.specialtyNotes[s]=d.specialtyNotes[s]||{message:'',expiresAt:'',active:false});
 d.products=(d.products||[]).map(p=>({...p,sizes:V.SIZES}));
 V.write(d);localStorage.setItem(V.MIGRATION_KEY,V.VERSION);
})();
})();