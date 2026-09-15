import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {clientIp,hashKey,json,normalizeLogin,readJson,rejectOrigin,sleep} from '../_shared/http.ts';

async function consume(admin:ReturnType<typeof createClient>,bucket:string,key:string,limit:number,windowSeconds:number,blockSeconds:number){
 const {data,error}=await admin.rpc('v22_consume_rate_limit',{p_bucket:bucket,p_key_hash:key,p_limit:limit,p_window_seconds:windowSeconds,p_block_seconds:blockSeconds});
 if(error)throw error;return data as {allowed:boolean;retry_after:number};
}
Deno.serve(async request=>{
 const started=Date.now(),finish=async(value:unknown,status=200)=>{await sleep(Math.max(0,350+Math.floor(Math.random()*180)-(Date.now()-started)));return json(request,value,status)};
 const originResponse=rejectOrigin(request);if(originResponse)return originResponse;
 if(request.method!=='POST')return finish({error:'Méthode refusée.'},405);
 try{
  const body=await readJson(request,2048),loginKey=normalizeLogin(body.loginName),pin=String(body.pin||'').trim();
  if(loginKey.length<2||loginKey.length>120||!/^\d{6}$/.test(pin))return finish({error:'Nom ou code PIN incorrect.'},401);
  const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',anonKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
  if(!url||!serviceKey||!anonKey)throw new Error('CONFIG');
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const accountHash=await hashKey(serviceKey,'pin-account:'+loginKey),ipHash=await hashKey(serviceKey,'pin-ip:'+clientIp(request));
  const [accountLimit,ipLimit]=await Promise.all([consume(admin,'pin-account',accountHash,5,900,1800),consume(admin,'pin-ip',ipHash,25,900,1800)]);
  if(!accountLimit?.allowed||!ipLimit?.allowed)return finish({error:'Trop de tentatives. Réessayez dans 30 minutes.'},429);
  const {data:account,error:accountError}=await admin.from('pin_accounts').select('user_id,auth_email').eq('login_key',loginKey).maybeSingle();
  if(accountError)throw accountError;
  const dummy='absent-'+accountHash.slice(0,24)+'@pin.invalid',email=account?.auth_email||dummy;
  const auth=createClient(url,anonKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await auth.auth.signInWithPassword({email,password:pin});
  const role=String(data?.user?.app_metadata?.role||'');
  if(error||!account||String(data?.user?.id)!==String(account.user_id)||!['teacher_as','educator_football','educator_gymnastique','educator_escalade'].includes(role))return finish({error:'Nom ou code PIN incorrect.'},401);
  await admin.from('v22_rate_limits').delete().eq('bucket','pin-account').eq('key_hash',accountHash);
  const session=data.session;
  return finish({access_token:session.access_token,refresh_token:session.refresh_token,expires_at:session.expires_at},200);
 }catch(error){
  const code=error instanceof Error?error.message:'';
  if(code==='PAYLOAD_TOO_LARGE')return finish({error:'Requête trop volumineuse.'},413);
  if(code==='INVALID_JSON')return finish({error:'Requête invalide.'},400);
  console.error('pin-login',error instanceof Error?error.name:'error');
  return finish({error:'Connexion momentanément indisponible.'},500);
 }
});
