(() => {
'use strict';

const VERSION='31.7.1';
const cfg=window.APP_CONFIG||{};
let busy=false;

const esc=value=>String(value??'').replace(/[&<>"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
const client=()=>window.__BS_SUPABASE_CLIENT||(cfg.supabaseUrl&&cfg.supabaseAnonKey&&window.supabase?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null);
const toast=(message,delay=3600)=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=message;document.body.appendChild(el);setTimeout(()=>el.remove(),delay)};

function injectCss(){
 if(document.getElementById('v317-security-css'))return;
 const style=document.createElement('style');style.id='v317-security-css';style.textContent=`
 #v317-security{z-index:1300}
 #v317-security .v19-modal{width:min(720px,calc(100vw - 28px))}
 .v317-security-lead{padding:18px;border:1px solid color-mix(in srgb,var(--blue) 20%,var(--line));border-radius:20px;background:color-mix(in srgb,var(--blue) 6%,var(--card));margin-bottom:16px}
 .v317-security-lead strong{display:block;font-size:20px;margin-bottom:6px}.v317-security-lead p{margin:0;color:var(--muted);line-height:1.45}
 .v317-mfa-grid{display:grid;grid-template-columns:220px 1fr;gap:20px;align-items:center}.v317-qr{width:220px;height:220px;border-radius:20px;background:#fff;padding:10px;border:1px solid var(--line)}
 .v317-secret{display:block;margin:10px 0;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--bg) 72%,var(--card));font-family:ui-monospace,SFMono-Regular,Menlo,monospace;word-break:break-all;font-size:12px}
 .v317-code{letter-spacing:.3em;text-align:center;font-weight:900;font-size:22px!important}.v317-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}.v317-status{min-height:22px;margin-top:10px;color:var(--muted);font-weight:750}.v317-status.error{color:#b4233a}
 @media(max-width:620px){.v317-mfa-grid{grid-template-columns:1fr}.v317-qr{width:190px;height:190px;margin:auto}.v317-actions{flex-direction:column}.v317-actions .v19-btn{width:100%}}
 `;document.head.appendChild(style);
}

function modal(title,body,{closable=false}={}){
 document.getElementById('v317-security')?.remove();
 const w=document.createElement('div');w.id='v317-security';w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal" role="dialog" aria-modal="true" aria-labelledby="v317-security-title"><div class="v19-modal-head"><h2 id="v317-security-title">${esc(title)}</h2>${closable?'<button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button>':''}</div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);if(closable){w.querySelector('[data-close]').onclick=()=>w.remove();w.addEventListener('click',event=>{if(event.target===w)w.remove()})}return w;
}

async function factors(){
 const sb=client();if(!sb?.auth?.mfa)throw new Error('Double authentification indisponible.');
 const {data,error}=await sb.auth.mfa.listFactors();if(error)throw error;
 const unique=new Map([...(data?.totp||[]),...(data?.all||[])].filter(factor=>factor?.factor_type==='totp').map(factor=>[factor.id,factor]));
 return[...unique.values()];
}

async function signOut(){
 try{if(typeof window.__BS_SIGN_OUT==='function')await window.__BS_SIGN_OUT();else await client()?.auth?.signOut()}catch{}
 document.getElementById('v317-security')?.remove();
}

async function challenge(){
 if(busy)return;busy=true;
 try{
  const factor=(await factors()).find(item=>item.status==='verified');
  if(!factor)throw new Error('Aucun second facteur vérifié n’est associé à ce compte.');
  const w=modal('Double authentification',`<div class="v317-security-lead"><strong>Protection administrateur</strong><p>Saisissez le code à 6 chiffres de votre application d’authentification pour ouvrir l’administration.</p></div><form class="v19-form" id="v317-challenge"><label class="full"><span>Code de sécurité</span><input class="v317-code" name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000"></label><div class="full v317-status" aria-live="polite"></div><div class="full v317-actions"><button type="button" class="v19-btn secondary" data-logout>Se déconnecter</button><button type="submit" class="v19-btn">Vérifier et ouvrir</button></div></form>`);
  const form=w.querySelector('#v317-challenge'),status=w.querySelector('.v317-status'),button=form.querySelector('[type=submit]');w.querySelector('[data-logout]').onclick=signOut;
  form.onsubmit=async event=>{event.preventDefault();const code=String(new FormData(form).get('code')||'').trim();if(!/^\d{6}$/.test(code)){status.textContent='Saisissez les 6 chiffres du code.';status.className='full v317-status error';return}button.disabled=true;button.textContent='Vérification…';try{const sb=client(),created=await sb.auth.mfa.challenge({factorId:factor.id});if(created.error)throw created.error;const checked=await sb.auth.mfa.verify({factorId:factor.id,challengeId:created.data.id,code});if(checked.error)throw checked.error;status.textContent='Sécurité validée. Ouverture…';toast('Double authentification validée.');setTimeout(()=>location.reload(),250)}catch(error){button.disabled=false;button.textContent='Vérifier et ouvrir';status.textContent='Code incorrect ou expiré. Réessayez.';status.className='full v317-status error'}};
  setTimeout(()=>form.querySelector('input')?.focus(),50);
 }catch(error){const w=modal('Sécurité administrateur',`<div class="v19-empty"><strong>La vérification renforcée est indisponible.</strong><br><br>${esc(error?.message||'Réessayez plus tard.')}<div class="v317-actions"><button class="v19-btn" data-logout>Se déconnecter</button></div></div>`);w.querySelector('[data-logout]').onclick=signOut}
 finally{busy=false}
}

async function enroll(){
 if(busy)return;
 const auth=window.__BS_AUTH_STATE?.();if(auth?.role!=='admin')return toast('Cette protection est réservée au compte administrateur.');
 busy=true;
 try{
  const sb=client(),existing=await factors(),verified=existing.find(item=>item.status==='verified');
  if(verified){toast('La double authentification est déjà activée sur ce compte.');return}
  for(const factor of existing.filter(item=>item.status!=='verified')){try{await sb.auth.mfa.unenroll({factorId:factor.id})}catch{}}
  const result=await sb.auth.mfa.enroll({factorType:'totp',friendlyName:'Administration AS Bon Sauveur'});if(result.error)throw result.error;
  const factor=result.data,qr=factor?.totp?.qr_code||'',secret=factor?.totp?.secret||'';
  const w=modal('Configurer la double authentification',`<div class="v317-security-lead"><strong>Protection renforcée du compte administrateur</strong><p>Scannez ce QR code avec une application d’authentification, puis saisissez le code généré. La protection ne sera activée qu’après cette validation.</p></div><div class="v317-mfa-grid"><img class="v317-qr" alt="QR code de double authentification"><div><div class="v19-meta">Clé de saisie manuelle :</div><code class="v317-secret">${esc(secret)}</code><form id="v317-enroll" class="v19-form"><label class="full"><span>Code à 6 chiffres</span><input class="v317-code" name="code" required inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="000000"></label><div class="full v317-status" aria-live="polite"></div><div class="full v317-actions"><button type="button" class="v19-btn secondary" data-cancel>Annuler</button><button type="submit" class="v19-btn">Activer la protection</button></div></form></div></div>`,{closable:true});
  w.querySelector('.v317-qr').src=qr;w.querySelector('[data-cancel]').onclick=async()=>{try{await sb.auth.mfa.unenroll({factorId:factor.id})}catch{}w.remove()};
  const form=w.querySelector('#v317-enroll'),status=w.querySelector('.v317-status'),button=form.querySelector('[type=submit]');
  form.onsubmit=async event=>{event.preventDefault();const code=String(new FormData(form).get('code')||'').trim();if(!/^\d{6}$/.test(code)){status.textContent='Saisissez les 6 chiffres du code.';status.className='full v317-status error';return}button.disabled=true;button.textContent='Activation…';try{const created=await sb.auth.mfa.challenge({factorId:factor.id});if(created.error)throw created.error;const checked=await sb.auth.mfa.verify({factorId:factor.id,challengeId:created.data.id,code});if(checked.error)throw checked.error;w.remove();toast('Double authentification activée.');}catch(error){button.disabled=false;button.textContent='Activer la protection';status.textContent='Le code n’a pas pu être vérifié. Réessayez.';status.className='full v317-status error'}};
  setTimeout(()=>form.querySelector('input')?.focus(),50);
 }catch(error){toast(error?.message||'Impossible de configurer la double authentification.',4800)}
 finally{busy=false}
}

injectCss();
window.__BS_OPEN_MFA_SETUP=enroll;
window.addEventListener('bs-admin-mfa-required',challenge);
window.addEventListener('bs-admin-mfa-error',challenge);
window.ASV317_SECURITY={version:VERSION,mode:'admin-mfa-after-enrollment'};
})();
