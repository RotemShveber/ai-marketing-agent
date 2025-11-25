import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'

const inviteSchema = z.object({
  tenantId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']).default('member')
})

// POST /api/settings/users/invite - Invite user to tenant
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = inviteSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, email, role } = validation.data

    // Verify requesting user is owner or admin
    const { data: requestingUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can invite users' },
        { status: 403 }
      )
    }

    // Check if user already exists in tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      const { data: existingMembership } = await supabase
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('user_id', existingUser.id)
        .single()

      if (existingMembership) {
        return NextResponse.json(
          { error: 'User is already a member of this tenant' },
          { status: 400 }
        )
      }
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabase
      .from('tenant_invitations')
      .select('id, expires_at')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .is('accepted_at', null)
      .single()

    if (existingInvite) {
      // Check if invitation is still valid
      const expiresAt = new Date(existingInvite.expires_at)
      if (expiresAt > new Date()) {
        return NextResponse.json(
          { error: 'An active invitation already exists for this email' },
          { status: 400 }
        )
      }
    }

    // Generate secure invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiration

    // Create invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('tenant_invitations')
      .insert({
        tenant_id: tenantId,
        invited_by: user.id,
        email,
        role,
        token,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (inviteError) {
      throw inviteError
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'user_invited',
      resource_type: 'tenant_invitation',
      resource_id: invitation.id,
      metadata: { email, role, token }
    })

    // TODO: Send invitation email
    // In production, you'd integrate with an email service here
    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email,
        role,
        expires_at: expiresAt,
        invitation_url: invitationUrl
      }
    })

  } catch (error: any) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to invite user' },
      { status: 500 }
    )
  }
}

// GET /api/settings/users/invite - List pending invitations
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    // Verify user has access to this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get pending invitations
    const { data: invitations, error: invitesError } = await supabase
      .from('tenant_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        users!tenant_invitations_invited_by_fkey (
          full_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })

    if (invitesError) {
      throw invitesError
    }

    // Filter out expired invitations and format response
    const now = new Date()
    const activeInvitations = invitations?.filter(inv => {
      return new Date(inv.expires_at) > now
    }).map(inv => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      expires_at: inv.expires_at,
      created_at: inv.created_at,
      invited_by: inv.users
    })) || []

    return NextResponse.json({ invitations: activeInvitations })

  } catch (error: any) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}
