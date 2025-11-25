import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const connectSchema = z.object({
  tenantId: z.string().uuid(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads']),
  code: z.string(), // OAuth authorization code
  redirectUri: z.string().url()
})

// POST /api/settings/platforms/connect - Connect a platform via OAuth
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = connectSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, platform, code, redirectUri } = validation.data

    // Verify user has access to this tenant
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json(
        { error: 'Only owners and admins can connect platforms' },
        { status: 403 }
      )
    }

    // Exchange authorization code for access token
    // This is where you'd integrate with each platform's OAuth API
    const tokenData = await exchangeCodeForToken(platform, code, redirectUri)

    if (!tokenData.success) {
      return NextResponse.json(
        { error: tokenData.error || 'Failed to exchange authorization code' },
        { status: 400 }
      )
    }

    // Get platform user info
    const userInfo = await getPlatformUserInfo(platform, tokenData.access_token)

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('platform_connections')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('platform', platform)
      .eq('platform_user_id', userInfo.platform_user_id)
      .single()

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('platform_connections')
        .update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_at,
          scopes: tokenData.scopes || [],
          is_active: true,
          platform_username: userInfo.username,
          connection_metadata: userInfo.metadata || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        connection_id: existingConnection.id,
        message: 'Platform connection updated'
      })
    }

    // Create new connection
    const { data: connection, error: insertError } = await supabase
      .from('platform_connections')
      .insert({
        tenant_id: tenantId,
        user_id: user.id,
        platform,
        platform_user_id: userInfo.platform_user_id,
        platform_username: userInfo.username,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: tokenData.expires_at,
        scopes: tokenData.scopes || [],
        is_active: true,
        connection_metadata: userInfo.metadata || {}
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    // Log the action
    await supabase.from('audit_logs').insert({
      tenant_id: tenantId,
      user_id: user.id,
      action: 'platform_connected',
      resource_type: 'platform_connection',
      resource_id: connection.id,
      metadata: { platform, platform_username: userInfo.username }
    })

    return NextResponse.json({
      success: true,
      connection_id: connection.id,
      message: 'Platform connected successfully'
    })

  } catch (error: any) {
    console.error('Error connecting platform:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect platform' },
      { status: 500 }
    )
  }
}

// Helper function to exchange OAuth code for tokens
async function exchangeCodeForToken(
  platform: string,
  code: string,
  redirectUri: string
): Promise<any> {
  // This is a placeholder - in production, you'd implement OAuth flows for each platform
  // For now, return a mock success response

  // Example for different platforms:
  switch (platform) {
    case 'instagram':
    case 'facebook':
      // Use Facebook Graph API OAuth
      // https://developers.facebook.com/docs/facebook-login/guides/access-tokens
      return {
        success: false,
        error: 'Facebook/Instagram OAuth not yet implemented. Please configure FB_APP_ID and FB_APP_SECRET environment variables.'
      }

    case 'tiktok':
      // Use TikTok OAuth
      // https://developers.tiktok.com/doc/login-kit-web
      return {
        success: false,
        error: 'TikTok OAuth not yet implemented. Please configure TIKTOK_CLIENT_KEY environment variables.'
      }

    case 'linkedin':
      // Use LinkedIn OAuth 2.0
      // https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication
      return {
        success: false,
        error: 'LinkedIn OAuth not yet implemented. Please configure LINKEDIN_CLIENT_ID environment variables.'
      }

    case 'youtube':
      // Use Google OAuth 2.0
      // https://developers.google.com/identity/protocols/oauth2
      return {
        success: false,
        error: 'YouTube OAuth not yet implemented. Please configure GOOGLE_CLIENT_ID environment variables.'
      }

    case 'google_ads':
      // Use Google Ads API OAuth
      // https://developers.google.com/google-ads/api/docs/oauth/overview
      return {
        success: false,
        error: 'Google Ads OAuth not yet implemented. Please configure GOOGLE_ADS_CLIENT_ID environment variables.'
      }

    default:
      return {
        success: false,
        error: 'Unsupported platform'
      }
  }

  // Example successful response structure:
  // return {
  //   success: true,
  //   access_token: 'encrypted_token_here',
  //   refresh_token: 'encrypted_refresh_token_here',
  //   expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  //   scopes: ['publish_content', 'read_insights']
  // }
}

// Helper function to get platform user info
async function getPlatformUserInfo(
  platform: string,
  accessToken: string
): Promise<any> {
  // This is a placeholder - in production, you'd call each platform's API
  // to get user profile information

  // Example return structure:
  return {
    platform_user_id: 'mock_user_id_' + Math.random().toString(36).substring(7),
    username: 'demo_user',
    metadata: {
      profile_url: '',
      followers_count: 0
    }
  }
}
