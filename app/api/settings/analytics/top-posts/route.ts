import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings/analytics/top-posts - Get top performing posts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const tenantId = searchParams.get('tenantId')
    const metric = searchParams.get('metric') || 'engagement_rate' // views, likes, engagement_rate, etc.
    const limit = parseInt(searchParams.get('limit') || '10')
    const platform = searchParams.get('platform')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

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

    // Build query
    let query = supabase
      .from('post_analytics')
      .select(`
        *,
        content_items (
          id,
          type,
          text_content,
          platform,
          created_at
        ),
        scheduled_posts (
          id,
          scheduled_at,
          published_at,
          status
        )
      `)
      .eq('tenant_id', tenantId)

    if (platform) {
      query = query.eq('platform', platform)
    }
    if (startDate) {
      query = query.gte('date', startDate)
    }
    if (endDate) {
      query = query.lte('date', endDate)
    }

    // Order by requested metric
    const validMetrics = ['views', 'likes', 'comments', 'shares', 'clicks', 'impressions', 'engagement_rate', 'click_through_rate']
    const orderBy = validMetrics.includes(metric) ? metric : 'engagement_rate'

    const { data: topPosts, error: postsError } = await query
      .order(orderBy, { ascending: false })
      .limit(limit)

    if (postsError) {
      throw postsError
    }

    // Format response
    const formattedPosts = topPosts?.map(post => ({
      id: post.id,
      content_item_id: post.content_item_id,
      scheduled_post_id: post.scheduled_post_id,
      platform: post.platform,
      date: post.date,
      metrics: {
        views: post.views,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares,
        clicks: post.clicks,
        impressions: post.impressions,
        engagement_rate: post.engagement_rate,
        click_through_rate: post.click_through_rate,
        reach: post.reach
      },
      content: post.content_items ? {
        type: post.content_items.type,
        text_content: post.content_items.text_content,
        platform: post.content_items.platform,
        created_at: post.content_items.created_at
      } : null,
      schedule_info: post.scheduled_posts ? {
        scheduled_at: post.scheduled_posts.scheduled_at,
        published_at: post.scheduled_posts.published_at,
        status: post.scheduled_posts.status
      } : null
    })) || []

    return NextResponse.json({ top_posts: formattedPosts })

  } catch (error: any) {
    console.error('Error fetching top posts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch top posts' },
      { status: 500 }
    )
  }
}
