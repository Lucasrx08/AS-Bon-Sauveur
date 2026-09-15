import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OFFICIAL_ORIGIN = 'https://lucasrx08.github.io'

const corsHeaders = (req: Request) => {
  const origin = req.headers.get('origin') || ''
  if (origin !== OFFICIAL_ORIGIN) return null
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

const allowedRoles = ['educator_football','educator_escalade','educator_gymnastique','teacher_as','admin']
const normalizeLogin = (value: unknown) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ')

const makeAuthEmail = () => `pin.${crypto.randomUUID().replace(/-/g, '')}@as-bonsauveur.invalid`

Deno.serve(async (req) => {
  const cors = corsHeaders(req)
  if (!cors) return new Response(JSON.stringify({ error: 'Origine refusée' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userError } = await caller.auth.getUser()
    if (userError || !user) return json(req,{ error: 'Non authentifié' }, 401)

    const { data: profile } = await caller.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return json(req,{ error: 'Accès administrateur requis' }, 403)

    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } })
    const body = await req.json()

    if (body.action === 'list_access') {
      const { data: profiles, error: pError } = await admin.from('profiles').select('id,display_name,email,role,created_at').order('display_name')
      if (pError) return json(req,{ error: pError.message }, 400)
      const { data: pins, error: pinError } = await admin.from('pin_accounts').select('user_id,login_name')
      if (pinError) return json(req,{ error: pinError.message }, 400)
      const pinMap = new Map((pins || []).map((p: any) => [p.user_id, p]))
      const accounts = (profiles || []).map((p: any) => ({
        id: p.id,
        displayName: p.display_name || '',
        email: p.email || '',
        role: p.role,
        mode: pinMap.has(p.id) ? 'pin' : 'email',
        loginName: pinMap.get(p.id)?.login_name || '',
        self: p.id === user.id,
      }))
      return json(req,{ ok: true, accounts })
    }

    if (body.action === 'create_pin_access') {
      const displayName = String(body.displayName || '').trim()
      const loginName = String(body.loginName || displayName).trim()
      const loginKey = normalizeLogin(loginName)
      const pin = String(body.pin || '').trim()
      const role = String(body.role || '')
      if (!displayName || !loginKey || !/^\d{6}$/.test(pin) || !allowedRoles.includes(role)) return json(req,{ error: 'Nom, rôle ou PIN invalide.' }, 400)

      const { data: existing } = await admin.from('pin_accounts').select('user_id').eq('login_key', loginKey).maybeSingle()
      if (existing) return json(req,{ error: 'Ce nom de connexion est déjà utilisé. Ajoutez une initiale ou un prénom.' }, 409)

      const authEmail = makeAuthEmail()
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: authEmail,
        password: pin,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      })
      if (createError || !created.user) return json(req,{ error: createError?.message || 'Création impossible' }, 400)

      const userId = created.user.id
      const { error: profileError } = await admin.from('profiles').upsert({
        id: userId,
        display_name: displayName,
        email: null,
        role,
      })
      if (profileError) {
        await admin.auth.admin.deleteUser(userId)
        return json(req,{ error: profileError.message }, 400)
      }

      const { error: pinError } = await admin.from('pin_accounts').insert({
        user_id: userId,
        login_name: loginName,
        login_key: loginKey,
        auth_email: authEmail,
      })
      if (pinError) {
        await admin.auth.admin.deleteUser(userId)
        return json(req,{ error: pinError.message }, 400)
      }
      return json(req,{ ok: true, userId, loginName })
    }

    if (body.action === 'reset_pin') {
      const targetId = String(body.userId || '')
      const pin = String(body.pin || '').trim()
      if (!targetId || !/^\d{6}$/.test(pin)) return json(req,{ error: 'PIN invalide : utilisez exactement 6 chiffres.' }, 400)
      const { data: pinAccount } = await admin.from('pin_accounts').select('user_id').eq('user_id', targetId).maybeSingle()
      if (!pinAccount) return json(req,{ error: 'Ce compte utilise encore une connexion par e-mail.' }, 400)
      const { error } = await admin.auth.admin.updateUserById(targetId, { password: pin })
      if (error) return json(req,{ error: error.message }, 400)
      await admin.from('pin_login_attempts').delete().eq('login_key', normalizeLogin(body.loginName || ''))
      return json(req,{ ok: true })
    }

    if (body.action === 'convert_to_pin') {
      const targetId = String(body.userId || '')
      if (!targetId) return json(req,{ error: 'Utilisateur manquant' }, 400)
      if (targetId === user.id) return json(req,{ error: 'Gardez votre compte administrateur e-mail comme accès de secours.' }, 400)
      const displayName = String(body.displayName || '').trim()
      const loginName = String(body.loginName || displayName).trim()
      const loginKey = normalizeLogin(loginName)
      const pin = String(body.pin || '').trim()
      if (!displayName || !loginKey || !/^\d{6}$/.test(pin)) return json(req,{ error: 'Nom ou PIN invalide.' }, 400)

      const { data: existing } = await admin.from('pin_accounts').select('user_id').eq('login_key', loginKey).maybeSingle()
      if (existing && existing.user_id !== targetId) return json(req,{ error: 'Ce nom de connexion est déjà utilisé.' }, 409)

      const authEmail = makeAuthEmail()
      const { error: updateError } = await admin.auth.admin.updateUserById(targetId, {
        email: authEmail,
        password: pin,
        email_confirm: true,
        user_metadata: { display_name: displayName },
      })
      if (updateError) return json(req,{ error: updateError.message }, 400)

      const { error: pinError } = await admin.from('pin_accounts').upsert({
        user_id: targetId,
        login_name: loginName,
        login_key: loginKey,
        auth_email: authEmail,
        updated_at: new Date().toISOString(),
      })
      if (pinError) return json(req,{ error: pinError.message }, 400)
      const { error: profileError } = await admin.from('profiles').update({ display_name: displayName, email: null }).eq('id', targetId)
      if (profileError) return json(req,{ error: profileError.message }, 400)
      return json(req,{ ok: true, loginName })
    }

    if (body.action === 'remove_access') {
      const targetId = String(body.userId || '')
      if (!targetId) return json(req,{ error: 'Utilisateur manquant' }, 400)
      if (targetId === user.id) return json(req,{ error: 'Vous ne pouvez pas supprimer votre propre accès administrateur.' }, 400)
      await admin.from('pin_accounts').delete().eq('user_id', targetId)
      const { error } = await admin.auth.admin.deleteUser(targetId, false)
      if (error) return json(req,{ error: error.message }, 400)
      await admin.from('profiles').delete().eq('id', targetId)
      return json(req,{ ok: true })
    }

    // Ancien mode conservé uniquement pour compatibilité pendant la transition.
    if (body.action === 'invite') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!email || !allowedRoles.includes(body.role)) return json(req,{ error: 'Paramètres invalides' }, 400)
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: body.displayName || email },
        redirectTo: body.redirectTo,
      })
      if (error) return json(req,{ error: error.message }, 400)
      if (data.user) {
        const { error: profileError } = await admin.from('profiles').update({
          display_name: body.displayName || email,
          email,
          role: body.role,
        }).eq('id', data.user.id)
        if (profileError) return json(req,{ error: profileError.message }, 400)
      }
      return json(req,{ ok: true })
    }

    return json(req,{ error: 'Action inconnue' }, 400)
  } catch (e) {
    return json(req,{ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

function json(req: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...(corsHeaders(req) || {}), 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
