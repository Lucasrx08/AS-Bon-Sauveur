import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {clientIp,hashKey,json,normalizeLogin,readJson,rejectOrigin,sleep} from '../_shared/http.ts';
async function consume(admin:ReturnType<typeof createClient>,bucket:string,key:string,limit:number,windowSeconds:number,blockSeconds:number){
 const {data,error}=await admin.rpc('v22_consume_rate_limit',{p_bucket:bucket,p_key_hash:key,p_limit:limit,p_window_seconds:windowSeconds,p_block_seconds:blockSeconds});if(error)throw error;return data as {allowed:boolean;retry_after:number};
}
Deno.serve(async request=>{
 const originResponse=rejectOrigin(request);if(originResponse)return originResponse;if(request.method!=='POST')return json(request,{error:'Méthode refusée.'},405);
 try{
  const body=await readJson(request,2048),loginKey=normalizeLogin(body.loginName),pin=String(body.pin||'').trim();
  if(!loginKey||!/^\d{6}$/.test(pin)){await sleep(300);return json(request,{error:'Nom ou code PIN incorrect.'},400)}
  const url=Deno.env.get('SUPABASE_URL')||'',anon=Deno.env.get('SUPABASE_ANON_KEY')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';if(!url||!anon||!serviceKey)throw new Error('CONFIG');
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const ipHash=await hashKey(serviceKey,'pin-ip:'+clientIp(request)),identityHash=await hashKey(serviceKey,'pin-login:'+loginKey);
  const [ipLimit,identityLimit]=await Promise.all([consume(admin,'pin-login-ip',ipHash,30,3600,3600),consume(admin,'pin-login-identity',identityHash,8,600,300)]);
  if(!ipLimit?.allowed||!identityLimit?.allowed){await sleep(350);return json(request,{error:'Trop de tentatives. Réessayez dans quelques minutes.'},429)}
  const {data:account,error:accountError}=await admin.from('pin_accounts').select('auth_email').eq('login_key',loginKey).maybeSingle();if(accountError)throw accountError;
  if(!account?.auth_email){await sleep(450);return json(request,{error:'Nom ou code PIN incorrect.'},401)}
  const client=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await client.auth.signInWithPassword({email:account.auth_email,password:pin});
  if(error||!data?.session?.access_token||!data.session.refresh_token){await sleep(450);return json(request,{error:'Nom ou code PIN incorrect.'},401)}
  return json(request,{ok:true,auth_method:'pin',access_token:data.session.access_token,refresh_token:data.session.refresh_token,expires_at:data.session.expires_at,expires_in:data.session.expires_in},200);
 }catch(error){
  const code=error instanceof Error?error.message:'';if(code==='PAYLOAD_TOO_LARGE')return json(request,{error:'Requête trop volumineuse.'},413);if(code==='INVALID_JSON')return json(request,{error:'Requête invalide.'},400);
  console.error('pin-login-v23',error instanceof Error?error.name:'error');return json(request,{error:'Connexion momentanément indisponible.'},500);
 }
});