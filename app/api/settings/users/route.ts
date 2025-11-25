import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/settings/users - List all users in a tenant
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

    if (!tenantUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all users in the tenant with their roles
    const { data: users, error: usersError } = await supabase
      .from('tenant_users')
      .select(`
        user_id,
        role,
        created_at,
        users (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (usersError) {
      throw usersError
    }

    // Transform the response
    const formattedUsers = users?.map(tu => ({
      id: tu.user_id,
      email: tu.users?.email,
      full_name: tu.users?.full_name,
      avatar_url: tu.users?.avatar_url,
      role: tu.role,
      joined_at: tu.created_at
    })) || []

    return NextResponse.json({ users: formattedUsers })

  } catch (error: any) {
    console.error('Error fetching tenant users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/users - Remove user from tenant
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, userId } = body

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'Tenant ID and User ID are required' },
        { status: 400 }
      )
    }

    // Verify requesting user is owner or admin
    const { data: requestingUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!requestingUser || !['owner', 'admin'].includes(requestingUser.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can remove users' },
        { status: 403 }
      )
    }

    // Check target user's role (can't remove owner)
    const { data: targetUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .single()

    if (targetUser?.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove tenant owner' },
        { status: 400 }
      )
    }

    // Remove user from tenant
    const { error: deleteError } = await supabase
      .from('tenant_users')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)

    if (deleteError) {
      throw deleteError
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'user_removed',
      resource_type: 'tenant_user',
      resource_id: userId,
      metadata: { removed_user_id: userId }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error removing user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to remove user' },
      { status: 500 }
    )
  }
}
