import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/settings/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw profileError
    }

    // Get user's tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenant_users')
      .select(`
        role,
        tenants (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', user.id)

    if (tenantsError) {
      throw tenantsError
    }

    return NextResponse.json({
      profile,
      tenants: tenants?.map(tu => ({
        id: tu.tenants?.id,
        name: tu.tenants?.name,
        slug: tu.tenants?.slug,
        role: tu.role
      })) || []
    })

  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}

const updateProfileSchema = z.object({
  full_name: z.string().min(1).max(255).optional(),
  avatar_url: z.string().url().optional().nullable()
})

// PATCH /api/settings/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updateProfileSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Update user profile
    const { data: profile, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, profile })

  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user profile' },
      { status: 500 }
    )
  }
}
