(() => {
'use strict';
const cfg=window.APP_CONFIG||{};
const URL=cfg.instagramUrl||'https://www.instagram.com/as_bs50/';

function replaceInstagram(){
  document.querySelectorAll('.v21-instagram').forEach(section=>{
    if(section.dataset.v21SimpleInstagram==='1') return;
    section.dataset.v21SimpleInstagram='1';
    section.innerHTML=`
      <div class="v21-instagram-simple">
        <div class="v21-instagram-simple-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="5"></rect>
            <circle cx="12" cy="12" r="4"></circle>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"></circle>
          </svg>
        </div>
        <div class="v21-instagram-simple-copy">
          <span class="v21-instagram-kicker">LA VIE DE L’AS</span>
          <h2>Suivez-nous sur Instagram</h2>
          <p>Photos, résultats, compétitions et actualités de l’Association Sportive.</p>
        </div>
        <a class="v21-instagram-simple-btn" href="${URL}" target="_blank" rel="noopener noreferrer" aria-label="Voir les actualités de l’AS sur Instagram">
          <span>Voir les actualités de l’AS</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>`;
  });
}

const style=document.createElement('style');
style.textContent=`
.v21-instagram-simple{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:22px;padding:24px 26px;border:1px solid rgba(19,33,58,.10);border-radius:24px;background:#fff;box-shadow:0 10px 28px rgba(19,33,58,.06)}
.v21-instagram-simple-icon{width:64px;height:64px;border-radius:18px;display:grid;place-items:center;background:linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045);color:#fff;box-shadow:0 10px 24px rgba(131,58,180,.22)}
.v21-instagram-simple-icon svg{width:34px;height:34px}
.v21-instagram-simple-copy h2{margin:3px 0 4px;font-size:clamp(1.35rem,2.2vw,2rem);color:#13213A}
.v21-instagram-simple-copy p{margin:0;color:#6B7890;font-weight:600}
.v21-instagram-simple-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px 18px;border-radius:15px;background:#0757C9;color:#fff;text-decoration:none;font-weight:800;white-space:nowrap;box-shadow:0 8px 20px rgba(7,87,201,.18)}
.v21-instagram-simple-btn:hover{transform:translateY(-1px)}
@media(max-width:720px){.v21-instagram-simple{grid-template-columns:auto 1fr;padding:18px;gap:14px}.v21-instagram-simple-icon{width:54px;height:54px;border-radius:16px}.v21-instagram-simple-btn{grid-column:1/-1;width:100%;white-space:normal;text-align:center}.v21-instagram-simple-copy h2{font-size:1.35rem}.v21-instagram-simple-copy p{font-size:.95rem}}
`;
document.head.appendChild(style);

let queued=false;
function run(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;replaceInstagram()})}
run();
new MutationObserver(run).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
})();
