import { z } from 'zod'
import { toolGenerateText, toolGenerateImage, toolGenerateVideo } from './tools'

// Product details schema
const productDetailsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  price: z.string().optional(),
  targetAudience: z.string().optional(),
  keyFeatures: z.array(z.string()).optional(),
  callToAction: z.string().optional(),
  tone: z.string().optional(),
  hasProductImages: z.boolean().optional(),
})

// Content generation request schema (from client)
export const contentGenerationSchema = z.object({
  tenantId: z.string(),
  brandProfileId: z.string().optional(),
  type: z.enum(['post', 'description', 'ad_copy', 'caption', 'hook', 'cta']),
  platforms: z.array(z.enum(['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'google_ads'])).min(1),
  topic: z.string().min(1),
  generateImages: z.boolean().optional(),
  generateVideos: z.boolean().optional(),
  productDetails: productDetailsSchema.optional(),
})

// Full request schema (with userId added by server)
export const contentGenerationRequestSchema = contentGenerationSchema.extend({
  userId: z.string(),
})

export type ContentGenerationRequest = z.infer<typeof contentGenerationRequestSchema>

interface GeneratedContent {
  texts: Array<{ type: string; platform: string; content: string }>
  images: Array<{ url: string; prompt: string }>
  videos: Array<{ videoId: string; prompt: string }>
}

/**
 * Main function to generate content
 */
export async function generateContent(request: ContentGenerationRequest): Promise<{
  success: boolean
  data?: GeneratedContent
  error?: string
}> {
  try {
    const texts: GeneratedContent['texts'] = []
    const images: GeneratedContent['images'] = []
    const videos: GeneratedContent['videos'] = []

    // Step 1: Generate text content for each platform
    console.log(`Generating text content for platforms: ${request.platforms.join(', ')}`)

    for (const platform of request.platforms) {
      const result = await toolGenerateText({
        type: request.type,
        platform: platform,
        topic: request.topic,
      })

      if (result.success && result.content) {
        texts.push({
          type: request.type,
          platform,
          content: result.content,
        })
        console.log(`Generated text for ${platform}`)
      } else {
        console.error(`Failed to generate text for ${platform}:`, result.error)
      }
    }

    if (texts.length === 0) {
      return {
        success: false,
        error: 'Failed to generate any text content',
      }
    }

    // Step 2: Generate images if requested
    if (request.generateImages) {
      console.log('Generating images...')

      for (const text of texts) {
        const imagePrompt = `Create a professional marketing image for ${text.platform} that visually represents: ${request.topic}. Style should be modern and engaging.`

        const result = await toolGenerateImage({
          prompt: imagePrompt,
          size: text.platform === 'instagram' ? '1024x1024' : '1792x1024',
        })

        if (result.success && result.url) {
          images.push({
            url: result.url,
            prompt: result.revisedPrompt || imagePrompt,
          })
          console.log(`Generated image for ${text.platform}`)
        } else {
          console.error(`Failed to generate image for ${text.platform}:`, result.error)
        }
      }
    }

    // Step 3: Generate videos if requested (only for TikTok/Instagram)
    if (request.generateVideos) {
      console.log('Generating videos...')

      const videoPlatforms = texts.filter(
        (t) => t.platform === 'tiktok' || t.platform === 'instagram'
      )

      for (const text of videoPlatforms.slice(0, 2)) {
        const videoPrompt = `Create a short, engaging vertical video for ${text.platform} about: ${request.topic}`

        const result = await toolGenerateVideo({
          prompt: videoPrompt,
          aspectRatio: '9:16',
          duration: 5,
        })

        if (result.success && result.videoId) {
          videos.push({
            videoId: result.videoId,
            prompt: videoPrompt,
          })
          console.log(`Generated video for ${text.platform}`)
        } else {
          console.error(`Failed to generate video for ${text.platform}:`, result.error)
        }
      }
    }

    return {
      success: true,
      data: {
        texts,
        images,
        videos,
      },
    }
  } catch (error) {
    console.error('Content generation error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
