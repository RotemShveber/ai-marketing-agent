import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/settings/preferences - Get user preferences
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user settings
    let { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code === 'PGRST116') {
      // Settings don't exist, create default settings
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          content_ready_notifications: true,
          post_published_notifications: true,
          team_activity_notifications: false,
          weekly_digest: true,
          theme: 'light',
          timezone: 'UTC',
          language: 'en',
          auto_save_drafts: true,
          two_factor_enabled: false,
          session_timeout_minutes: 480
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      settings = newSettings
    } else if (settingsError) {
      throw settingsError
    }

    return NextResponse.json({ settings })

  } catch (error: any) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user settings' },
      { status: 500 }
    )
  }
}

const updatePreferencesSchema = z.object({
  // Notification preferences
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  content_ready_notifications: z.boolean().optional(),
  post_published_notifications: z.boolean().optional(),
  team_activity_notifications: z.boolean().optional(),
  weekly_digest: z.boolean().optional(),

  // Display preferences
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),

  // Content preferences
  default_tone: z.string().optional(),
  default_platforms: z.array(z.string()).optional(),
  auto_save_drafts: z.boolean().optional(),

  // Security
  two_factor_enabled: z.boolean().optional(),
  session_timeout_minutes: z.number().int().min(15).max(10080).optional(), // 15 min to 7 days

  // Custom metadata
  settings_metadata: z.record(z.any()).optional()
})

// PATCH /api/settings/preferences - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = updatePreferencesSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      )
    }

    const updates = validation.data

    // Check if settings exist
    const { data: existing } = await supabase
      .from('user_settings')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      // Create new settings with updates
      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...updates
        })
        .select()
        .single()

      if (createError) {
        throw createError
      }

      return NextResponse.json({ success: true, settings: newSettings })
    }

    // Update existing settings
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ success: true, settings: updatedSettings })

  } catch (error: any) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user settings' },
      { status: 500 }
    )
  }
}
