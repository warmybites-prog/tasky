import { withSupabase } from 'npm:@supabase/server@^1'

type InviteBody = {
  workspaceId?: string
  name?: string
  email?: string
  role?: 'admin' | 'member'
  redirectTo?: string | null
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()

export default {
  fetch: withSupabase({ auth: 'user' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 })
    }

    let body: InviteBody
    try {
      body = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const workspaceId = body.workspaceId?.trim()
    const name = body.name?.trim()
    const email = normalizeEmail(body.email ?? '')
    const role = body.role === 'admin' ? 'admin' : 'member'
    const redirectTo = body.redirectTo?.trim() || undefined

    if (!workspaceId || !name || !email || !email.includes('@')) {
      return Response.json({ error: 'workspaceId, name and a valid email are required' }, { status: 400 })
    }

    const { data: authData, error: authError } = await ctx.supabase.auth.getUser()
    const caller = authData.user
    if (authError || !caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Never trust the browser's claimed role. Verify the caller is an active admin.
    const { data: callerMembership, error: callerMembershipError } = await ctx.supabaseAdmin
      .from('workspace_members')
      .select('id, role, status')
      .eq('workspace_id', workspaceId)
      .eq('user_id', caller.id)
      .eq('status', 'active')
      .maybeSingle()

    if (callerMembershipError) {
      console.error('caller membership lookup failed', callerMembershipError)
      return Response.json({ error: 'Could not verify workspace permissions' }, { status: 500 })
    }

    if (!callerMembership || callerMembership.role !== 'admin') {
      return Response.json({ error: 'Only workspace admins can invite members' }, { status: 403 })
    }

    const { data: workspace, error: workspaceError } = await ctx.supabaseAdmin
      .from('workspaces')
      .select('id, name, plan_id')
      .eq('id', workspaceId)
      .single()

    if (workspaceError || !workspace) {
      return Response.json({ error: 'Workspace not found' }, { status: 404 })
    }

    // Enforce the plan seat limit on the server too.
    const { count: reservedSeats, error: countError } = await ctx.supabaseAdmin
      .from('workspace_members')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['active', 'invited'])

    if (countError) {
      console.error('seat count failed', countError)
      return Response.json({ error: 'Could not validate seat availability' }, { status: 500 })
    }

    const { data: plan } = await ctx.supabaseAdmin
      .from('plans')
      .select('seats_limit')
      .eq('id', workspace.plan_id)
      .maybeSingle()

    if (plan?.seats_limit != null && (reservedSeats ?? 0) >= plan.seats_limit) {
      return Response.json({ error: 'SEAT_LIMIT_REACHED' }, { status: 409 })
    }

    // Prevent a duplicate active membership or pending invite in this workspace.
    const { data: duplicate, error: duplicateError } = await ctx.supabaseAdmin
      .from('workspace_members')
      .select('id, status')
      .eq('workspace_id', workspaceId)
      .ilike('invited_email', email)
      .in('status', ['active', 'invited'])
      .limit(1)
      .maybeSingle()

    if (duplicateError) {
      console.error('duplicate lookup failed', duplicateError)
      return Response.json({ error: 'Could not validate invite' }, { status: 500 })
    }

    if (duplicate) {
      return Response.json({ error: 'ALREADY_INVITED_OR_MEMBER' }, { status: 409 })
    }

    const inviteOptions: Record<string, unknown> = {
      data: {
        full_name: name,
        tasky_invited: true,
        tasky_workspace_id: workspaceId,
        tasky_workspace_name: workspace.name,
        tasky_role: role,
      },
    }

    if (redirectTo && /^https?:\/\//i.test(redirectTo)) {
      inviteOptions.redirectTo = redirectTo
    }

    // Auth admin invitation must run on the server/admin client, never in browser code.
    const { data: inviteData, error: inviteError } = await ctx.supabaseAdmin.auth.admin.inviteUserByEmail(
      email,
      inviteOptions,
    )

    if (inviteError) {
      console.error('auth invite failed', inviteError)
      return Response.json(
        {
          error: 'AUTH_INVITE_FAILED',
          detail: inviteError.message,
          hint: 'If this email already has a confirmed Tasky account, Supabase Auth admin invite will reject it. Invite a new email for this V5 flow.',
        },
        { status: 400 },
      )
    }

    const invitedUserId = inviteData.user?.id ?? null

    const { data: membership, error: membershipError } = await ctx.supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: invitedUserId,
        role,
        status: 'invited',
        invited_name: name,
        invited_email: email,
        invited_by: caller.id,
      })
      .select('id, user_id, role, status, invited_name, invited_email, invited_at')
      .single()

    if (membershipError) {
      console.error('membership insert failed', membershipError)

      // The auth invite created a brand-new unconfirmed user. If our membership write fails,
      // remove that incomplete invited user so the emailed link does not point to a broken invite.
      if (invitedUserId) {
        const { error: cleanupError } = await ctx.supabaseAdmin.auth.admin.deleteUser(invitedUserId)
        if (cleanupError) console.error('invite cleanup failed', cleanupError)
      }

      return Response.json({ error: 'Could not create workspace invitation' }, { status: 500 })
    }

    return Response.json({
      ok: true,
      emailSent: true,
      membership,
      redirectTo: redirectTo ?? null,
    })
  }),
}
