(() => {
'use strict';
const HELLOASSO='https://www.helloasso.com/associations/association-sportive-les-chamois/boutiques/boutique-de-l-association-sportive';
const SIZES=['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const PAYMENTS=['Espèces','Chèque','Virement'];
const CLASSES=['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP','Enseignant','Personnel'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const euro=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0));
const uuid=()=>crypto.randomUUID();
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris'}).format(new Date());
const data=()=>window.app.readData();
const products=()=>data().products.filter(p=>p.active!==false&&(!p.deadline||p.deadline>=today()));
const opts=(xs,value)=>xs.map(x=>`<option value="${esc(x)}" ${x===value?'selected':''}>${esc(x)}</option>`).join('');
const instructions=method=>method==='Chèque'?"Chèque à l’ordre de l’AS du Bon Sauveur, à transmettre à un enseignant d’EPS.":method==='Espèces'?"Espèces à transmettre à un enseignant d’EPS.":"Après l’enregistrement, vous serez redirigé vers HelloAsso. Sélectionnez à nouveau les mêmes articles, tailles et quantités pour régler votre commande. Le paiement sera vérifié par l’équipe EPS.";
let cart=[];
function openCart(productId){
 const available=products();if(productId){const p=available.find(p=>p.id===productId);if(!p)return;cart.push({productId:p.id,size:'M',quantity:1})}
 document.getElementById('v32-cart')?.remove();
 const modal=document.createElement('div');modal.id='v32-cart';modal.className='v19-modal-backdrop';
 modal.innerHTML=`<div class="v19-modal wide" role="dialog" aria-modal="true" aria-labelledby="v32-title"><div class="v19-modal-head"><div><div class="v19-kicker">BOUTIQUE AS</div><h2 id="v32-title">Mon panier</h2></div><button type="button" class="v19-icon-btn" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body"><form class="v19-form" id="v32-checkout"><div class="full" data-items></div><button class="v19-btn secondary full" type="button" data-add>+ Ajouter un autre article</button><div class="full v32-total" data-total></div><label><span>Nom</span><input name="lastName" required minlength="2" maxlength="80" autocomplete="family-name"></label><label><span>Prénom</span><input name="firstName" required minlength="2" maxlength="80" autocomplete="given-name"></label><label class="full"><span>Classe / profil</span><select name="className" required><option value="">Choisir</option>${opts(CLASSES,'')}</select></label><label class="full"><span>Mode de paiement</span><select name="paymentMethod">${opts(PAYMENTS,'Chèque')}</select></label><p class="full v32-payment-note" role="status" data-payment></p><p class="full v221-inline-privacy">Ces informations servent à préparer votre commande et sont conservées jusqu’au 1er juillet de l’année scolaire concernée.</p><p class="full" role="alert" data-error></p><button type="submit" class="v19-btn yellow full" data-submit>Enregistrer ma commande</button></form></div></div>`;
 document.body.appendChild(modal);modal.querySelector('[data-close]').onclick=()=>modal.remove();
 const form=modal.querySelector('form'),items=modal.querySelector('[data-items]'),submit=modal.querySelector('[data-submit]'),error=modal.querySelector('[data-error]');
 let requestId=uuid(),lastIdentity='',busy=false;
 function renderItems(){
  items.innerHTML=cart.map((line,i)=>`<fieldset class="v32-cart-line" data-line="${i}"><legend>Article ${i+1}</legend><label><span>Modèle et finition</span><select data-field="productId">${available.map(p=>`<option value="${esc(p.id)}" ${p.id===line.productId?'selected':''}>${esc(p.name)} — ${euro(p.price)}</option>`).join('')}</select></label><label><span>Taille</span><select data-field="size">${opts(SIZES,line.size)}</select></label><label><span>Quantité</span><input data-field="quantity" type="number" min="1" max="10" value="${line.quantity}" required></label><button type="button" class="v19-link" data-remove="${i}">Retirer</button></fieldset>`).join('')||'<p>Votre panier est vide. Ajoutez un article.</p>';
  items.querySelectorAll('[data-field]').forEach(input=>input.onchange=()=>{const i=Number(input.closest('[data-line]').dataset.line),key=input.dataset.field;cart[i][key]=key==='quantity'?Number(input.value):input.value;total()});
  items.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{cart.splice(Number(b.dataset.remove),1);renderItems()});total();
 }
 function total(){const amount=cart.reduce((sum,l)=>sum+Number(available.find(p=>p.id===l.productId)?.price||0)*l.quantity,0);modal.querySelector('[data-total]').textContent=`${cart.reduce((n,l)=>n+l.quantity,0)} article(s) · Total : ${euro(amount)}`;submit.disabled=!cart.length||busy;updateCartButton()}
 function payment(){modal.querySelector('[data-payment]').textContent=instructions(form.elements.paymentMethod.value);submit.textContent=form.elements.paymentMethod.value==='Virement'?'Enregistrer et poursuivre sur HelloAsso':'Enregistrer ma commande'}
 modal.querySelector('[data-add]').onclick=()=>{if(cart.length>=20){error.textContent='20 lignes maximum par commande.';return}if(available[0])cart.push({productId:available[0].id,size:'M',quantity:1});renderItems()};
 form.elements.paymentMethod.onchange=payment;
 form.onsubmit=async event=>{
  event.preventDefault();if(busy||!cart.length)return;
  const fields={studentName:(form.elements.lastName.value.trim()+' '+form.elements.firstName.value.trim()).replace(/\s+/g,' '),className:form.elements.className.value,paymentMethod:form.elements.paymentMethod.value,items:cart.map(l=>({...l}))};
  const identity=JSON.stringify(fields);if(lastIdentity&&lastIdentity!==identity)requestId=uuid();lastIdentity=identity;
  if(!CLASSES.includes(fields.className)||fields.items.some(l=>!Number.isInteger(l.quantity)||l.quantity<1||l.quantity>10)){error.textContent='Vérifiez la classe et les quantités.';return}
  busy=true;form.querySelectorAll('input,select,button').forEach(x=>x.disabled=true);error.textContent='';submit.textContent='Enregistrement…';
  try{
   const cfg=window.APP_CONFIG||{},controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);let response;
   try{response=await fetch(cfg.supabaseUrl+'/functions/v1/public-order',{method:'POST',headers:{'Content-Type':'application/json',apikey:cfg.supabaseAnonKey},body:JSON.stringify({requestId,...fields}),signal:controller.signal,cache:'no-store',credentials:'omit'})}finally{clearTimeout(timer)}
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Commande non enregistrée. Réessayez.');
   cart=[];modal.querySelector('.v19-modal-body').innerHTML=`<div class="v2115-registration-success"><span>✓</span><h3>Commande enregistrée</h3><p>${esc((result.references||[result.reference]).filter(Boolean).join(' · '))}</p><p>${esc(instructions(fields.paymentMethod))}</p><p>Statut : en attente de paiement.</p>${fields.paymentMethod==='Virement'?`<a class="v19-btn yellow" href="${HELLOASSO}" rel="noopener noreferrer">Ouvrir HelloAsso</a>`:'<button class="v19-btn" data-done>Fermer</button>'}</div>`;
   modal.querySelector('[data-done]')?.addEventListener('click',()=>modal.remove());updateCartButton();
   if(modal.isConnected&&fields.paymentMethod==='Virement'&&!window.__BS_SHOP_PREVIEW)location.assign(HELLOASSO);
  }catch(e){error.textContent=e.name==='AbortError'?'Le serveur met trop de temps à répondre. Réessayez : la même commande sera reprise.':e.message;busy=false;form.querySelectorAll('input,select,button').forEach(x=>x.disabled=false);payment();total()}
 };
 renderItems();payment();
}
function updateCartButton(){
 if(window.app.route()!=='shop')return;
 const actions=document.querySelector('.v19-head-actions');if(!actions)return;
 let b=actions.querySelector('[data-v32-cart]');if(!b){b=document.createElement('button');b.className='v19-btn yellow';b.dataset.v32Cart='';b.onclick=()=>openCart();actions.appendChild(b)}b.textContent=`Mon panier${cart.length?' ('+cart.length+')':''}`;
 document.querySelectorAll('.v19-product button').forEach(b=>b.textContent='Ajouter au panier');
}
window.app.order=openCart;window.app.openCart=()=>openCart();window.ASV32_SHOP={instructions,helloAssoUrl:HELLOASSO};
window.addEventListener('bs-app-rendered',()=>requestAnimationFrame(updateCartButton));updateCartButton();
})();
