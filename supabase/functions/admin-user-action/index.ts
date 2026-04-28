import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const respond = (body: object, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return respond({ error: 'Missing authorization' }, 401)

    // Verify the caller is an admin
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user: caller }, error: authError } = await anonClient.auth.getUser()
    if (authError || !caller) return respond({ error: 'Unauthorized' }, 401)
    if (caller.app_metadata?.role !== 'admin') return respond({ error: 'Forbidden' }, 403)

    // Admin client with service role — bypasses RLS
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const body = await req.json()
    const { action } = body

    // ── Invite a new user ──────────────────────────────────────────────────
    if (action === 'invite') {
      const { email, full_name, role } = body

      if (!email || typeof email !== 'string') {
        return respond({ error: 'Missing or invalid email' }, 400)
      }
      if (!['admin', 'contributor', 'user'].includes(role)) {
        return respond({ error: 'Invalid role' }, 400)
      }

      const origin = req.headers.get('origin') || ''
      const redirectTo = `${origin}/resetpassword`

      const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(
        email.toLowerCase().trim(),
        {
          data: { full_name: (full_name || '').trim() },
          redirectTo,
        }
      )

      if (inviteErr) return respond({ error: inviteErr.message }, 400)

      // Set role in app_metadata (JWT claims)
      const { error: roleErr } = await adminClient.auth.admin.updateUserById(invited.user.id, {
        app_metadata: { role },
      })
      if (roleErr) return respond({ error: roleErr.message }, 400)

      // Sync profiles table (trigger may not have fired yet → upsert)
      await adminClient.from('profiles').upsert({
        id: invited.user.id,
        email: email.toLowerCase().trim(),
        full_name: (full_name || '').trim(),
        role,
      })

      return respond({ success: true })
    }

    // ── Delete a user ──────────────────────────────────────────────────────
    if (action === 'delete') {
      const { userId } = body
      if (!userId) return respond({ error: 'Missing userId' }, 400)
      if (userId === caller.id) return respond({ error: 'Cannot delete your own account' }, 400)

      // Remove from all location contributor lists first
      await adminClient.rpc('cleanup_contributor', { p_user_id: userId })

      // Delete from auth (cascades to profiles via FK if set up, otherwise clean manually)
      await adminClient.from('profiles').delete().eq('id', userId)

      const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId)
      if (deleteErr) return respond({ error: deleteErr.message }, 400)

      return respond({ success: true })
    }

    return respond({ error: 'Unknown action' }, 400)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return respond({ error: message }, 500)
  }
})
