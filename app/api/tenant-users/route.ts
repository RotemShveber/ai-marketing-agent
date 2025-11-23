import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { tenantId, userId, role = 'member' } = body

    if (!tenantId || !userId) {
      return NextResponse.json(
        { error: 'tenantId and userId are required' },
        { status: 400 }
      )
    }

    // Verify the requesting user has access to the tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create tenant user link using admin client
    const { data, error } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        role,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error creating tenant user:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

