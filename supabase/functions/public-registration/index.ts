import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {clientIp,hashKey,json,normalizeLogin,readJson,rejectOrigin} from '../_shared/http.ts';

const CLASSES=new Set(['6e AVIGNON','6e Georges BIZET','6e Paul CEZANNE','6e Alphonse DAUDET','5e Jacqueline AURIOL','5e Adrienne BOLLAND','5e Bessie COLEMAN','5e Elise DEROCHE','4e ESTANGUET','4e FLESSEL','4e Cyril MORE','4e DELAUNAY','3e Antonio GAUDI','3e BARCELONE','3e CASTILLE','3e DALI','3e ESPINOZA','Seconde Pro ECP','Seconde Pro Maslow','Seconde Pro Henderson','Seconde GT','Première Pro ECP','Première Pro Curie','Première Pro Pasteur','Première ST2S','Terminale ST2S','Terminale ASSP']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ID=/^[A-Za-z0-9_-]{1,80}$/;
const clean=(value:unknown,max:number)=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,max);
async function consume(admin:ReturnType<typeof createClient>,bucket:string,key:string,limit:number,windowSeconds:number,blockSeconds:number){
 const {data,error}=await admin.rpc('v22_consume_rate_limit',{p_bucket:bucket,p_key_hash:key,p_limit:limit,p_window_seconds:windowSeconds,p_block_seconds:blockSeconds});if(error)throw error;return data as {allowed:boolean;retry_after:number};
}
Deno.serve(async request=>{
 const originResponse=rejectOrigin(request);if(originResponse)return originResponse;if(request.method!=='POST')return json(request,{error:'Méthode refusée.'},405);
 try{
  const body=await readJson(request,6144);
  const requestId=clean(body.requestId,64),eventId=clean(body.eventId,80),lastName=clean(body.lastName,80).toLocaleUpperCase('fr-FR'),firstName=clean(body.firstName,80),className=clean(body.className,80);
  if(!UUID.test(requestId)||!SAFE_ID.test(eventId)||lastName.length<2||firstName.length<2||!CLASSES.has(className))return json(request,{error:'Vérifiez les informations de l’inscription.'},400);
  const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!serviceKey)throw new Error('CONFIG');
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data:existing,error:existingError}=await admin.from('v20_event_registrations').select('id,created_at').eq('request_id',requestId).maybeSingle();if(existingError)throw existingError;if(existing)return json(request,{status:'registered',createdAt:existing.created_at},200);
  const ipHash=await hashKey(serviceKey,'registration-ip:'+clientIp(request)),identityHash=await hashKey(serviceKey,'registration-person:'+eventId+'|'+normalizeLogin(lastName)+'|'+normalizeLogin(firstName)+'|'+className);
  const [ipLimit,identityLimit]=await Promise.all([consume(admin,'public-registration-ip',ipHash,30,3600,3600),consume(admin,'public-registration-person',identityHash,5,3600,3600)]);
  if(!ipLimit?.allowed||!identityLimit?.allowed)return json(request,{error:'Trop de tentatives ont été envoyées. Réessayez plus tard.'},429);
  const {data:event,error:eventError}=await admin.from('v20_events').select('id,title,specialty,date,public_visible,registration_open,convocation_id').eq('id',eventId).maybeSingle();if(eventError)throw eventError;
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  if(!event||event.public_visible!==true||event.registration_open!==true||String(event.date)<today||event.convocation_id)return json(request,{error:'Les inscriptions ne sont plus ouvertes pour cet événement.'},409);
  const {data:linked,error:linkedError}=await admin.from('v20_convocations').select('id').eq('date',event.date).eq('specialty',event.specialty).eq('title',event.title).eq('public_visible',true).eq('status','published').limit(1);if(linkedError)throw linkedError;if(Array.isArray(linked)&&linked.length)return json(request,{error:'Les inscriptions libres sont fermées pour cet événement.'},409);
  const {data:retentionDue,error:retentionError}=await admin.rpc('v22_event_retention_due',{p_event_date:event.date});if(retentionError)throw retentionError;
  const {data:created,error:createError}=await admin.from('v20_event_registrations').insert({id:requestId,request_id:requestId,event_id:eventId,last_name:lastName,first_name:firstName,class_name:className,retention_due_at:retentionDue}).select('created_at').single();
  if(createError){if(createError.code==='23505')return json(request,{error:'Cet élève est déjà inscrit à cet événement.'},409);throw createError}
  return json(request,{status:'registered',createdAt:created.created_at},201);
 }catch(error){
  const code=error instanceof Error?error.message:'';if(code==='PAYLOAD_TOO_LARGE')return json(request,{error:'Requête trop volumineuse.'},413);if(code==='INVALID_JSON')return json(request,{error:'Requête invalide.'},400);
  console.error('public-registration-v23',error instanceof Error?error.name:'error');return json(request,{error:'L’inscription n’a pas pu être enregistrée. Réessayez.'},500);
 }
});