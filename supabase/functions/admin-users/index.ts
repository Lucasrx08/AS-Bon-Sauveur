import {createClient} from 'npm:@supabase/supabase-js@2.116.0';
import {hashKey,json,normalizeLogin,readJson,rejectOrigin} from '../_shared/http.ts';

const PIN_ROLES=new Set(['teacher_as','educator_football','educator_gymnastique','educator_escalade']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const clean=(value:unknown,max:number)=>String(value||'').replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,max);
function weakPin(pin:string){
 if(!/^\d{6}$/.test(pin))return true;
 if(/^(\d)\1{5}$/.test(pin))return true;
 return new Set(['000000','123456','654321','012345','543210','121212','112233','123123','111222','258000']).has(pin);
}
async function requireAdmin(request:Request,admin:ReturnType<typeof createClient>){
 const header=request.headers.get('authorization')||'',token=header.startsWith('Bearer ')?header.slice(7):'';
 if(!token)throw new Error('UNAUTHORIZED');
 const {data:userData,error:userError}=await admin.auth.getUser(token);
 if(userError||!userData.user||userData.user.app_metadata?.role!=='admin')throw new Error('FORBIDDEN');
 const {data:profile,error:profileError}=await admin.from('profiles').select('id,role').eq('id',userData.user.id).maybeSingle();
 if(profileError||profile?.role!=='admin')throw new Error('FORBIDDEN');
 return userData.user;
}
async function ensureUniqueLogin(admin:ReturnType<typeof createClient>,loginKey:string,exceptId=''){
 const {data,error}=await admin.from('pin_accounts').select('user_id').eq('login_key',loginKey).maybeSingle();
 if(error)throw error;if(data&&String(data.user_id)!==exceptId)throw new Error('LOGIN_EXISTS');
}
Deno.serve(async request=>{
 const originResponse=rejectOrigin(request);if(originResponse)return originResponse;
 if(request.method!=='POST')return json(request,{error:'Méthode refusée.'},405);
 try{
  const url=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!serviceKey)throw new Error('CONFIG');
  const admin=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const actor=await requireAdmin(request,admin),body=await readJson(request,6144),action=clean(body.action,40);
  const actorHash=await hashKey(serviceKey,'admin:'+actor.id);
  const {data:limit,error:limitError}=await admin.rpc('v22_consume_rate_limit',{p_bucket:'admin-users',p_key_hash:actorHash,p_limit:80,p_window_seconds:900,p_block_seconds:900});
  if(limitError)throw limitError;if(!limit?.allowed)return json(request,{error:'Trop d’actions. Réessayez plus tard.'},429);

  if(action==='list_access'){
   const [{data:profiles,error:profilesError},{data:pins,error:pinsError}]=await Promise.all([admin.from('profiles').select('id,display_name,role,email').order('display_name'),admin.from('pin_accounts').select('user_id,login_name')]);
   if(profilesError||pinsError)throw profilesError||pinsError;
   const pinMap=new Map((pins||[]).map((item:{user_id:string;login_name:string})=>[String(item.user_id),item.login_name]));
   const accounts=(profiles||[]).map((profile:{id:string;display_name:string;role:string;email:string|null})=>({id:profile.id,displayName:profile.display_name||'Utilisateur',role:profile.role,mode:pinMap.has(profile.id)?'pin':'email',loginName:pinMap.get(profile.id)||null,email:profile.role==='admin'?profile.email:null,self:profile.id===actor.id}));
   return json(request,{accounts});
  }

  if(action==='create_pin_access'){
   const displayName=clean(body.displayName,100),loginName=clean(body.loginName||displayName,100),loginKey=normalizeLogin(loginName),pin=String(body.pin||'').trim(),role=clean(body.role,40);
   if(displayName.length<2||loginKey.length<2||weakPin(pin)||!PIN_ROLES.has(role))return json(request,{error:'Choisissez un nom, un rôle autorisé et un PIN à 6 chiffres non prévisible.'},400);
   await ensureUniqueLogin(admin,loginKey);
   const authEmail=crypto.randomUUID()+'@pin.as-bon-sauveur.invalid';
   const {data:created,error:createError}=await admin.auth.admin.createUser({email:authEmail,password:pin,email_confirm:true,app_metadata:{role},user_metadata:{display_name:displayName}});
   if(createError||!created.user)throw createError||new Error('CREATE_FAILED');
   try{
    const {error:profileError}=await admin.from('profiles').upsert({id:created.user.id,display_name:displayName,role,email:null});
    if(profileError)throw profileError;
    const {error:pinError}=await admin.from('pin_accounts').insert({user_id:created.user.id,login_name:loginName,login_key:loginKey,auth_email:authEmail});
    if(pinError)throw pinError;
   }catch(error){await admin.auth.admin.deleteUser(created.user.id);throw error}
   return json(request,{success:true},201);
  }

  const userId=clean(body.userId,64);
  if(!UUID.test(userId)||userId===actor.id)return json(request,{error:'Compte cible invalide.'},400);
  const {data:profile,error:profileError}=await admin.from('profiles').select('id,display_name,role').eq('id',userId).maybeSingle();
  if(profileError)throw profileError;if(!profile)return json(request,{error:'Compte introuvable.'},404);
  if(profile.role==='admin')return json(request,{error:'Le compte administrateur de secours ne peut pas être modifié ici.'},403);

  if(action==='reset_pin'){
   const pin=String(body.pin||'').trim(),loginName=clean(body.loginName||profile.display_name,100),loginKey=normalizeLogin(loginName);
   if(weakPin(pin)||loginKey.length<2)return json(request,{error:'Choisissez un PIN à 6 chiffres non prévisible.'},400);
   if(!PIN_ROLES.has(profile.role))return json(request,{error:'Rôle incompatible avec un accès PIN.'},400);
   await ensureUniqueLogin(admin,loginKey,userId);
   const {data:account,error:accountError}=await admin.from('pin_accounts').select('user_id').eq('user_id',userId).maybeSingle();
   if(accountError)throw accountError;if(!account)return json(request,{error:'Ce compte n’utilise pas de PIN.'},409);
   const {error:updateError}=await admin.auth.admin.updateUserById(userId,{password:pin,app_metadata:{role:profile.role}});
   if(updateError)throw updateError;
   const {error:pinError}=await admin.from('pin_accounts').update({login_name:loginName,login_key:loginKey,updated_at:new Date().toISOString()}).eq('user_id',userId);
   if(pinError)throw pinError;
   await admin.rpc('v22_revoke_user_sessions',{p_user_id:userId});
   return json(request,{success:true});
  }

  if(action==='convert_to_pin'){
   const displayName=clean(body.displayName||profile.display_name,100),loginName=clean(body.loginName||displayName,100),loginKey=normalizeLogin(loginName),pin=String(body.pin||'').trim(),role=String(profile.role||'');
   if(displayName.length<2||loginKey.length<2||weakPin(pin)||!PIN_ROLES.has(role))return json(request,{error:'Compte, rôle ou PIN incompatible.'},400);
   await ensureUniqueLogin(admin,loginKey,userId);
   const authEmail=crypto.randomUUID()+'@pin.as-bon-sauveur.invalid';
   const {error:pinError}=await admin.from('pin_accounts').upsert({user_id:userId,login_name:loginName,login_key:loginKey,auth_email:authEmail,updated_at:new Date().toISOString()});
   if(pinError)throw pinError;
   const {error:updateError}=await admin.auth.admin.updateUserById(userId,{email:authEmail,password:pin,email_confirm:true,app_metadata:{role},user_metadata:{display_name:displayName}});
   if(updateError){await admin.from('pin_accounts').delete().eq('user_id',userId);throw updateError}
   const {error:updateProfile}=await admin.from('profiles').update({display_name:displayName,email:null}).eq('id',userId);
   if(updateProfile)throw updateProfile;
   await admin.rpc('v22_revoke_user_sessions',{p_user_id:userId});
   return json(request,{success:true});
  }

  if(action==='remove_access'){
   const {error:deleteError}=await admin.auth.admin.deleteUser(userId);
   if(deleteError)throw deleteError;return json(request,{success:true});
  }
  return json(request,{error:'Action inconnue.'},400);
 }catch(error){
  const code=error instanceof Error?error.message:'';
  if(code==='UNAUTHORIZED')return json(request,{error:'Connexion requise.'},401);
  if(code==='FORBIDDEN')return json(request,{error:'Accès administrateur requis.'},403);
  if(code==='LOGIN_EXISTS')return json(request,{error:'Ce nom de connexion est déjà utilisé.'},409);
  if(code==='PAYLOAD_TOO_LARGE')return json(request,{error:'Requête trop volumineuse.'},413);
  if(code==='INVALID_JSON')return json(request,{error:'Requête invalide.'},400);
  console.error('admin-users',error instanceof Error?error.name:'error');
  return json(request,{error:'Opération impossible. Réessayez.'},500);
 }
});
