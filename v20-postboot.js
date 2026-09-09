(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
const ROLE_KEY='bs-demo-role-v4';
const FALLBACK_ROLE='bs-v20-fallback-role';
const hasSupabase=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey);
const ROLES=[
  ['public','Élève / Parent','Accès public'],
  ['teacher_as','Association Sportive','Enseignant AS'],
  ['admin','Administrateur','Gestion complète'],
  ['educator_football','Section Football','Éducateur football'],
  ['educator_gymnastique','Sport-études Gymnastique','Éducateur gymnastique'],
  ['educator_escalade','Option Escalade','Éducateur escalade']
];
const ROLE_BRAND={
 public:{logo:'assets/logo-as.png',label:'ASSOCIATION SPORTIVE\nDU BON SAUVEUR'},
 teacher_as:{logo:'assets/logo-as.png',label:'ASSOCIATION SPORTIVE\nDU BON SAUVEUR'},
 admin:{logo:'assets/logo-as.png',label:'ASSOCIATION SPORTIVE\nDU BON SAUVEUR'},
 educator_football:{logo:'assets/logo-football.png',label:'SECTION FOOTBALL'},
 educator_gymnastique:{logo:'assets/logo-gymnastique.png',label:'SPORT-ÉTUDES\nGYMNASTIQUE'},
 educator_escalade:{logo:'assets/logo-escalade.png',label:'OPTION ESCALADE'}
};
const POLES=[
  {key:'as',eyebrow:'ASSOCIATION',label:'Association Sportive',desc:'Activités, compétitions et rendez-vous AS.',logo:'assets/logo-as.png',search:'Association Sportive'},
  {key:'football',eyebrow:'SECTION',label:'Section Football',desc:'Entraînements, rencontres et convocations.',logo:'assets/logo-football.png',search:'Section Football'},
  {key:'gym',eyebrow:'SPORT-ÉTUDES',label:'Gymnastique',desc:'Planning, entraînements et informations.',logo:'assets/logo-gymnastique.png',search:'Sport-études Gymnastique'},
  {key:'escalade',eyebrow:'OPTION',label:'Escalade',desc:'Séances, sorties et convocations.',logo:'assets/logo-escalade.png',search:'Option Escalade'}
];
const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const role=()=>window.app?.role?.()||localStorage.getItem(ROLE_KEY)||'public';

const rememberedRole=localStorage.getItem(FALLBACK_ROLE);
if(cfg.demoMode===true&&!hasSupabase&&ROLES.some(([r])=>r===rememberedRole))localStorage.setItem(ROLE_KEY,rememberedRole);

function goPole(search){
  window.app?.go?.('calendar');
  setTimeout(()=>{
    if(typeof window.app?.search==='function') return window.app.search(search);
    const input=document.querySelector('.v19-search');
    if(input){input.value=search;input.dispatchEvent(new Event('input',{bubbles:true}));}
  },80);
}
function buildPoleSection(){
  const section=document.createElement('section');section.className='v20-poles-section';section.setAttribute('aria-label','Nos pôles sportifs');
  section.innerHTML=`<div class="v20-poles-head"><div><span class="v20-poles-kicker">BON SAUVEUR SPORT</span><h2>Nos pôles</h2><p>Retrouvez rapidement les informations de votre activité.</p></div><span class="v20-poles-hint">Choisir un pôle</span></div>`;
  const grid=document.createElement('div');grid.className='v20-poles-grid';
  POLES.forEach((p,index)=>{const btn=document.createElement('button');btn.type='button';btn.className=`v20-pole-card ${p.key}`;btn.setAttribute('aria-label',`Ouvrir ${p.label}`);btn.innerHTML=`<span class="v20-pole-topline"><span>${p.eyebrow}</span><b>0${index+1}</b></span><span class="v20-pole-medallion"><img src="${p.logo}" alt="" decoding="async"></span><span class="v20-pole-text"><strong>${p.label}</strong><small>${p.desc}</small></span><span class="v20-pole-footer"><span>Voir le calendrier</span><b aria-hidden="true">→</b></span>`;btn.addEventListener('click',()=>goPole(p.search));grid.appendChild(btn)});
  section.appendChild(grid);return section;
}

let instagramPromise=null;
async function fetchInstagram(){
  if(instagramPromise)return instagramPromise;
  instagramPromise=(async()=>{
    if(!cfg.instagramFeedEndpoint)return [];
    try{const r=await fetch(cfg.instagramFeedEndpoint,{headers:{Accept:'application/json'}});if(!r.ok)throw new Error('Flux indisponible');const payload=await r.json();return Array.isArray(payload?.data)?payload.data:[]}catch(e){console.warn('Instagram feed',e);return []}
  })();
  return instagramPromise;
}
function buildInstagramSection(){
  const section=document.createElement('section');section.className='v21-instagram';section.dataset.v21Instagram='1';
  section.innerHTML=`<div class="v21-instagram-head"><div><span class="v21-instagram-kicker">LA VIE DE L’AS</span><h2>Sur Instagram</h2><p>Les dernières images de l’Association Sportive.</p></div>${cfg.instagramUrl?`<a class="v21-instagram-profile" href="${esc(cfg.instagramUrl)}" target="_blank" rel="noopener noreferrer">@as_bs50 ↗</a>`:''}</div><div class="v21-instagram-grid"><div class="v21-instagram-loading">Chargement des dernières photos…</div></div>`;
  const grid=section.querySelector('.v21-instagram-grid');
  fetchInstagram().then(items=>{
    if(!section.isConnected)return;
    if(!items.length){grid.innerHTML=`<div class="v21-instagram-empty">Le flux photo est momentanément indisponible. Les publications restent accessibles depuis @as_bs50.</div>`;return}
    grid.innerHTML=items.slice(0,8).map(item=>{const src=item.media_type==='VIDEO'?(item.thumbnail_url||item.media_url):(item.media_url||item.thumbnail_url);const caption=String(item.caption||'Publication Instagram').trim();return `<a class="v21-instagram-item" href="${esc(item.permalink||cfg.instagramUrl||'#')}" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir la publication Instagram"><img src="${esc(src)}" alt="${esc(caption.slice(0,120))}" loading="lazy" decoding="async"><span>${esc(caption||'Publication Instagram')}</span></a>`}).join('');
  });
  return section;
}

function repairBrand(){
  const r=role(),brand=ROLE_BRAND[r]||ROLE_BRAND.public;
  document.body.classList.toggle('v21-role-brand',r!=='public');
  document.querySelectorAll('.v19-brand').forEach(el=>{const img=el.querySelector('img'),txt=el.querySelector('span');if(img){img.src=brand.logo;img.alt=brand.label.replace(/\n/g,' ');img.decoding='async'}if(txt)txt.innerHTML=brand.label.split('\n').map(esc).join('<br>')});
}
function cleanInjectedDocumentTabs(){
  if(role()==='public')return;
  document.querySelectorAll('.v19-bottom-nav button[aria-label="Documents"]').forEach(b=>b.remove());
  document.querySelectorAll('.v19-bottom-nav button').forEach(b=>{if(/^documents$/i.test((b.textContent||'').trim()))b.remove()});
}
function enhanceHome(){
  const hero=document.querySelector('.v19-hero');if(!hero)return;const container=hero.parentElement;if(!container)return;
  const r=role(),brand=ROLE_BRAND[r]||ROLE_BRAND.public;
  hero.classList.add('v20-hero-clean');
  hero.querySelectorAll('.v20-home-links,.v20-home-hub,.v20-hero-logo').forEach(el=>el.remove());
  let copy=hero.querySelector('.v20-hero-copy');if(!copy){copy=document.createElement('div');copy.className='v20-hero-copy';hero.insertBefore(copy,hero.firstChild);[...hero.children].filter(el=>el!==copy&&el.matches('.v19-kicker,h1,p')).forEach(el=>copy.appendChild(el))}
  let seal=hero.querySelector('.v20-hero-seal');if(!seal){seal=document.createElement('div');seal.className='v20-hero-seal';seal.innerHTML='<span class="v20-seal-glow"></span><img alt="" decoding="async">';hero.appendChild(seal)}
  const sealImg=seal.querySelector('img');if(sealImg){sealImg.src=brand.logo;sealImg.alt=brand.label.replace(/\n/g,' ')}
  container.querySelectorAll(':scope > .v20-poles-section,:scope > .v21-instagram').forEach(el=>el.remove());
  if(r==='public'){
    const poles=buildPoleSection();hero.insertAdjacentElement('afterend',poles);
    poles.insertAdjacentElement('afterend',buildInstagramSection());
  }
}
function enhanceConvocationLogos(){
  const logos={'Association Sportive':'assets/logo-as.png','Section Football':'assets/logo-football.png','Sport-études Gymnastique':'assets/logo-gymnastique.png','Option Escalade':'assets/logo-escalade.png'};
  document.querySelectorAll('.v19-conv-detail-head').forEach(head=>{if(head.querySelector('.v20-specialty-logo-tile'))return;const badge=head.querySelector('.v19-badge'),specialty=(badge?.textContent||'').trim(),src=logos[specialty],titleBlock=head.firstElementChild;if(!src||!titleBlock)return;const wrap=document.createElement('div');wrap.className='v20-conv-brandline';const tile=document.createElement('span');tile.className='v20-specialty-logo-tile';tile.innerHTML=`<img src="${src}" alt="" decoding="async">`;head.insertBefore(wrap,titleBlock);wrap.append(tile,titleBlock)});
}

function closeFallbackModal(){document.getElementById('v20-fallback-access')?.remove()}
function openFallbackAccess(){
  closeFallbackModal();const current=localStorage.getItem(FALLBACK_ROLE)||localStorage.getItem(ROLE_KEY)||'public';const w=document.createElement('div');w.id='v20-fallback-access';w.className='v19-modal-backdrop';
  w.innerHTML=`<div class="v19-modal" role="dialog" aria-modal="true" aria-labelledby="v20-fallback-title"><div class="v19-modal-head"><div><h2 id="v20-fallback-title">Choisir un espace</h2><p class="v20-fallback-note">Accès local temporaire — la connexion sécurisée sera activée avec Supabase.</p></div><button class="v19-icon-btn" type="button" aria-label="Fermer">×</button></div><div class="v19-modal-body"><div class="v20-access-grid">${ROLES.map(([r,label,sub])=>`<button type="button" class="v20-access-card ${r===current?'active':''}" data-role="${r}"><span>${label}</span><small>${sub}</small></button>`).join('')}</div></div></div>`;
  document.body.appendChild(w);w.querySelector('.v19-icon-btn').onclick=closeFallbackModal;w.addEventListener('click',e=>{if(e.target===w)closeFallbackModal()});w.querySelectorAll('[data-role]').forEach(btn=>btn.onclick=()=>setFallbackRole(btn.dataset.role));
}
function setFallbackRole(r){if(!ROLES.some(([x])=>x===r))return;localStorage.setItem(FALLBACK_ROLE,r);localStorage.setItem(ROLE_KEY,r);closeFallbackModal();location.reload()}
function installFallbackAccess(){if(!(cfg.demoMode===true&&!hasSupabase)||!window.app)return;const keep=localStorage.getItem(FALLBACK_ROLE);if(ROLES.some(([r])=>r===keep))localStorage.setItem(ROLE_KEY,keep);window.app.profile=openFallbackAccess;window.app.setRole=setFallbackRole}

function enhance(){repairBrand();cleanInjectedDocumentTabs();enhanceHome();enhanceConvocationLogos();installFallbackAccess()}
enhance();
new MutationObserver(enhance).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
