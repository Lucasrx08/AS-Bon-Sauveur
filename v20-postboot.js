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

const rememberedRole=localStorage.getItem(FALLBACK_ROLE);
if(cfg.demoMode===true&&!hasSupabase&&ROLES.some(([r])=>r===rememberedRole)){
  localStorage.setItem(ROLE_KEY,rememberedRole);
}

const POLES=[
  {key:'as',eyebrow:'ASSOCIATION',label:'Association Sportive',desc:'Activités, compétitions et rendez-vous AS.',logo:'assets/logo-as.png',search:'Association Sportive'},
  {key:'football',eyebrow:'SECTION',label:'Section Football',desc:'Entraînements, rencontres et convocations.',logo:'assets/logo-football.png',search:'Section Football'},
  {key:'gym',eyebrow:'SPORT-ÉTUDES',label:'Gymnastique',desc:'Planning, entraînements et informations.',logo:'assets/logo-gymnastique.png',search:'Sport-études Gymnastique'},
  {key:'escalade',eyebrow:'OPTION',label:'Escalade',desc:'Séances, sorties et convocations.',logo:'assets/logo-escalade.png',search:'Option Escalade'}
];

function goPole(search){
  window.app?.go?.('calendar');
  setTimeout(()=>{
    if(typeof window.app?.search==='function') return window.app.search(search);
    const input=document.querySelector('.v19-search');
    if(input){input.value=search;input.dispatchEvent(new Event('input',{bubbles:true}));}
  },80);
}

function buildHomeLinks(){
  const links=document.createElement('div');
  links.className='v20-home-links';
  const docs=document.createElement('button');
  docs.type='button';
  docs.className='v20-hero-action v20-hero-action-docs';
  docs.innerHTML='<span>Documents</span><span aria-hidden="true">→</span>';
  docs.addEventListener('click',()=>window.app?.go?.('documents'));
  links.appendChild(docs);
  if(cfg.instagramUrl){
    const insta=document.createElement('a');
    insta.className='v20-hero-action v20-hero-action-instagram';
    insta.href=cfg.instagramUrl;
    insta.target='_blank';
    insta.rel='noopener noreferrer';
    insta.setAttribute('aria-label','Ouvrir Instagram de l’Association Sportive');
    insta.innerHTML='<span>Instagram</span><span aria-hidden="true">↗</span>';
    links.appendChild(insta);
  }
  return links;
}

function buildPoleSection(){
  const section=document.createElement('section');
  section.className='v20-poles-section';
  section.setAttribute('aria-label','Nos pôles sportifs');
  section.innerHTML=`<div class="v20-poles-head"><div><span class="v20-poles-kicker">BON SAUVEUR SPORT</span><h2>Nos pôles</h2><p>Retrouvez rapidement les informations de votre activité.</p></div><span class="v20-poles-hint">Choisir un pôle</span></div>`;
  const grid=document.createElement('div');
  grid.className='v20-poles-grid';
  POLES.forEach((p,index)=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className=`v20-pole-card ${p.key}`;
    btn.setAttribute('aria-label',`Ouvrir ${p.label}`);
    btn.innerHTML=`<span class="v20-pole-topline"><span>${p.eyebrow}</span><b>0${index+1}</b></span><span class="v20-pole-medallion"><img src="${p.logo}" alt="" decoding="async"></span><span class="v20-pole-text"><strong>${p.label}</strong><small>${p.desc}</small></span><span class="v20-pole-footer"><span>Voir le calendrier</span><b aria-hidden="true">→</b></span>`;
    btn.addEventListener('click',()=>goPole(p.search));
    grid.appendChild(btn);
  });
  section.appendChild(grid);
  return section;
}

function enhancePublicHome(){
  const hero=document.querySelector('.v19-hero');
  if(!hero)return;
  const container=hero.parentElement;
  if(!container)return;
  hero.classList.add('v20-hero-clean');
  hero.querySelectorAll('.v20-home-hub,.v20-hero-logo').forEach(el=>el.remove());
  let copy=hero.querySelector('.v20-hero-copy');
  if(!copy){
    copy=document.createElement('div');
    copy.className='v20-hero-copy';
    hero.insertBefore(copy,hero.firstChild);
    [...hero.children].filter(el=>el!==copy&&el.matches('.v19-kicker,h1,p')).forEach(el=>copy.appendChild(el));
  }
  if(!copy.querySelector('.v20-home-links')) copy.appendChild(buildHomeLinks());
  if(!hero.querySelector('.v20-hero-seal')){
    const seal=document.createElement('div');
    seal.className='v20-hero-seal';
    seal.innerHTML='<span class="v20-seal-glow"></span><img src="assets/logo-as.png" alt="Association Sportive du Bon Sauveur" decoding="async">';
    hero.appendChild(seal);
  }
  if(!container.querySelector(':scope > .v20-poles-section')) hero.insertAdjacentElement('afterend',buildPoleSection());
}

function ensureDocumentNavigation(){
  const nav=document.querySelector('.v19-bottom-nav');
  if(!nav||[...nav.querySelectorAll('button')].some(b=>/documents/i.test(b.textContent||'')))return;
  const btn=document.createElement('button');
  btn.type='button';
  btn.setAttribute('aria-label','Documents');
  btn.innerHTML='<span aria-hidden="true">▤</span><span>Documents</span>';
  btn.addEventListener('click',()=>window.app?.go?.('documents'));
  nav.appendChild(btn);
}

function repairBrandLogo(){
  document.querySelectorAll('.v19-brand img').forEach(img=>{
    img.src='assets/logo-as.png';
    img.alt='Logo Association Sportive du Bon Sauveur';
    img.decoding='async';
  });
}

function enhanceConvocationLogos(){
  const logos={'Association Sportive':'assets/logo-as.png','Section Football':'assets/logo-football.png','Sport-études Gymnastique':'assets/logo-gymnastique.png','Option Escalade':'assets/logo-escalade.png'};
  document.querySelectorAll('.v19-conv-detail-head').forEach(head=>{
    if(head.querySelector('.v20-specialty-logo-tile'))return;
    const badge=head.querySelector('.v19-badge');
    const specialty=(badge?.textContent||'').trim();
    const src=logos[specialty];
    const titleBlock=head.firstElementChild;
    if(!src||!titleBlock)return;
    const wrap=document.createElement('div');
    wrap.className='v20-conv-brandline';
    const tile=document.createElement('span');
    tile.className='v20-specialty-logo-tile';
    tile.innerHTML=`<img src="${src}" alt="" decoding="async">`;
    head.insertBefore(wrap,titleBlock);
    wrap.append(tile,titleBlock);
  });
}

function closeFallbackModal(){document.getElementById('v20-fallback-access')?.remove();}
function openFallbackAccess(){
  closeFallbackModal();
  const current=localStorage.getItem(FALLBACK_ROLE)||localStorage.getItem(ROLE_KEY)||'public';
  const w=document.createElement('div');
  w.id='v20-fallback-access';
  w.className='v19-modal-backdrop';
  w.innerHTML=`<div class="v19-modal" role="dialog" aria-modal="true" aria-labelledby="v20-fallback-title"><div class="v19-modal-head"><div><h2 id="v20-fallback-title">Choisir un espace</h2><p class="v20-fallback-note">Accès local temporaire — la connexion sécurisée sera activée avec Supabase.</p></div><button class="v19-icon-btn" type="button" aria-label="Fermer">×</button></div><div class="v19-modal-body"><div class="v20-access-grid">${ROLES.map(([r,label,sub])=>`<button type="button" class="v20-access-card ${r===current?'active':''}" data-role="${r}"><span>${label}</span><small>${sub}</small></button>`).join('')}</div></div></div>`;
  document.body.appendChild(w);
  w.querySelector('.v19-icon-btn').onclick=closeFallbackModal;
  w.addEventListener('click',e=>{if(e.target===w)closeFallbackModal();});
  w.querySelectorAll('[data-role]').forEach(btn=>btn.onclick=()=>setFallbackRole(btn.dataset.role));
}
function setFallbackRole(role){
  if(!ROLES.some(([r])=>r===role))return;
  localStorage.setItem(FALLBACK_ROLE,role);
  localStorage.setItem(ROLE_KEY,role);
  closeFallbackModal();
  location.reload();
}
function installFallbackAccess(){
  if(!(cfg.demoMode===true&&!hasSupabase)||!window.app)return;
  const keep=localStorage.getItem(FALLBACK_ROLE);
  if(ROLES.some(([r])=>r===keep)) localStorage.setItem(ROLE_KEY,keep);
  window.app.profile=openFallbackAccess;
  window.app.setRole=setFallbackRole;
}

function enhance(){repairBrandLogo();enhancePublicHome();ensureDocumentNavigation();enhanceConvocationLogos();installFallbackAccess();}
enhance();
new MutationObserver(enhance).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});

// IMPORTANT: no automatic reload in Supabase mode. The auth bridge handles the session.
})();
