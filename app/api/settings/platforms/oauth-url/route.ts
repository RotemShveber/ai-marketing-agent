import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const oauthUrlSchema = z.object({
  tenantId: z.string().uuid(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads']),
  redirectUri: z.string().url()
})

// POST /api/settings/platforms/oauth-url - Get OAuth authorization URL
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = oauthUrlSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, platform, redirectUri } = validation.data

    // Verify user has access to tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get platform credentials from database
    const { data: credentials, error: credError } = await supabase
      .from('platform_credentials')
      .select('client_id, scopes, redirect_uri')
      .eq('tenant_id', tenantId)
      .eq('platform', platform)
      .eq('is_active', true)
      .single()

    if (credError || !credentials) {
      return NextResponse.json(
        {
          error: `OAuth credentials not configured for ${platform}. Please add your API credentials in the Platform Settings.`,
          needs_configuration: true
        },
        { status: 400 }
      )
    }

    // Generate OAuth URL based on platform
    const oauthUrl = getOAuthUrl(
      platform,
      credentials.client_id,
      credentials.redirect_uri || redirectUri,
      credentials.scopes
    )

    if (!oauthUrl) {
      return NextResponse.json(
        { error: `Failed to generate OAuth URL for ${platform}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      oauth_url: oauthUrl,
      platform
    })

  } catch (error: any) {
    console.error('Error generating OAuth URL:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate OAuth URL' },
      { status: 500 }
    )
  }
}

// Helper function to generate OAuth URLs for each platform
function getOAuthUrl(
  platform: string,
  clientId: string,
  redirectUri: string,
  customScopes?: string[]
): string | null {
  switch (platform) {
    case 'instagram':
    case 'facebook':
      // Facebook OAuth - covers both Facebook and Instagram
      const fbScopes = customScopes && customScopes.length > 0
        ? customScopes.join(',')
        : [
            'instagram_basic',
            'instagram_content_publish',
            'pages_show_list',
            'pages_read_engagement',
            'pages_manage_posts'
          ].join(',')

      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${fbScopes}&response_type=code&state=${platform}`

    case 'tiktok':
      // TikTok OAuth
      const tiktokScopes = customScopes && customScopes.length > 0
        ? customScopes.join(',')
        : [
            'user.info.basic',
            'video.list',
            'video.upload'
          ].join(',')

      return `https://www.tiktok.com/auth/authorize/?client_key=${clientId}&scope=${tiktokScopes}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=tiktok`

    case 'linkedin':
      // LinkedIn OAuth 2.0
      const linkedinScopes = customScopes && customScopes.length > 0
        ? customScopes.join('%20')
        : [
            'r_liteprofile',
            'r_emailaddress',
            'w_member_social'
          ].join('%20')

      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${linkedinScopes}&state=linkedin`

    case 'youtube':
      // Google OAuth for YouTube
      const googleScopes = customScopes && customScopes.length > 0
        ? customScopes.join('%20')
        : [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube.readonly'
          ].join('%20')

      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${googleScopes}&response_type=code&access_type=offline&state=youtube`

    case 'google_ads':
      // Google OAuth for Google Ads
      const adsScopes = customScopes && customScopes.length > 0
        ? customScopes.join('%20')
        : ['https://www.googleapis.com/auth/adwords'].join('%20')

      return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${adsScopes}&response_type=code&access_type=offline&state=google_ads`

    default:
      return null
  }
}
