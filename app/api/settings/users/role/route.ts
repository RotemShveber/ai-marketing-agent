import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateRoleSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  newRole: z.enum(['admin', 'member', 'viewer'])
})

// PATCH /api/settings/users/role - Update user role
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, userId, newRole } = validation.data

    // Verify requesting user is owner or admin
    const { data: requestingUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can update user roles' },
        { status: 403 }
      )
    }

    // Check target user exists and get current role
    const { data: targetUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in tenant' }, { status: 404 })
    }

    // Can't change owner role
    if (targetUser.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot change owner role' },
        { status: 400 }
      )
    }

    // Update the role
    const { error: updateError } = await supabase
      .from('tenant_users')
      .update({ role: newRole })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)

    if (updateError) {
      throw updateError
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'user_role_updated',
      resource_type: 'tenant_user',
      resource_id: userId,
      metadata: {
        target_user_id: userId,
        old_role: targetUser.role,
        new_role: newRole
      }
    })

    return NextResponse.json({ success: true, newRole })

  } catch (error: any) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user role' },
      { status: 500 }
    )
  }
}
