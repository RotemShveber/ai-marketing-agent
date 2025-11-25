import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const credentialSchema = z.object({
  tenantId: z.string().uuid(),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads']),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  scopes: z.array(z.string()).optional(),
  redirectUri: z.string().url().optional()
})

// GET /api/settings/platforms/credentials - Get all platform credentials for tenant
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

    // Verify user is owner or admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Get all credentials for this tenant
    const { data: credentials, error: credError } = await supabase
      .from('platform_credentials')
      .select('id, platform, client_id, scopes, redirect_uri, is_active, last_tested_at, test_status, created_at')
      .eq('tenant_id', tenantId)
      .order('platform')

    if (credError) {
      throw credError
    }

    // Don't return client_secret in GET requests for security
    return NextResponse.json({ credentials: credentials || [] })

  } catch (error: any) {
    console.error('Error fetching platform credentials:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch platform credentials' },
      { status: 500 }
    )
  }
}

// POST /api/settings/platforms/credentials - Create or update platform credentials
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = credentialSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { tenantId, platform, clientId, clientSecret, scopes, redirectUri } = validation.data

    // Verify user is owner or admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Check if credentials already exist for this platform
    const { data: existing } = await supabase
      .from('platform_credentials')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('platform', platform)
      .single()

    if (existing) {
      // Update existing credentials
      const { data: updated, error: updateError } = await supabase
        .from('platform_credentials')
        .update({
          client_id: clientId,
          client_secret: clientSecret, // TODO: Encrypt in production
          scopes: scopes || [],
          redirect_uri: redirectUri,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select('id, platform, client_id, scopes, redirect_uri, is_active, created_at')
        .single()

      if (updateError) {
        throw updateError
      }

      return NextResponse.json({
        success: true,
        message: 'Credentials updated successfully',
        credential: updated
      })
    }

    // Create new credentials
    const { data: created, error: createError } = await supabase
      .from('platform_credentials')
      .insert({
        tenant_id: tenantId,
        platform,
        client_id: clientId,
        client_secret: clientSecret, // TODO: Encrypt in production
        scopes: scopes || [],
        redirect_uri: redirectUri,
        created_by: user.id
      })
      .select('id, platform, client_id, scopes, redirect_uri, is_active, created_at')
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      success: true,
      message: 'Credentials created successfully',
      credential: created
    })

  } catch (error: any) {
    console.error('Error saving platform credentials:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save platform credentials' },
      { status: 500 }
    )
  }
}

// DELETE /api/settings/platforms/credentials - Delete platform credentials
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, credentialId } = body

    if (!tenantId || !credentialId) {
      return NextResponse.json(
        { error: 'Tenant ID and Credential ID are required' },
        { status: 400 }
      )
    }

    // Verify user is owner or admin
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser || !['owner', 'admin'].includes(tenantUser.role)) {
      return NextResponse.json({ error: 'Access denied. Admin role required.' }, { status: 403 })
    }

    // Delete the credentials
    const { error: deleteError } = await supabase
      .from('platform_credentials')
      .delete()
      .eq('id', credentialId)
      .eq('tenant_id', tenantId)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({ success: true, message: 'Credentials deleted successfully' })

  } catch (error: any) {
    console.error('Error deleting platform credentials:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete platform credentials' },
      { status: 500 }
    )
  }
}
