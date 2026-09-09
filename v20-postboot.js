(() => {
'use strict';
const cfg=window.APP_CONFIG||{};

function enhancePublicHome(){
  const hero=document.querySelector('.v19-hero');
  if(!hero)return;

  if(!hero.querySelector('.v20-hero-logo')){
    const img=document.createElement('img');
    img.className='v20-hero-logo';
    img.src='assets/logo-as.png';
    img.alt='Logo de l’Association Sportive du Bon Sauveur';
    img.decoding='async';
    hero.appendChild(img);
  }

  if(!hero.querySelector('.v20-home-links')){
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
    hero.appendChild(links);
  }
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

function enhance(){
  repairBrandLogo();
  enhancePublicHome();
  ensureDocumentNavigation();
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
