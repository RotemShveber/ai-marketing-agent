import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase, supabaseAdmin } from '@/lib/supabase/server'
import { generateContent, contentGenerationSchema } from '@/lib/ai/agent'

export const maxDuration = 300 // 5 minutes for content generation

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

    // Validate request
    const validationResult = contentGenerationSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.message },
        { status: 400 }
      )
    }

    const validatedRequest = validationResult.data

    // Verify user has access to tenant using admin client
    const { data: tenantUser } = await supabaseAdmin
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('tenant_id', validatedRequest.tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser) {
      return NextResponse.json(
        { error: 'Access denied to tenant' },
        { status: 403 }
      )
    }

    // Run content generation
    const agentResult = await generateContent({
      ...validatedRequest,
      userId: user.id,
    })

    if (!agentResult.success || !agentResult.data) {
      return NextResponse.json(
        { error: agentResult.error || 'Content generation failed' },
        { status: 500 }
      )
    }

    const { texts, images, videos } = agentResult.data

    // Save content items to database
    const contentItems = []

    for (let i = 0; i < texts.length; i++) {
      const text = texts[i]

      const { data: contentItem, error } = await supabaseAdmin
        .from('content_items')
        .insert({
          tenant_id: validatedRequest.tenantId,
          brand_profile_id: validatedRequest.brandProfileId || null,
          type: text.type,
          platform: text.platform,
          text_content: text.content,
          status: 'draft',
          created_by: user.id,
        })
        .select()
        .single()

      if (!error && contentItem) {
        contentItems.push(contentItem)

        // Link image if available
        if (images[i]) {
          await supabaseAdmin
            .from('images')
            .insert({
              tenant_id: validatedRequest.tenantId,
              content_item_id: contentItem.id,
              storage_path: `content/${contentItem.id}/image.jpg`,
              url: images[i].url,
              prompt: images[i].prompt,
              provider: 'dalle',
            })
        }
      }
    }

    // Log audit
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        tenant_id: validatedRequest.tenantId,
        user_id: user.id,
        action: 'generated',
        resource_type: 'content',
        metadata: {
          type: validatedRequest.type,
          platforms: validatedRequest.platforms,
          contentItemsCreated: contentItems.length,
        },
      })

    return NextResponse.json({
      success: true,
      data: {
        contentItems,
        images,
        videos,
      },
    })
  } catch (error) {
    console.error('Error in generate-content API:', error instanceof Error ? error.message : error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
