import OpenAI from 'openai'
import axios from 'axios'
import { z } from 'zod'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Tool schemas
export const generateTextSchema = z.object({
  type: z.enum(['post', 'description', 'ad_copy', 'caption', 'hook', 'cta']),
  platform: z.enum(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads']),
  topic: z.string(),
  brandProfile: z.object({
    tone: z.string().optional(),
    industry: z.string().optional(),
    targetAudience: z.string().optional(),
    brandGuidelines: z.string().optional(),
  }).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
})

export const generateImageSchema = z.object({
  prompt: z.string(),
  size: z.enum(['1024x1024', '1792x1024', '1024x1792']).optional(),
  quality: z.enum(['standard', 'hd']).optional(),
  style: z.enum(['vivid', 'natural']).optional(),
  brandColors: z.record(z.string()).optional(),
})

export const generateVideoSchema = z.object({
  prompt: z.string(),
  aspectRatio: z.enum(['16:9', '9:16', '1:1']).optional(),
  duration: z.number().optional(),
})

export const analyzeBrandSchema = z.object({
  brandName: z.string(),
  industry: z.string(),
  existingContent: z.array(z.string()).optional(),
  brandGuidelines: z.string().optional(),
})

/**
 * Generate text content using OpenAI GPT
 */
export async function toolGenerateText(params: z.infer<typeof generateTextSchema>) {
  const { type, platform, topic, brandProfile, length } = params

  // Build the prompt based on brand profile
  const toneInstruction = brandProfile?.tone 
    ? `Use a ${brandProfile.tone} tone.`
    : 'Use a professional and engaging tone.'
  
  const industryContext = brandProfile?.industry
    ? `Industry: ${brandProfile.industry}.`
    : ''
  
  const audienceContext = brandProfile?.targetAudience
    ? `Target audience: ${brandProfile.targetAudience}.`
    : ''

  const lengthInstruction = length === 'short' 
    ? 'Keep it concise (1-2 sentences).'
    : length === 'long'
    ? 'Write a detailed piece (3-5 paragraphs).'
    : 'Write a medium-length piece (2-3 paragraphs).'

  const platformSpecific: Record<string, string> = {
    instagram: 'Write in an engaging, visual-first style perfect for Instagram. Include emojis where appropriate.',
    facebook: 'Write in a conversational, community-focused style for Facebook.',
    tiktok: 'Write with high energy, trending hooks, and attention-grabbing style for TikTok.',
    linkedin: 'Write in a professional, thought-leadership style for LinkedIn.',
    youtube: 'Write for YouTube - create compelling video titles, descriptions with timestamps, and SEO-optimized content. Include relevant keywords and a strong call-to-action for subscribers.',
    google_ads: 'Write for Google Ads - create concise, high-converting ad copy. Include compelling headlines (max 30 characters each), descriptions (max 90 characters each), and strong CTAs. Focus on keywords and user intent.',
  }

  const typeSpecific = {
    post: 'Create a social media post',
    description: 'Create a product description',
    ad_copy: 'Create compelling ad copy',
    caption: 'Create a caption',
    hook: 'Create an attention-grabbing hook',
    cta: 'Create a call-to-action',
  }

  const prompt = `${typeSpecific[type]} for ${platform} about: ${topic}

${toneInstruction} ${industryContext} ${audienceContext} ${lengthInstruction}

${platformSpecific[platform]}

${brandProfile?.brandGuidelines ? `Brand Guidelines: ${brandProfile.brandGuidelines}` : ''}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert marketing copywriter who creates engaging, brand-consistent content for social media platforms.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: length === 'long' ? 1000 : length === 'short' ? 150 : 500,
    })

    return {
      success: true,
      content: completion.choices[0]?.message?.content || '',
    }
  } catch (error) {
    console.error('Error generating text:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate image using OpenAI DALL·E
 */
export async function toolGenerateImage(params: z.infer<typeof generateImageSchema>) {
  const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid', brandColors } = params

  // Enhance prompt with brand colors if provided
  let enhancedPrompt = prompt
  if (brandColors) {
    const colorDescription = Object.entries(brandColors)
      .map(([key, value]) => `Use ${key} color: ${value}`)
      .join('. ')
    enhancedPrompt = `${prompt}. Brand colors: ${colorDescription}`
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      size: size as '1024x1024' | '1792x1024' | '1024x1792',
      quality: quality as 'standard' | 'hd',
      style: style as 'vivid' | 'natural',
      n: 1,
    })

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new Error('No image URL returned from OpenAI')
    }

    return {
      success: true,
      url: imageUrl,
      revisedPrompt: response.data[0]?.revised_prompt,
    }
  } catch (error) {
    console.error('Error generating image:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate video using Pika Labs API
 */
export async function toolGenerateVideo(params: z.infer<typeof generateVideoSchema>) {
  const { prompt, aspectRatio = '9:16', duration = 5 } = params

  try {
    const response = await axios.post(
      'https://api.pika.art/v1/generate',
      {
        prompt,
        aspect_ratio: aspectRatio,
        duration,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.PIKA_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return {
      success: true,
      videoId: response.data.id,
      status: response.data.status,
      webhookUrl: response.data.webhook_url,
    }
  } catch (error) {
    console.error('Error generating video:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Analyze brand and extract tone, style, and preferences
 */
export async function toolAnalyzeBrand(params: z.infer<typeof analyzeBrandSchema>) {
  const { brandName, industry, existingContent, brandGuidelines } = params

  const contentSamples = existingContent?.join('\n\n---\n\n') || ''
  
  const prompt = `Analyze the brand "${brandName}" in the ${industry} industry.

${brandGuidelines ? `Brand Guidelines:\n${brandGuidelines}\n\n` : ''}

${contentSamples ? `Existing Content Samples:\n${contentSamples}\n\n` : ''}

Based on the above information, provide a JSON analysis with:
1. tone: The brand's voice/tone (e.g., "professional", "casual", "luxury", "fun")
2. style: Writing style characteristics
3. targetAudience: Primary target audience description
4. keyMessages: Main brand messages to emphasize
5. contentGuidelines: Specific guidelines for content creation

Return ONLY valid JSON, no additional text.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a brand strategist. Analyze brands and return structured JSON data.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}')

    return {
      success: true,
      analysis: {
        tone: analysis.tone || 'professional',
        style: analysis.style || '',
        targetAudience: analysis.targetAudience || '',
        keyMessages: analysis.keyMessages || [],
        contentGuidelines: analysis.contentGuidelines || '',
      },
    }
  } catch (error) {
    console.error('Error analyzing brand:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Generate embeddings for text content
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-large',
      input: text,
    })

    return response.data[0]?.embedding || null
  } catch (error) {
    console.error('Error generating embedding:', error)
    return null
  }
}

