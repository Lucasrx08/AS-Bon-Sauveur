(() => {
'use strict';

const VERSION='26.0.0';
const VERIFIED='bs-v20-verified-role';
const ROLE_KEY='bs-demo-role-v4';
const cfg=window.APP_CONFIG||{};
const sb=window.__BS_SUPABASE_CLIENT||(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null);
if(sb)window.__BS_SUPABASE_CLIENT=sb;
let mfaBusy=false;

const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const toast=(message,delay=3600)=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),delay)};

function injectCss(){
 if(document.getElementById('v26-css'))return;
 const s=document.createElement('style');s.id='v26-css';s.textContent=`
 #v26-security{z-index:1200}
 #v26-security .v19-modal{width:min(720px,calc(100vw - 28px))}
 .v26-security-lead{padding:18px;border:1px solid color-mix(in srgb,var(--blue) 20%,var(--line));border-radius:20px;background:color-mix(in srgb,var(--blue) 6%,var(--card));margin-bottom:16px}
 .v26-security-lead strong{display:block;font-size:20px;margin-bottom:6px}
 .v26-security-lead p{margin:0;color:var(--muted);line-height:1.45}
 .v26-mfa-grid{display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:center}
 .v26-qr{width:220px;height:220px;border-radius:20px;background:#fff;padding:10px;border:1px solid var(--line)}
 .v26-secret{display:block;margin:10px 0;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--bg) 72%,var(--card));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;font-size:12px}
 .v26-code{letter-spacing:.3em;text-align:center;font-weight:900;font-size:22px!important}
 .v26-lock-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}
 .v26-status{min-height:22px;margin-top:10px;color:var(--muted);font-weight:750}
 .v26-status.error{color:#b4233a}
 .v26-badge{display:inline-flex;align-items:center;gap:7px;border-radius:999px;padding:7px 10px;background:#e9f8ef;color:#176a36;border:1px solid #b9e5c9;font-size:12px;font-weight:900}
 @media(max-width:620px){.v26-mfa-grid{grid-template-columns:1fr}.v26-qr{width:190px;height:190px;margin:auto}.v26-lock-actions{flex-direction:column}.v26-lock-actions .v19-btn{width:100%}}
 `;document.head.appendChild(s);
}
function secureModal(title,body){
 document.getElementById('v26-security')?.remove();
 const w=document.createElement('div');w.id='v26-security';w.className='v19-modal-backdrop';w.setAttribute('role','presentation');
 w.innerHTML=`<div class="v19-modal" role="dialog" aria-modal="true" aria-labelledby="v26-security-title"><div class="v19-modal-head"><h2 id="v26-security-title">${esc(title)}</h2></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);return w;
}
async function signOut(){
 try{await sb?.auth.signOut()}catch{}
 sessionStorage.removeItem(VERIFIED);localStorage.setItem(ROLE_KEY,'public');location.reload();
}
async function verifiedTotpFactor(){
 const {data,error}=await sb.auth.mfa.listFactors();if(error)throw error;
 const all=[...(data?.totp||[]),...(data?.all||[])];
 return all.find(f=>f.factor_type==='totp'&&f.status==='verified')||null;
}
async function cleanupUnverifiedFactors(){
 try{
  const {data}=await sb.auth.mfa.listFactors();
  const all=[...(data?.totp||[]),...(data?.all||[])];
  const pending=all.filter(f=>f.factor_type==='totp'&&f.status!=='verified');
  for(const factor of pending){try{await sb.auth.mfa.unenroll({factorId:factor.id})}catch{}}
 }catch{}
}
async function showMfaChallenge(){
 if(mfaBusy)return;mfaBusy=true;
 try{
  const factor=await verifiedTotpFactor();if(!factor){mfaBusy=false;return showMfaEnrollment()}
  const w=secureModal('Double authentification',`
   <div class="v26-security-lead"><strong>Protection administrateur</strong><p>Saisissez le code à 6 chiffres de votre application d’authentification pour ouvrir l’administration.</p></div>
   <form class="v19-form" id="v26-challenge-form">
    <label class="full"><span>Code de sécurité</span><input class="v26-code" name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000"></label>
    <div class="full v26-status" aria-live="polite"></div>
    <div class="full v26-lock-actions"><button type="button" class="v19-btn secondary" data-logout>Se déconnecter</button><button type="submit" class="v19-btn">Vérifier et ouvrir</button></div>
   </form>`);
  const form=w.querySelector('#v26-challenge-form'),status=w.querySelector('.v26-status'),button=form.querySelector('[type=submit]');
  w.querySelector('[data-logout]').onclick=signOut;
  form.onsubmit=async e=>{
   e.preventDefault();const code=String(new FormData(form).get('code')||'').trim();if(!/^\d{6}$/.test(code)){status.textContent='Saisissez les 6 chiffres du code.';status.className='full v26-status error';return}
   button.disabled=true;button.textContent='Vérification…';status.textContent='Vérification du second facteur…';status.className='full v26-status';
   try{
    const challenge=await sb.auth.mfa.challenge({factorId:factor.id});if(challenge.error)throw challenge.error;
    const verify=await sb.auth.mfa.verify({factorId:factor.id,challengeId:challenge.data.id,code});if(verify.error)throw verify.error;
    status.textContent='Sécurité validée. Ouverture…';toast('Double authentification validée.');setTimeout(()=>location.reload(),250);
   }catch(error){button.disabled=false;button.textContent='Vérifier et ouvrir';status.textContent='Code incorrect ou expiré. Réessayez.';status.className='full v26-status error'}
  };
  setTimeout(()=>form.querySelector('input')?.focus(),50);
 }catch(error){
  secureModal('Sécurité administrateur',`<div class="v19-empty"><strong>La vérification MFA est momentanément indisponible.</strong><br><br>Par sécurité, l’administration reste verrouillée.<div class="v26-lock-actions"><button class="v19-btn" data-logout>Se déconnecter</button></div></div>`).querySelector('[data-logout]').onclick=signOut;
 }finally{mfaBusy=false}
}
async function showMfaEnrollment(){
 if(mfaBusy)return;mfaBusy=true;
 try{
  await cleanupUnverifiedFactors();
  const enrolled=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Administration AS Bon Sauveur'});if(enrolled.error)throw enrolled.error;
  const factor=enrolled.data,qr=factor?.totp?.qr_code||'',secret=factor?.totp?.secret||'';
  const w=secureModal('Sécuriser l’administration',`
   <div class="v26-security-lead"><strong>Activation obligatoire de la double authentification</strong><p>Scannez le QR code avec une application d’authentification (Google Authenticator, Microsoft Authenticator, 1Password, etc.), puis saisissez le code généré.</p></div>
   <div class="v26-mfa-grid"><img class="v26-qr" alt="QR code de double authentification"><div><div class="v19-meta">Si le QR code ne peut pas être scanné, saisissez cette clé manuellement :</div><code class="v26-secret">${esc(secret)}</code><form id="v26-enroll-form" class="v19-form"><label class="full"><span>Code à 6 chiffres</span><input class="v26-code" name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000"></label><div class="full v26-status" aria-live="polite"></div><div class="full v26-lock-actions"><button type="button" class="v19-btn secondary" data-logout>Se déconnecter</button><button type="submit" class="v19-btn">Activer la protection</button></div></form></div></div>`);
  w.querySelector('.v26-qr').src=qr;
  w.querySelector('[data-logout]').onclick=signOut;
  const form=w.querySelector('#v26-enroll-form'),status=w.querySelector('.v26-status'),button=form.querySelector('[type=submit]');
  form.onsubmit=async e=>{
   e.preventDefault();const code=String(new FormData(form).get('code')||'').trim();if(!/^\d{6}$/.test(code)){status.textContent='Saisissez les 6 chiffres du code.';status.className='full v26-status error';return}
   button.disabled=true;button.textContent='Activation…';status.textContent='Validation du second facteur…';status.className='full v26-status';
   try{
    const challenge=await sb.auth.mfa.challenge({factorId:factor.id});if(challenge.error)throw challenge.error;
    const verify=await sb.auth.mfa.verify({factorId:factor.id,challengeId:challenge.data.id,code});if(verify.error)throw verify.error;
    status.textContent='Double authentification activée.';toast('Protection administrateur activée.');setTimeout(()=>location.reload(),300);
   }catch(error){button.disabled=false;button.textContent='Activer la protection';status.textContent='Le code n’a pas pu être vérifié. Réessayez.';status.className='full v26-status error'}
  };
  setTimeout(()=>form.querySelector('input')?.focus(),50);
 }catch(error){
  secureModal('Sécurité administrateur',`<div class="v19-empty"><strong>Impossible d’activer la double authentification.</strong><br><br>${esc(error?.message||'Réessayez plus tard.')}<div class="v26-lock-actions"><button class="v19-btn" data-logout>Se déconnecter</button></div></div>`).querySelector('[data-logout]').onclick=signOut;
 }finally{mfaBusy=false}
}
async function ensureAdminMfa(){
 if(!sb||sessionStorage.getItem(VERIFIED)!=='admin'){document.getElementById('v26-security')?.remove();return}
 try{
  const {data:{session}}=await sb.auth.getSession();if(!session)return;
  const {data,error}=await sb.auth.mfa.getAuthenticatorAssuranceLevel();if(error)throw error;
  if(data?.currentLevel==='aal2'){document.getElementById('v26-security')?.remove();return}
  if(data?.nextLevel==='aal2')return showMfaChallenge();
  return showMfaEnrollment();
 }catch(error){return showMfaChallenge()}
}
async function registerPwa(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 try{
  const reg=await navigator.serviceWorker.register('./sw.js?v=26.0.0',{scope:'./'});
  window.ASV26=window.ASV26||{};window.ASV26.serviceWorker=true;
  reg.update().catch(()=>{});
 }catch(error){console.warn('V26 service worker',error)}
}
function patchVersion(){
 document.querySelectorAll('.v221-privacy-footer span').forEach(x=>x.textContent='V26');
 document.documentElement.dataset.appVersion='26';
}
function addAdminSecurityBadge(){
 if(sessionStorage.getItem(VERIFIED)!=='admin')return;
 const card=document.querySelector('.v19-page-head');
 if(!card||card.querySelector('[data-v26-secure]'))return;
 const badge=document.createElement('span');badge.dataset.v26Secure='1';badge.className='v26-badge';badge.textContent='Administration protégée MFA';card.appendChild(badge);
}
function afterRender(){patchVersion();addAdminSecurityBadge()}
function install(){
 injectCss();afterRender();registerPwa();
 window.addEventListener('bs-admin-mfa-required',ensureAdminMfa);
 window.addEventListener('bs-admin-mfa-error',ensureAdminMfa);
 new MutationObserver(()=>requestAnimationFrame(afterRender)).observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 setTimeout(ensureAdminMfa,250);
 window.ASV26={version:VERSION,mfa:'admin-required',pwa:'registered'};
}
install();
})();