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
    const { name, slug } = body

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Ensure user exists in users table
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existingUser) {
      // Create user record
      const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || null,
        })

      if (userError) {
        console.error('Error creating user:', userError)
        throw userError
      }
    }

    // Check if user already has a tenant with this slug
    const { data: existingTenant } = await supabaseAdmin
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingTenant) {
      // Check if user is already linked to this tenant
      const { data: existingLink } = await supabaseAdmin
        .from('tenant_users')
        .select('id')
        .eq('tenant_id', existingTenant.id)
        .eq('user_id', user.id)
        .single()

      if (existingLink) {
        // Already linked, just return the tenant
        return NextResponse.json({ data: existingTenant })
      }

      // Link user to existing tenant
      await supabaseAdmin
        .from('tenant_users')
        .insert({
          tenant_id: existingTenant.id,
          user_id: user.id,
          role: 'owner',
        })

      return NextResponse.json({ data: existingTenant })
    }

    // Create new tenant
    const { data: tenant, error } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Link user to tenant as owner
    const { error: linkError } = await supabaseAdmin
      .from('tenant_users')
      .insert({
        tenant_id: tenant.id,
        user_id: user.id,
        role: 'owner',
      })

    if (linkError) {
      console.error('Error linking user to tenant:', linkError)
      throw linkError
    }

    return NextResponse.json({ data: tenant })
  } catch (error: any) {
    console.error('Error creating tenant:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
