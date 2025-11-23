export const AI_CONFIG = {
  openai: {
    model: 'gpt-4-turbo-preview',
    imageModel: 'dall-e-3',
    embeddingModel: 'text-embedding-3-large',
  },
  pika: {
    apiUrl: 'https://api.pika.art/v1',
  },
} as const

