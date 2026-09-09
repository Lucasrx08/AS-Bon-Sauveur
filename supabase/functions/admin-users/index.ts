import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = Deno.env.get('SUPABASE_URL')!
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userError } = await caller.auth.getUser()
    if (userError || !user) return json({ error: 'Non authentifié' }, 401)

    const { data: profile } = await caller.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return json({ error: 'Accès administrateur requis' }, 403)

    const admin = createClient(url, service)
    const body = await req.json()

    if (body.action === 'invite') {
      const allowedRoles = ['educator_football','educator_escalade','educator_gymnastique','teacher_as','admin']
      if (!body.email || !allowedRoles.includes(body.role)) return json({ error: 'Paramètres invalides' }, 400)

      const { data, error } = await admin.auth.admin.inviteUserByEmail(String(body.email).trim().toLowerCase(), {
        data: { display_name: body.displayName || body.email },
        redirectTo: body.redirectTo,
      })
      if (error) return json({ error: error.message }, 400)

      if (data.user) {
        const { error: profileError } = await admin.from('profiles').update({
          display_name: body.displayName || body.email,
          email: String(body.email).trim().toLowerCase(),
          role: body.role,
        }).eq('id', data.user.id)
        if (profileError) return json({ error: profileError.message }, 400)
      }
      return json({ ok: true })
    }

    if (body.action === 'remove_access') {
      const targetId = String(body.userId || '')
      if (!targetId) return json({ error: 'Utilisateur manquant' }, 400)
      if (targetId === user.id) return json({ error: 'Vous ne pouvez pas supprimer votre propre accès administrateur.' }, 400)
      const { error } = await admin.auth.admin.deleteUser(targetId)
      if (error) return json({ error: error.message }, 400)
      return json({ ok: true })
    }

    return json({ error: 'Action inconnue' }, 400)
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
