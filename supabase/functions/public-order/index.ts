import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {clientIp,corsHeaders,hashKey,json,normalizeLogin,readJson,rejectOrigin} from '../_shared/http.ts';

const ORDER_RECIPIENTS=new Set(['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP','Enseignant','Personnel']);
const SIZES=new Set(['7/8 ans','9/11 ans','12/13 ans','XS','S','M','L','XL','XXL','XXXL','XXXXL']);
const PAYMENTS=new Set(['Virement','Chèque']);
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
  const body=await readJson(request,8192);
  const requestId=clean(body.requestId,64),productId=clean(body.productId,80),studentName=clean(body.studentName,120),className=clean(body.className,80),size=clean(body.size,20),paymentMethod=clean(body.paymentMethod,30),color=clean(body.color,80);
  const quantity=Number(body.quantity);
  if(!UUID.test(requestId)||!SAFE_ID.test(productId)||studentName.length<2||!ORDER_RECIPIENTS.has(className)||!SIZES.has(size)||!PAYMENTS.has(paymentMethod)||!Number.isInteger(quantity)||quantity<1||quantity>10)return json(request,{error:'Vérifiez les informations de la commande.'},400);
  const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!serviceKey)throw new Error('CONFIG');
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:existing,error:existingError}=await admin.from('v20_orders').select('id,reference,created_at').eq('request_id',requestId).maybeSingle();
  if(existingError)throw existingError;
  if(existing)return json(request,{reference:existing.reference,status:'payment_pending',createdAt:existing.created_at},200);
  const ipHash=await hashKey(serviceKey,'order-ip:'+clientIp(request));
  const identityHash=await hashKey(serviceKey,'order-person:'+normalizeLogin(studentName)+'|'+className);
  const [ipLimit,identityLimit]=await Promise.all([consume(admin,'public-order-ip',ipHash,20,3600,3600),consume(admin,'public-order-person',identityHash,6,3600,3600)]);
  if(!ipLimit?.allowed||!identityLimit?.allowed)return json(request,{error:'Trop de commandes ont été envoyées. Réessayez plus tard.'},429);
  const {data:product,error:productError}=await admin.from('v20_products').select('id,active,deadline').eq('id',productId).maybeSingle();
  if(productError)throw productError;
  const today=new Date().toISOString().slice(0,10);
  if(!product||product.active!==true||(product.deadline&&String(product.deadline)<today))return json(request,{error:'Ce produit n’est plus disponible à la commande.'},409);
  const {data:created,error:createError}=await admin.from('v20_orders').insert({id:requestId,request_id:requestId,product_id:productId,student_name:studentName,class_name:className,size,quantity,payment_method:paymentMethod,color:color||null,paid:false,distributed:false}).select('reference,created_at').single();
  if(createError){
   if(createError.code==='23505'){
    const {data:retry}=await admin.from('v20_orders').select('reference,created_at').eq('request_id',requestId).maybeSingle();
    if(retry)return json(request,{reference:retry.reference,status:'payment_pending',createdAt:retry.created_at},200);
   }
   throw createError;
  }
  return json(request,{reference:created.reference,status:'payment_pending',createdAt:created.created_at},201);
 }catch(error){
  const code=error instanceof Error?error.message:'';
  if(code==='PAYLOAD_TOO_LARGE')return json(request,{error:'Requête trop volumineuse.'},413);
  if(code==='INVALID_JSON')return json(request,{error:'Requête invalide.'},400);
  console.error('public-order',error instanceof Error?error.name:'error');
  return json(request,{error:'La commande n’a pas pu être enregistrée. Réessayez.'},500);
 }
});
