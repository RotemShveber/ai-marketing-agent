import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase } from '@/lib/supabase/server'
import { z } from 'zod'

const scheduleSchema = z.object({
  tenantId: z.string(),
  contentItemId: z.string(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'linkedin']),
  scheduledAt: z.string(), // ISO date string
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientSupabase()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = scheduleSchema.parse(body)

    // Verify access
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id')
      .eq('tenant_id', validated.tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify content item belongs to tenant
    const { data: contentItem } = await supabase
      .from('content_items')
      .select('id, tenant_id')
      .eq('id', validated.contentItemId)
      .eq('tenant_id', validated.tenantId)
      .single()

    if (!contentItem) {
      return NextResponse.json(
        { error: 'Content item not found' },
        { status: 404 }
      )
    }

    // Create scheduled post
    const { data: scheduledPost, error } = await supabase
      .from('scheduled_posts')
      .insert({
        tenant_id: validated.tenantId,
        content_item_id: validated.contentItemId,
        platform: validated.platform,
        scheduled_at: validated.scheduledAt,
        status: 'scheduled',
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Update content item status
    await supabase
      .from('content_items')
      .update({ status: 'scheduled' })
      .eq('id', validated.contentItemId)

    // Log audit
    await supabase
      .from('audit_logs')
      .insert({
        tenant_id: validated.tenantId,
        user_id: user.id,
        action: 'scheduled',
        resource_type: 'scheduled_post',
        resource_id: scheduledPost.id,
        metadata: {
          platform: validated.platform,
          scheduledAt: validated.scheduledAt,
        },
      })

    return NextResponse.json({ data: scheduledPost })
  } catch (error) {
    console.error('Error scheduling post:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientSupabase()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!tenantId) {
      return NextResponse.json(
        { error: 'tenantId is required' },
        { status: 400 }
      )
    }

    // Verify access
    const { data: tenantUser } = await supabase
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

    // Build query
    let query = supabase
      .from('scheduled_posts')
      .select(`
        *,
        content_items (
          id,
          type,
          title,
          text_content,
          images (*),
          videos (*)
        )
      `)
      .eq('tenant_id', tenantId)
      .order('scheduled_at', { ascending: true })

    if (startDate) {
      query = query.gte('scheduled_at', startDate)
    }

    if (endDate) {
      query = query.lte('scheduled_at', endDate)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error fetching scheduled posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

