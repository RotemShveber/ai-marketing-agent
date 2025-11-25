import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/settings/analytics - Get analytics overview
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const platform = searchParams.get('platform')

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

    // Build query for post analytics
    let query = supabase
      .from('post_analytics')
      .select('*')
      .eq('tenant_id', tenantId)

    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }
    if (platform) {
      query = query.eq('platform', platform)
    }

    const { data: analytics, error: analyticsError } = await query.order('date', { ascending: false })

    if (analyticsError) {
      throw analyticsError
    }

    // Calculate totals and averages
    const totals = analytics?.reduce((acc, record) => {
      return {
        views: acc.views + (record.views || 0),
        likes: acc.likes + (record.likes || 0),
        comments: acc.comments + (record.comments || 0),
        shares: acc.shares + (record.shares || 0),
        clicks: acc.clicks + (record.clicks || 0),
        impressions: acc.impressions + (record.impressions || 0),
        reach: acc.reach + (record.reach || 0)
      }
    }, {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      impressions: 0,
      reach: 0
    }) || {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      impressions: 0,
      reach: 0
    }

    // Calculate average engagement rate
    const avgEngagementRate = analytics && analytics.length > 0
      ? analytics.reduce((sum, record) => sum + (record.engagement_rate || 0), 0) / analytics.length
      : 0

    // Calculate average CTR
    const avgCTR = analytics && analytics.length > 0
      ? analytics.reduce((sum, record) => sum + (record.click_through_rate || 0), 0) / analytics.length
      : 0

    // Group by platform
    const byPlatform = analytics?.reduce((acc, record) => {
      const platform = record.platform
      if (!acc[platform]) {
        acc[platform] = {
          platform,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          clicks: 0,
          impressions: 0,
          posts_count: 0
        }
      }
      acc[platform].views += record.views || 0
      acc[platform].likes += record.likes || 0
      acc[platform].comments += record.comments || 0
      acc[platform].shares += record.shares || 0
      acc[platform].clicks += record.clicks || 0
      acc[platform].impressions += record.impressions || 0
      acc[platform].posts_count += 1
      return acc
    }, {} as Record<string, any>) || {}

    return NextResponse.json({
      totals,
      averages: {
        engagement_rate: Number(avgEngagementRate.toFixed(2)),
        click_through_rate: Number(avgCTR.toFixed(2))
      },
      by_platform: Object.values(byPlatform),
      records: analytics || []
    })

  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// POST /api/settings/analytics - Record analytics event (for webhook integrations)
const eventSchema = z.object({
  tenantId: z.string().uuid(),
  contentItemId: z.string().uuid().optional(),
  scheduledPostId: z.string().uuid().optional(),
  eventType: z.enum(['view', 'like', 'comment', 'share', 'click', 'impression']),
  platform: z.string(),
  eventValue: z.number().default(1),
  eventMetadata: z.record(z.any()).optional(),
  externalEventId: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = eventSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const {
      tenantId,
      contentItemId,
      scheduledPostId,
      eventType,
      platform,
      eventValue,
      eventMetadata,
      externalEventId
    } = validation.data

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

    // Insert analytics event
    const { data: event, error: eventError } = await supabase
      .from('analytics_events')
      .insert({
        tenant_id: tenantId,
        content_item_id: contentItemId,
        scheduled_post_id: scheduledPostId,
        event_type: eventType,
        platform,
        event_value: eventValue,
        event_metadata: eventMetadata || {},
        external_event_id: externalEventId
      })
      .select()
      .single()

    if (eventError) {
      throw eventError
    }

    // Update aggregated analytics
    if (scheduledPostId) {
      await updatePostAnalytics(supabase, tenantId, scheduledPostId, platform, eventType, eventValue)
    }

    return NextResponse.json({ success: true, event })

  } catch (error: any) {
    console.error('Error recording analytics event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record analytics event' },
      { status: 500 }
    )
  }
}

// Helper function to update post analytics aggregates
async function updatePostAnalytics(
  supabase: any,
  tenantId: string,
  scheduledPostId: string,
  platform: string,
  eventType: string,
  eventValue: number
) {
  const today = new Date().toISOString().split('T')[0]

  // Get current analytics record
  const { data: existing } = await supabase
    .from('post_analytics')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('scheduled_post_id', scheduledPostId)
    .eq('platform', platform)
    .eq('date', today)
    .single()

  const updates: any = {}

  // Increment the appropriate metric
  switch (eventType) {
    case 'view':
      updates.views = (existing?.views || 0) + eventValue
      break
    case 'like':
      updates.likes = (existing?.likes || 0) + eventValue
      break
    case 'comment':
      updates.comments = (existing?.comments || 0) + eventValue
      break
    case 'share':
      updates.shares = (existing?.shares || 0) + eventValue
      break
    case 'click':
      updates.clicks = (existing?.clicks || 0) + eventValue
      break
    case 'impression':
      updates.impressions = (existing?.impressions || 0) + eventValue
      break
  }

  if (existing) {
    // Calculate engagement rate and CTR
    const newTotals = { ...existing, ...updates }
    const totalEngagement = newTotals.likes + newTotals.comments + newTotals.shares
    const engagementRate = newTotals.impressions > 0
      ? (totalEngagement / newTotals.impressions) * 100
      : 0
    const ctr = newTotals.impressions > 0
      ? (newTotals.clicks / newTotals.impressions) * 100
      : 0

    updates.engagement_rate = Number(engagementRate.toFixed(2))
    updates.click_through_rate = Number(ctr.toFixed(2))

    // Update existing record
    await supabase
      .from('post_analytics')
      .update(updates)
      .eq('id', existing.id)
  } else {
    // Get content_item_id from scheduled_post
    const { data: scheduledPost } = await supabase
      .from('scheduled_posts')
      .select('content_item_id')
      .eq('id', scheduledPostId)
      .single()

    // Create new record
    await supabase
      .from('post_analytics')
      .insert({
        tenant_id: tenantId,
        content_item_id: scheduledPost?.content_item_id,
        scheduled_post_id: scheduledPostId,
        platform,
        date: today,
        ...updates,
        engagement_rate: 0,
        click_through_rate: 0
      })
  }
}
