(() => {
'use strict';
const STORE='bs-app-data-v4';
const SPECIALTIES=['Association Sportive','Section Football','Option Escalade','Sport-études Gymnastique'];
const SIZES=['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL'];
const PAYMENTS=['Espèces','Virement','Chèque'];
const sb=window.__BS_SUPABASE_CLIENT||null;
const PRODUCT_IMAGE_BUCKET='public-assets';
const PRODUCT_IMAGE_FALLBACK='assets/logo-as.png';
const MAX_SOURCE_IMAGE_SIZE=15*1024*1024;
const MAX_STORED_IMAGE_SIZE=5*1024*1024;

const esc=s=>String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const uid=p=>p+Math.random().toString(36).slice(2,10);
const isAdmin=()=>window.app?.role?.()==='admin'&&sessionStorage.getItem('bs-v20-verified-role')==='admin';
const read=()=>window.app?.readData?.()||{};
const persist=d=>localStorage.setItem(STORE,JSON.stringify(d));
const toast=msg=>{const el=document.createElement('div');el.className='v19-toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),2700)};
const fmt=d=>d?new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d+'T12:00:00')):'—';
const money=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(n||0));

function modal(title,body,wide=true){
 document.getElementById('v21-admin-modal')?.remove();
 const w=document.createElement('div');w.id='v21-admin-modal';w.className='v19-modal-backdrop';
 w.innerHTML=`<div class="v19-modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="v21-admin-title"><div class="v19-modal-head"><h2 id="v21-admin-title">${esc(title)}</h2><button class="v19-icon-btn" type="button" aria-label="Fermer" data-close>×</button></div><div class="v19-modal-body">${body}</div></div>`;
 document.body.appendChild(w);const close=()=>w.remove();w.querySelector('[data-close]').onclick=close;w.addEventListener('click',e=>e.target===w&&close());return w;
}
function close(){document.getElementById('v21-admin-modal')?.remove()}
function opts(list,current=''){return list.map(x=>`<option value="${esc(x)}" ${x===current?'selected':''}>${esc(x)}</option>`).join('')}
async function remoteUpsert(table,row){if(!sb)return null;const {error}=await sb.from(table).upsert(row);if(error)throw error;return true}
async function remoteDelete(table,id){if(!sb)return null;const {error}=await sb.from(table).delete().eq('id',id);if(error)throw error;return true}
function refresh(route){close();window.app?.go?.(route)}

function normalizeProductImageUrl(value=''){
 const raw=String(value||'').trim();if(!raw)return PRODUCT_IMAGE_FALLBACK;
 try{
  const url=new URL(raw,location.href);
  if(!/(^|\.)drive\.google\.com$/i.test(url.hostname))return raw;
  const id=url.searchParams.get('id')||url.pathname.match(/\/d\/([^/]+)/)?.[1];
  return id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1600`:raw;
 }catch{return raw}
}
function storedProductImagePath(value=''){
 const marker='/storage/v1/object/public/'+PRODUCT_IMAGE_BUCKET+'/';
 try{const url=new URL(String(value||''),location.href),index=url.pathname.indexOf(marker);return index<0?'':decodeURIComponent(url.pathname.slice(index+marker.length))}catch{return''}
}
async function removeStoredProductImage(value=''){
 const path=storedProductImagePath(value);if(!path||!sb?.storage)return false;
 const {error}=await sb.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]);if(error)throw error;return true;
}
function imageFromFile(file){
 return new Promise((resolve,reject)=>{
  const objectUrl=URL.createObjectURL(file),image=new Image();
  image.onload=()=>{URL.revokeObjectURL(objectUrl);resolve(image)};
  image.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error('Cette photo ne peut pas être lue. Utilisez un fichier JPG, PNG ou WebP.'))};
  image.src=objectUrl;
 });
}
const canvasBlob=(canvas,type,quality)=>new Promise(resolve=>canvas.toBlob(resolve,type,quality));
async function optimizeProductImage(file){
 if(!file?.size)throw new Error('Aucune photo sélectionnée.');
 if(file.size>MAX_SOURCE_IMAGE_SIZE)throw new Error('La photo dépasse 15 Mo. Choisissez une image plus légère.');
 if(file.type&&!file.type.startsWith('image/'))throw new Error('Le fichier sélectionné n’est pas une image.');
 const image=await imageFromFile(file),maxSide=1600,scale=Math.min(1,maxSide/Math.max(image.naturalWidth||image.width,image.naturalHeight||image.height));
 const width=Math.max(1,Math.round((image.naturalWidth||image.width)*scale)),height=Math.max(1,Math.round((image.naturalHeight||image.height)*scale));
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const context=canvas.getContext('2d',{alpha:true});if(!context)throw new Error('Préparation de la photo impossible.');
 context.drawImage(image,0,0,width,height);
 let blob=await canvasBlob(canvas,'image/webp',0.84),extension='webp';
 if(!blob||blob.type!=='image/webp'){
  context.globalCompositeOperation='destination-over';context.fillStyle='#fff';context.fillRect(0,0,width,height);context.globalCompositeOperation='source-over';
  blob=await canvasBlob(canvas,'image/jpeg',0.84);extension='jpg';
 }
 if(!blob)throw new Error('Conversion de la photo impossible.');
 if(blob.size>MAX_STORED_IMAGE_SIZE)throw new Error('La photo reste trop lourde après optimisation. Choisissez une image plus petite.');
 return{blob,extension};
}
async function uploadProductImage(file,productId){
 if(!sb?.storage)throw new Error('Le stockage des photos est indisponible.');
 const prepared=await optimizeProductImage(file),safeId=String(productId||'product').replace(/[^a-z0-9_-]/gi,'')||'product';
 const token=crypto.randomUUID?.()||Math.random().toString(36).slice(2),path=`products/${safeId}-${Date.now()}-${token}.${prepared.extension}`;
 const {error}=await sb.storage.from(PRODUCT_IMAGE_BUCKET).upload(path,prepared.blob,{contentType:prepared.blob.type,cacheControl:'31536000',upsert:false});
 if(error)throw error;
 const {data}=sb.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path);
 if(!data?.publicUrl){await sb.storage.from(PRODUCT_IMAGE_BUCKET).remove([path]).catch(()=>{});throw new Error('Adresse publique de la photo introuvable.');}
 return{url:data.publicUrl,path};
}
function bindProductImagePreview(w,current=''){
 const fileInput=w.querySelector('[name="imageFile"]'),urlInput=w.querySelector('[name="image"]'),preview=w.querySelector('[data-product-image-preview] img'),status=w.querySelector('[data-image-status]');
 if(!fileInput||!urlInput||!preview)return;
 let objectUrl='';
 const show=src=>{preview.onerror=()=>{preview.onerror=null;preview.src=PRODUCT_IMAGE_FALLBACK};preview.src=normalizeProductImageUrl(src)};
 show(current||PRODUCT_IMAGE_FALLBACK);
 fileInput.onchange=()=>{
  if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=''}
  const file=fileInput.files?.[0];
  if(!file){show(urlInput.value);if(status)status.textContent='Aucune nouvelle photo sélectionnée.';return}
  objectUrl=URL.createObjectURL(file);preview.src=objectUrl;if(status)status.textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} Mo`;
 };
 urlInput.oninput=()=>{if(!fileInput.files?.length)show(urlInput.value)};
}

function documentsManager(){
 if(!isAdmin())return toast('Accès administrateur requis.');
 const rows=(read().documents||[]).slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
 const body=`<div class="v21-admin-manager"><div class="v21-admin-toolbar"><div><strong>${rows.length} document(s)</strong><div class="v19-meta">Ajout, modification et suppression des ressources publiques.</div></div><button class="v19-btn" type="button" data-add>+ Document</button></div><div class="v21-admin-list">${rows.map(d=>`<div class="v21-admin-row"><div class="v21-admin-row-main"><strong>${esc(d.title)}</strong><small>${esc(d.specialty||'Association Sportive')} · ${fmt(d.date)}${d.description?' · '+esc(d.description):''}</small></div><div class="v21-admin-row-actions"><button class="v19-btn small secondary" data-edit="${esc(d.id)}">Modifier</button><button class="v19-btn small v21-danger" data-delete="${esc(d.id)}">Supprimer</button></div></div>`).join('')||'<div class="v19-empty">Aucun document.</div>'}</div></div>`;
 const w=modal('Gérer les documents',body);w.querySelector('[data-add]').onclick=()=>documentForm();w.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>documentForm(b.dataset.edit));w.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteDocument(b.dataset.delete));
}
function documentForm(id=''){
 const d=(read().documents||[]).find(x=>x.id===id);
 const w=modal(d?'Modifier le document':'Ajouter un document',`<form id="v21-document-form" class="v19-form"><label class="full"><span>Titre</span><input required name="title" value="${esc(d?.title||'')}"></label><label><span>Spécialité</span><select name="specialty">${opts(SPECIALTIES,d?.specialty||'Association Sportive')}</select></label><label><span>Date</span><input type="date" name="date" value="${esc(d?.date||new Date().toISOString().slice(0,10))}"></label><label class="full"><span>Description</span><textarea name="description" rows="3">${esc(d?.description||'')}</textarea></label><label class="full"><span>Lien du document</span><input name="url" type="url" placeholder="https://…" value="${esc(d?.url&&d.url!=='#'?d.url:'')}"></label><label class="full v19-switch"><input type="checkbox" name="featured" ${d?.featured?'checked':''}><span>Document mis en avant</span></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" data-back>Retour</button><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,false);
 w.querySelector('[data-back]').onclick=documentsManager;w.querySelector('#v21-document-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const row={id:d?.id||uid('d'),title:String(fd.get('title')||'').trim(),specialty:String(fd.get('specialty')||'Association Sportive'),date:String(fd.get('date')||'')||null,description:String(fd.get('description')||'').trim(),url:String(fd.get('url')||'').trim(),featured:fd.get('featured')==='on',publicVisible:true};if(!row.title)return;const btn=e.currentTarget.querySelector('[type="submit"]');btn.disabled=true;try{await remoteUpsert('v20_documents',{id:row.id,title:row.title,specialty:row.specialty,date:row.date,description:row.description,url:row.url||null,featured:row.featured,public_visible:true});const data=read();data.documents=data.documents||[];const old=data.documents.find(x=>x.id===row.id);old?Object.assign(old,row):data.documents.push(row);persist(data);(window.__BS_SAVED?window.__BS_SAVED('Document enregistré'):toast('Document enregistré'));setTimeout(()=>refresh('documents'),120)}catch(err){toast('Erreur : '+(err?.message||err));btn.disabled=false}};
}
async function deleteDocument(id){if(!confirm('Supprimer définitivement ce document ?'))return;try{await remoteDelete('v20_documents',id);const data=read();data.documents=(data.documents||[]).filter(x=>x.id!==id);persist(data);toast('Document supprimé');documentsManager()}catch(err){toast('Suppression impossible : '+(err?.message||err))}}

function productsManager(){
 if(!isAdmin())return toast('Accès administrateur requis.');
 const rows=(read().products||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','fr'));
 const body=`<div class="v21-admin-manager"><div class="v21-admin-toolbar"><div><strong>${rows.length} produit(s)</strong><div class="v19-meta">Catalogue, prix, visuel et disponibilité.</div></div><button class="v19-btn" type="button" data-add>+ Produit</button></div><div class="v21-admin-list">${rows.map(p=>`<div class="v21-admin-row"><div class="v21-admin-row-main"><strong>${esc(p.name)} · ${money(p.price)}</strong><small>${p.active===false?'Masqué':'En vente'}${p.deadline?' · commande avant le '+fmt(p.deadline):''}${p.color?' · '+esc(p.color):''}</small></div><div class="v21-admin-row-actions"><button class="v19-btn small secondary" data-edit="${esc(p.id)}">Modifier</button><button class="v19-btn small v21-danger" data-delete="${esc(p.id)}">Supprimer</button></div></div>`).join('')||'<div class="v19-empty">Aucun produit.</div>'}</div></div>`;
 const w=modal('Gérer les produits',body);w.querySelector('[data-add]').onclick=()=>productForm();w.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>productForm(b.dataset.edit));w.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
}
function productForm(id=''){
 const p=(read().products||[]).find(x=>x.id===id);
 const currentImage=p?.image||PRODUCT_IMAGE_FALLBACK;
 const w=modal(p?'Modifier le produit':'Ajouter un produit',`<form id="v21-product-form" class="v19-form"><label class="full"><span>Nom du produit</span><input required name="name" value="${esc(p?.name||'')}"></label><label><span>Prix (€)</span><input required min="0" step="0.01" type="number" name="price" value="${esc(p?.price??'')}"></label><label><span>Date limite de commande</span><input type="date" name="deadline" value="${esc(p?.deadline||'')}"></label><label class="full"><span>Description</span><textarea name="description" rows="3">${esc(p?.description||'')}</textarea></label><label><span>Couleur / modèle</span><input name="color" value="${esc(p?.color||'')}"></label><label class="full v21-product-photo-field"><span>Photo du produit</span><input type="file" name="imageFile" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"><small>Depuis Google Drive : choisissez directement le fichier. JPG, PNG, WebP ou HEIC · 15 Mo maximum.</small></label><div class="full v21-product-image-preview" data-product-image-preview><img alt="Aperçu de la photo du produit"><small data-image-status>Aucune nouvelle photo sélectionnée.</small></div><label class="full"><span>Ou lien d’image (facultatif)</span><input name="image" value="${esc(currentImage)}" placeholder="https://…"><small>Un lien Google Drive doit être accessible à toute personne disposant du lien.</small></label><label class="full v19-switch"><input type="checkbox" name="active" ${p?.active===false?'':'checked'}><span>Produit visible dans la boutique</span></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" data-back>Retour</button><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,false);
 bindProductImagePreview(w,currentImage);
 w.querySelector('[data-back]').onclick=productsManager;w.querySelector('#v21-product-form').onsubmit=async e=>{
  e.preventDefault();const form=e.currentTarget,fd=new FormData(form),productId=p?.id||uid('p'),file=fd.get('imageFile');
  const btn=form.querySelector('[type="submit"]');btn.disabled=true;let uploaded=null,saved=false;
  try{
   let image=normalizeProductImageUrl(fd.get('image'));
   if(file instanceof File&&file.size){btn.textContent='Envoi de la photo…';uploaded=await uploadProductImage(file,productId);image=uploaded.url}
   const row={id:productId,name:String(fd.get('name')||'').trim(),description:String(fd.get('description')||'').trim(),price:Number(fd.get('price')||0),deadline:String(fd.get('deadline')||'')||null,active:fd.get('active')==='on',image,color:String(fd.get('color')||'').trim()};
   if(!row.name)throw new Error('Le nom du produit est obligatoire.');
   btn.textContent='Enregistrement…';await remoteUpsert('v20_products',{id:row.id,name:row.name,description:row.description,price:row.price,deadline:row.deadline,active:row.active,image:row.image,color:row.color||null});saved=true;
   const data=read();data.products=data.products||[];const old=data.products.find(x=>x.id===row.id);old?Object.assign(old,row):data.products.push(row);persist(data);
   if(uploaded&&storedProductImagePath(p?.image)!==uploaded.path)removeStoredProductImage(p?.image).catch(()=>{});
   (window.__BS_SAVED?window.__BS_SAVED('Produit et photo enregistrés'):toast('Produit enregistré'));setTimeout(()=>refresh('shop'),120);
  }catch(err){if(uploaded&&!saved)removeStoredProductImage(uploaded.url).catch(()=>{});toast('Erreur : '+(err?.message||err));btn.disabled=false;btn.textContent='Enregistrer'}
 };
}
async function deleteProduct(id){
 const used=(read().orders||[]).some(o=>o.productId===id);if(used&&!confirm('Ce produit possède des commandes. Le supprimer quand même ?'))return;if(!used&&!confirm('Supprimer définitivement ce produit ?'))return;
 const product=(read().products||[]).find(x=>x.id===id);
 try{await remoteDelete('v20_products',id);removeStoredProductImage(product?.image).catch(()=>{});const data=read();data.products=(data.products||[]).filter(x=>x.id!==id);persist(data);toast('Produit supprimé');productsManager()}catch(err){toast('Suppression impossible : '+(err?.message||err))}
}

function ordersManager(){
 if(!isAdmin())return toast('Accès administrateur requis.');
 const data=read();const rows=(data.orders||[]).slice().sort((a,b)=>(b.createdAt||'').localeCompare(a.createdAt||''));
 const body=`<div class="v21-admin-manager"><div class="v21-admin-toolbar"><div><strong>${rows.length} commande(s)</strong><div class="v19-meta">Créer une commande manuelle, la modifier ou la supprimer.</div></div><button class="v19-btn" type="button" data-add>+ Commande</button></div><div class="v21-admin-list">${rows.map(o=>{const p=(data.products||[]).find(x=>x.id===o.productId);return `<div class="v21-admin-row"><div class="v21-admin-row-main"><strong>${esc(o.studentName||'—')} · ${esc(p?.name||'Produit supprimé')}</strong><small>${esc(o.className||'')} · ${esc(o.size||'—')} · Qté ${Number(o.quantity||1)} · ${o.paid?'Payé':'À payer'} · ${o.distributed?'Distribué':'À distribuer'}</small></div><div class="v21-admin-row-actions"><button class="v19-btn small secondary" data-edit="${esc(o.id)}">Modifier</button><button class="v19-btn small v21-danger" data-delete="${esc(o.id)}">Supprimer</button></div></div>`}).join('')||'<div class="v19-empty">Aucune commande.</div>'}</div></div>`;
 const w=modal('Gérer les commandes',body);w.querySelector('[data-add]').onclick=()=>orderForm();w.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>orderForm(b.dataset.edit));w.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteOrder(b.dataset.delete));
}
function orderForm(id=''){
 const data=read(),o=(data.orders||[]).find(x=>x.id===id),products=(data.products||[]).filter(p=>p.active!==false||p.id===o?.productId);
 if(!products.length)return toast('Ajoutez d’abord un produit.');
 const w=modal(o?'Modifier la commande':'Ajouter une commande',`<form id="v21-order-form" class="v19-form"><label class="full"><span>Produit</span><select name="productId">${products.map(p=>`<option value="${esc(p.id)}" ${p.id===o?.productId?'selected':''}>${esc(p.name)} — ${money(p.price)}</option>`).join('')}</select></label><label><span>Nom de l’élève</span><input required name="studentName" value="${esc(o?.studentName||'')}"></label><label><span>Classe</span><input required name="className" value="${esc(o?.className||'')}"></label><label><span>Taille</span><select name="size">${opts(SIZES,o?.size||'M')}</select></label><label><span>Quantité</span><input type="number" min="1" max="10" name="quantity" value="${Number(o?.quantity||1)}"></label><label><span>Paiement</span><select name="paymentMethod">${opts(PAYMENTS,o?.paymentMethod||'Chèque')}</select></label><label><span>Couleur / modèle</span><input name="color" value="${esc(o?.color||'')}"></label><label class="full v19-switch"><input type="checkbox" name="paid" ${o?.paid?'checked':''}><span>Commande payée</span></label><label class="full v19-switch"><input type="checkbox" name="distributed" ${o?.distributed?'checked':''}><span>Article distribué</span></label><div class="full v19-modal-actions"><button type="button" class="v19-btn secondary" data-back>Retour</button><button class="v19-btn" type="submit">Enregistrer</button></div></form>`,false);
 w.querySelector('[data-back]').onclick=ordersManager;w.querySelector('#v21-order-form').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const row={id:o?.id||uid('o'),productId:String(fd.get('productId')||''),studentName:String(fd.get('studentName')||'').trim(),className:String(fd.get('className')||'').trim(),size:String(fd.get('size')||''),quantity:Number(fd.get('quantity')||1),paymentMethod:String(fd.get('paymentMethod')||''),paid:fd.get('paid')==='on',distributed:fd.get('distributed')==='on',color:String(fd.get('color')||'').trim(),createdAt:o?.createdAt||new Date().toISOString()};const btn=e.currentTarget.querySelector('[type="submit"]');btn.disabled=true;try{await remoteUpsert('v20_orders',{id:row.id,product_id:row.productId,student_name:row.studentName,class_name:row.className,size:row.size,quantity:row.quantity,payment_method:row.paymentMethod,paid:row.paid,distributed:row.distributed,color:row.color||null,created_at:row.createdAt});const d=read();d.orders=d.orders||[];const old=d.orders.find(x=>x.id===row.id);old?Object.assign(old,row):d.orders.push(row);persist(d);(window.__BS_SAVED?window.__BS_SAVED('Commande enregistrée'):toast('Commande enregistrée'));setTimeout(()=>refresh('orders'),120)}catch(err){toast('Erreur : '+(err?.message||err));btn.disabled=false}};
}
async function deleteOrder(id){if(!confirm('Supprimer définitivement cette commande ?'))return;try{await remoteDelete('v20_orders',id);const data=read();data.orders=(data.orders||[]).filter(x=>x.id!==id);persist(data);toast('Commande supprimée');ordersManager()}catch(err){toast('Suppression impossible : '+(err?.message||err))}}

function inject(){
 if(!isAdmin())return;
 const kicker=(document.querySelector('.v19-page-head .v19-kicker')?.textContent||'').trim().toUpperCase();
 const actions=document.querySelector('.v19-page-head .v19-head-actions');
 if(kicker==='DOCUMENTS'&&actions&&!actions.querySelector('[data-v21-docs]')){const b=document.createElement('button');b.className='v19-btn';b.dataset.v21Docs='1';b.textContent='Gérer les documents';b.onclick=documentsManager;actions.appendChild(b)}
 if(kicker==='BOUTIQUE'&&actions&&!actions.querySelector('[data-v21-products]')){const b=document.createElement('button');b.className='v19-btn secondary';b.dataset.v21Products='1';b.textContent='Gérer les produits';b.onclick=productsManager;actions.prepend(b)}
 if(kicker==='BOUTIQUE'&&/gestion des commandes/i.test(document.querySelector('.v19-page-head h1')?.textContent||'')&&actions&&!actions.querySelector('[data-v21-order-add]')){const b=document.createElement('button');b.className='v19-btn';b.dataset.v21OrderAdd='1';b.textContent='+ Commande';b.onclick=()=>orderForm();actions.prepend(b)}
 const grid=document.querySelector('.v19-admin-cards');if(grid&&!grid.querySelector('[data-v21-content-admin]')){
  const wrap=document.createElement('div');wrap.dataset.v21ContentAdmin='1';wrap.style.display='contents';wrap.innerHTML=`<button class="v19-card v19-admin-action" data-docs><div><h3>Documents</h3><p>Ajouter, modifier ou supprimer les documents diffusés.</p></div></button><button class="v19-card v19-admin-action" data-products><div><h3>Boutique & produits</h3><p>Gérer les articles, les prix, les visuels et leur disponibilité.</p></div></button><button class="v19-card v19-admin-action" data-orders><div><h3>Commandes</h3><p>Créer, modifier, suivre ou supprimer les commandes.</p></div></button>`;grid.appendChild(wrap);wrap.querySelector('[data-docs]').onclick=documentsManager;wrap.querySelector('[data-products]').onclick=productsManager;wrap.querySelector('[data-orders]').onclick=ordersManager;
 }
}

window.app=window.app||{};
Object.assign(window.app,{v21Documents:documentsManager,v21DocumentForm:documentForm,v21Products:productsManager,v21ProductForm:productForm,v21Orders:ordersManager,v21OrderForm:orderForm});
window.addEventListener('bs-app-rendered',inject);inject();
})();
