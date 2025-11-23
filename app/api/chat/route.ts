import { NextRequest, NextResponse } from 'next/server'
import { createClientSupabase, supabaseAdmin } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientSupabase()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId, message, history = [] } = body

    if (!tenantId || !message) {
      return NextResponse.json(
        { error: 'tenantId and message are required' },
        { status: 400 }
      )
    }

    // Verify tenant access
    const { data: tenantUser } = await supabaseAdmin
      .from('tenant_users')
      .select('tenant_id')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!tenantUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Build conversation history
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are an expert AI marketing assistant. You help users with:
- Creating compelling marketing copy, captions, and content
- Brainstorming content ideas for social media
- Improving existing marketing content
- Answering questions about marketing best practices
- Providing tips for engagement and growth

Be helpful, creative, and provide actionable advice. Keep responses concise but informative.
When creating content, make it engaging and platform-appropriate.
Use emojis sparingly and appropriately when creating social media content.`,
      },
      ...history.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const responseMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      success: true,
      message: responseMessage,
    })
  } catch (error) {
    console.error('Chat API error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
