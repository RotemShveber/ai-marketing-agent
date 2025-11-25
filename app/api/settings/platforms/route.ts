import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/settings/platforms - List connected platforms
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

    // Get all platform connections for this tenant
    const { data: connections, error: connectionsError } = await supabase
      .from('platform_connections')
      .select(`
        id,
        platform,
        platform_user_id,
        platform_username,
        is_active,
        last_sync_at,
        token_expires_at,
        created_at,
        users (
          full_name,
          email
        )
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (connectionsError) {
      throw connectionsError
    }

    // Format response (don't expose tokens)
    const formattedConnections = connections?.map(conn => ({
      id: conn.id,
      platform: conn.platform,
      platform_user_id: conn.platform_user_id,
      platform_username: conn.platform_username,
      is_active: conn.is_active,
      last_sync_at: conn.last_sync_at,
      token_expires_at: conn.token_expires_at,
      is_expired: conn.token_expires_at ? new Date(conn.token_expires_at) < new Date() : false,
      connected_by: conn.users,
      created_at: conn.created_at
    })) || []

    return NextResponse.json({ connections: formattedConnections })

  } catch (error: any) {
    console.error('Error fetching platform connections:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch platform connections' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/platforms - Disconnect a platform
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, connectionId } = body

    if (!tenantId || !connectionId) {
      return NextResponse.json(
        { error: 'Tenant ID and Connection ID are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can disconnect platforms' },
        { status: 403 }
      )
    }

    // Delete the connection
    const { error: deleteError } = await supabase
      .from('platform_connections')
      .delete()
      .eq('id', connectionId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      throw deleteError
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'platform_disconnected',
      resource_type: 'platform_connection',
      resource_id: connectionId
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}
