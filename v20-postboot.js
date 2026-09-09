(() => {
'use strict';
const cfg=window.APP_CONFIG||{};

const POLES=[
  {key:'as',label:'Association Sportive',short:'AS',sub:'Activités & compétitions',logo:'assets/logo-as.png',search:'Association Sportive'},
  {key:'football',label:'Section Football',short:'Football',sub:'Section sportive',logo:'assets/logo-football.png',search:'Section Football'},
  {key:'gym',label:'Sport-études Gymnastique',short:'Gymnastique',sub:'Sport-études',logo:'assets/logo-gymnastique.png',search:'Sport-études Gymnastique'},
  {key:'escalade',label:'Option Escalade',short:'Escalade',sub:'Option sportive',logo:'assets/logo-escalade.png',search:'Option Escalade'}
];

function goPole(search){
  window.app?.go?.('calendar');
  setTimeout(()=>window.app?.search?.(search),50);
}

function buildHomeLinks(){
  const links=document.createElement('div');
  links.className='v20-home-links';

  const docs=document.createElement('button');
  docs.type='button';
  docs.className='v20-hero-action v20-hero-action-docs';
  docs.textContent='Documents';
  docs.addEventListener('click',()=>window.app?.go?.('documents'));
  links.appendChild(docs);

  if(cfg.instagramUrl){
    const insta=document.createElement('a');
    insta.className='v20-hero-action v20-hero-action-instagram';
    insta.href=cfg.instagramUrl;
    insta.target='_blank';
    insta.rel='noopener noreferrer';
    insta.setAttribute('aria-label','Ouvrir Instagram de l’Association Sportive');
    insta.textContent='Instagram ↗';
    links.appendChild(insta);
  }
  return links;
}

function buildPoleHub(){
  const hub=document.createElement('aside');
  hub.className='v20-home-hub';
  hub.setAttribute('aria-label','Les pôles sportifs du Bon Sauveur');
  hub.innerHTML='<div class="v20-hub-head"><span>NOS PÔLES</span><strong>Bon Sauveur Sport</strong></div>';
  const grid=document.createElement('div');
  grid.className='v20-pole-grid';

  POLES.forEach(p=>{
    const btn=document.createElement('button');
    btn.type='button';
    btn.className=`v20-pole-tile ${p.key}`;
    btn.setAttribute('aria-label',`Voir le calendrier — ${p.label}`);
    btn.innerHTML=`<span class="v20-pole-logo"><img src="${p.logo}" alt="" decoding="async"></span><span class="v20-pole-copy"><strong>${p.short}</strong><small>${p.sub}</small></span><span class="v20-pole-arrow" aria-hidden="true">→</span>`;
    btn.addEventListener('click',()=>goPole(p.search));
    grid.appendChild(btn);
  });
  hub.appendChild(grid);
  return hub;
}

function enhancePublicHome(){
  const hero=document.querySelector('.v19-hero');
  if(!hero)return;
  hero.classList.add('v20-hero-enhanced');

  hero.querySelectorAll('.v20-hero-logo').forEach(el=>el.remove());

  let copy=hero.querySelector('.v20-hero-copy');
  if(!copy){
    copy=document.createElement('div');
    copy.className='v20-hero-copy';
    hero.insertBefore(copy,hero.firstChild);
    [...hero.children].filter(el=>el!==copy&&el.matches('.v19-kicker,h1,p')).forEach(el=>copy.appendChild(el));
  }

  if(!copy.querySelector('.v20-home-links')) copy.appendChild(buildHomeLinks());
  if(!hero.querySelector('.v20-home-hub')) hero.appendChild(buildPoleHub());
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
  });
}

function enhanceConvocationLogos(){
  const logos={
    'Association Sportive':'assets/logo-as.png',
    'Section Football':'assets/logo-football.png',
    'Sport-études Gymnastique':'assets/logo-gymnastique.png',
    'Option Escalade':'assets/logo-escalade.png'
  };
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
    tile.innerHTML=`<img src="${src}" alt="${specialty}" decoding="async">`;
    head.insertBefore(wrap,titleBlock);
    wrap.appendChild(tile);
    wrap.appendChild(titleBlock);
  });
}

function enhance(){
  repairBrandLogo();
  enhancePublicHome();
  ensureDocumentNavigation();
  enhanceConvocationLogos();
}

enhance();
new MutationObserver(enhance).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});

if(!(cfg.supabaseUrl&&cfg.supabaseAnonKey))return;
if(sessionStorage.getItem('bs-v20-verified-role'))return;
const key='bs-v20-public-refresh';
if(sessionStorage.getItem(key))return;
sessionStorage.setItem(key,'1');
setTimeout(()=>location.reload(),1400);
})();
