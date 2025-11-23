import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase, supabaseAdmin } from '@/lib/supabase/server'

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
    const { tenantId, name, industry, tone, targetAudience, brandGuidelines } = body

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: 'tenantId and name are required' },
        { status: 400 }
      )
    }

    // Verify access using admin client (bypasses RLS)
    const { data: tenantUser } = await supabaseAdmin
      .from('tenant_users')
      .select('tenant_id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Create brand profile using admin client
    const { data, error } = await supabaseAdmin
      .from('brand_profiles')
      .insert({
        tenant_id: tenantId,
        name,
        industry: industry || null,
        tone: tone || null,
        target_audience: targetAudience || null,
        brand_guidelines: brandGuidelines || null,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error creating brand profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
