import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {clientIp,corsHeaders,hashKey,json,normalizeLogin,readJson,rejectOrigin} from '../_shared/http.ts';

const ORDER_RECIPIENTS=new Set(['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP','Enseignant','Personnel']);
const SIZES=new Set(['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL']);
const PAYMENTS=new Set(['Espèces','Virement','Chèque']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ID=/^[A-Za-z0-9_-]{1,80}$/;
const clean=(value:unknown,max:number)=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,max);

async function consume(admin:ReturnType<typeof createClient>,bucket:string,key:string,limit:number,windowSeconds:number,blockSeconds:number){
 const {data,error}=await admin.rpc('v22_consume_rate_limit',{p_bucket:bucket,p_key_hash:key,p_limit:limit,p_window_seconds:windowSeconds,p_block_seconds:blockSeconds});
 if(error)throw error;
 return data as {allowed:boolean;retry_after:number};
}

Deno.serve(async request=>{
 const originResponse=rejectOrigin(request);if(originResponse)return originResponse;
 if(request.method!=='POST')return json(request,{error:'Méthode refusée.'},405);
 try{
  const body=await readJson(request,16384);
  const requestId=clean(body.requestId,64),studentName=clean(body.studentName,120),className=clean(body.className,80),paymentMethod=clean(body.paymentMethod,30);
  const rawItems=Array.isArray(body.items)?body.items:[body];
  if(!UUID.test(requestId)||studentName.length<2||!ORDER_RECIPIENTS.has(className)||!PAYMENTS.has(paymentMethod)||rawItems.length<1||rawItems.length>20)return json(request,{error:'Vérifiez les informations de la commande.'},400);
  const items=rawItems.map(item=>({productId:clean(item?.productId,80),size:clean(item?.size,20),quantity:Number(item?.quantity),color:clean(item?.color,80)}));
  if(items.some(item=>!SAFE_ID.test(item.productId)||!SIZES.has(item.size)||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>10))return json(request,{error:'Vérifiez les articles, les tailles et les quantités.'},400);
  const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!serviceKey)throw new Error('CONFIG');
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  let staffId='';const bearer=request.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(bearer){
   const {data:userData,error:authError}=await admin.auth.getUser(bearer);
   if(authError||!userData?.user)return json(request,{error:'Session expirée. Reconnectez-vous.'},401);
   const {data:profile,error:profileError}=await admin.from('profiles').select('role').eq('id',userData.user.id).maybeSingle();
   if(profileError)throw profileError;
   if(!profile||!['teacher_as','admin'].includes(profile.role))return json(request,{error:'Ce compte ne peut pas saisir de commande pour le personnel.'},403);
   staffId=userData.user.id;
  }
  const signature=await hashKey(serviceKey,JSON.stringify({studentName,className,paymentMethod,items}));
  const success=(rows:any[],status=200)=>json(request,{reference:rows[0]?.reference,references:rows.map(row=>row.reference),status:'payment_pending',createdAt:rows[0]?.created_at,total:rows.reduce((n,row)=>n+Number(row.unit_price||0)*Number(row.quantity||1),0)},status);
  const previous=async()=>{const result=await admin.from('v20_orders').select('reference,created_at,unit_price,quantity,checkout_signature').eq('checkout_id',requestId).order('checkout_line');if(result.error)throw result.error;return result.data||[]};
  const existing=await previous();
  if(existing.length){if(existing[0].checkout_signature!==signature)return json(request,{error:'Cette référence correspond déjà à une autre commande.'},409);return success(existing)}
  // Retain compatibility with requests accepted before cart support was deployed.
  const {data:legacy,error:legacyError}=await admin.from('v20_orders').select('reference,created_at,unit_price,quantity').eq('request_id',requestId).maybeSingle();
  if(legacyError)throw legacyError;if(legacy)return success([legacy]);
  const ipHash=await hashKey(serviceKey,'order-ip:'+clientIp(request)),identityHash=await hashKey(serviceKey,'order-person:'+normalizeLogin(studentName)+'|'+className);
  const limits=staffId?await Promise.all([consume(admin,'v33-order-staff',await hashKey(serviceKey,staffId),120,3600,60)]):await Promise.all([consume(admin,'v33-order-ip-hour',ipHash,300,3600,300),consume(admin,'v33-order-ip-burst',ipHash,30,60,60),consume(admin,'public-order-person',identityHash,6,3600,3600)]);
  if(limits.some(limit=>!limit?.allowed))return json(request,{error:'Trop de commandes ont été envoyées. Réessayez plus tard.'},429);
  const {data:products,error:productError}=await admin.from('v20_products').select('id,name,price,active,deadline,color').in('id',[...new Set(items.map(item=>item.productId))]);
  if(productError)throw productError;
  const dateParts=Object.fromEntries(new Intl.DateTimeFormat('fr-FR',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
  const today=`${dateParts.year}-${dateParts.month}-${dateParts.day}`;
  const catalogue=new Map((products||[]).map(product=>[product.id,product]));
  if(items.some(item=>{const p=catalogue.get(item.productId);return !p||p.active!==true||(p.deadline&&String(p.deadline)<today)}))return json(request,{error:'Un article du panier n’est plus disponible. Actualisez la boutique.'},409);
  const rows=items.map((item,index)=>{const p=catalogue.get(item.productId)!;return{id:crypto.randomUUID(),request_id:items.length===1?requestId:crypto.randomUUID(),checkout_id:requestId,checkout_line:index,checkout_signature:signature,product_id:item.productId,product_name:p.name,unit_price:p.price,student_name:studentName,class_name:className,size:item.size,quantity:item.quantity,payment_method:paymentMethod,color:p.color||item.color||null,paid:false,distributed:false}});
  // One INSERT statement: either every cart line is saved, or none is saved.
  const {data:created,error:createError}=await admin.from('v20_orders').insert(rows).select('reference,created_at,unit_price,quantity');
  if(createError){if(createError.code==='23505'){const retry=await previous();if(retry.length&&retry[0].checkout_signature===signature)return success(retry)}throw createError}
  if(!Array.isArray(created)||created.length!==items.length)throw new Error('CHECKOUT_UNCONFIRMED');
  return success(created,201);
 }catch(error){
  const code=error instanceof Error?error.message:'';
  if(code==='PAYLOAD_TOO_LARGE')return json(request,{error:'Requête trop volumineuse.'},413);
  if(code==='INVALID_JSON')return json(request,{error:'Requête invalide.'},400);
  console.error('public-order',error instanceof Error?error.name:'error');
  return json(request,{error:'La commande n’a pas pu être enregistrée. Réessayez.'},500);
 }
});
