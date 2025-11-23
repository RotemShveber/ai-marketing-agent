'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sparkles, Image, Video, Loader2, Check, Copy, Download,
  Upload, X, Plus, DollarSign, Tag, FileText, Target
} from 'lucide-react'

const platforms = [
  { id: 'instagram', label: 'Instagram', color: 'from-pink-500 to-purple-500' },
  { id: 'facebook', label: 'Facebook', color: 'from-blue-500 to-blue-600' },
  { id: 'tiktok', label: 'TikTok', color: 'from-slate-800 to-slate-900' },
  { id: 'linkedin', label: 'LinkedIn', color: 'from-blue-600 to-blue-700' },
  { id: 'youtube', label: 'YouTube', color: 'from-red-500 to-red-600' },
  { id: 'google_ads', label: 'Google Ads', color: 'from-green-500 to-yellow-500' },
]

const contentTypes = [
  { id: 'post', label: 'Social Post' },
  { id: 'caption', label: 'Caption' },
  { id: 'ad_copy', label: 'Ad Copy' },
  { id: 'hook', label: 'Hook' },
  { id: 'cta', label: 'Call to Action' },
  { id: 'description', label: 'Description' },
]

const toneOptions = [
  { id: 'professional', label: 'Professional' },
  { id: 'casual', label: 'Casual' },
  { id: 'fun', label: 'Fun & Playful' },
  { id: 'luxury', label: 'Luxury' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'friendly', label: 'Friendly' },
]

interface ProductImage {
  file: File
  preview: string
}

export default function ContentGenerator({ tenantId }: { tenantId: string }) {
  // Basic info
  const [productName, setProductName] = useState('')
  const [productDescription, setProductDescription] = useState('')

  // Product details
  const [price, setPrice] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [keyFeatures, setKeyFeatures] = useState<string[]>([''])
  const [callToAction, setCallToAction] = useState('')

  // Images
  const [productImages, setProductImages] = useState<ProductImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Content settings
  const [contentType, setContentType] = useState('post')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [tone, setTone] = useState('professional')
  const [generateImages, setGenerateImages] = useState(false)
  const [generateVideos, setGenerateVideos] = useState(false)

  // UI state
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<'product' | 'content'>('product')

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newImages: ProductImage[] = []
    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
        })
      }
    })

    setProductImages((prev) => [...prev, ...newImages].slice(0, 5)) // Max 5 images
  }

  const removeImage = (index: number) => {
    setProductImages((prev) => {
      const updated = [...prev]
      URL.revokeObjectURL(updated[index].preview)
      updated.splice(index, 1)
      return updated
    })
  }

  const addFeature = () => {
    if (keyFeatures.length < 5) {
      setKeyFeatures([...keyFeatures, ''])
    }
  }

  const updateFeature = (index: number, value: string) => {
    const updated = [...keyFeatures]
    updated[index] = value
    setKeyFeatures(updated)
  }

  const removeFeature = (index: number) => {
    if (keyFeatures.length > 1) {
      setKeyFeatures(keyFeatures.filter((_, i) => i !== index))
    }
  }

  const handleGenerate = async () => {
    if (!productName || selectedPlatforms.length === 0) {
      setError('Please enter a product name and select at least one platform')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // Build comprehensive topic/prompt from all product data
      const productContext = `
Product: ${productName}
${productDescription ? `Description: ${productDescription}` : ''}
${price ? `Price: ${price}` : ''}
${targetAudience ? `Target Audience: ${targetAudience}` : ''}
${keyFeatures.filter(f => f.trim()).length > 0 ? `Key Features: ${keyFeatures.filter(f => f.trim()).join(', ')}` : ''}
${callToAction ? `Call to Action: ${callToAction}` : ''}
Tone: ${tone}
      `.trim()

      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          type: contentType,
          platforms: selectedPlatforms,
          topic: productContext,
          generateImages,
          generateVideos,
          // Additional context
          productDetails: {
            name: productName,
            description: productDescription,
            price,
            targetAudience,
            keyFeatures: keyFeatures.filter(f => f.trim()),
            callToAction,
            tone,
            hasProductImages: productImages.length > 0,
          }
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate content')
      }

      setResult(data.data)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <div className="space-y-4">
        {/* Section Tabs */}
        <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setActiveSection('product')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'product'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Product Details
          </button>
          <button
            onClick={() => setActiveSection('content')}
            className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'content'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Content Settings
          </button>
        </div>

        {/* Product Details Section */}
        {activeSection === 'product' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            {/* Product Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Tag className="w-4 h-4 text-indigo-500" />
                Product / Service Name *
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Premium Wireless Headphones"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Product Description */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Product Description
              </label>
              <textarea
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder="Describe your product in detail. What makes it special? What problem does it solve?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
              />
            </div>

            {/* Product Images */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Image className="w-4 h-4 text-indigo-500" />
                Product Images
              </label>
              <div className="grid grid-cols-5 gap-2">
                {productImages.map((img, i) => (
                  <div key={i} className="relative aspect-square group">
                    <img
                      src={img.preview}
                      alt={`Product ${i + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {productImages.length < 5 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex flex-col items-center justify-center gap-1"
                  >
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-400">Upload</span>
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-400 mt-2">Upload up to 5 product images (optional)</p>
            </div>

            {/* Price & Target Audience */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <DollarSign className="w-4 h-4 text-indigo-500" />
                  Price
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="$99.99"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Target className="w-4 h-4 text-indigo-500" />
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Young professionals"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Key Features */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Key Features / Benefits
              </label>
              <div className="space-y-2">
                {keyFeatures.map((feature, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(i, e.target.value)}
                      placeholder={`Feature ${i + 1}`}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                    {keyFeatures.length > 1 && (
                      <button
                        onClick={() => removeFeature(i)}
                        className="p-2.5 rounded-xl border border-slate-200 hover:bg-red-50 hover:border-red-200 transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>
                ))}
                {keyFeatures.length < 5 && (
                  <button
                    onClick={addFeature}
                    className="flex items-center gap-2 text-sm text-indigo-500 hover:text-indigo-600"
                  >
                    <Plus className="w-4 h-4" />
                    Add Feature
                  </button>
                )}
              </div>
            </div>

            {/* Call to Action */}
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Preferred Call to Action
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value)}
                placeholder="e.g., Shop Now, Learn More, Get 20% Off"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              onClick={() => setActiveSection('content')}
              className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
            >
              Next: Content Settings →
            </button>
          </div>
        )}

        {/* Content Settings Section */}
        {activeSection === 'content' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            {/* Tone */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tone / Voice
              </label>
              <div className="grid grid-cols-3 gap-2">
                {toneOptions.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      tone === t.id
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Content Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      contentType === type.id
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Platforms *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? `bg-gradient-to-r ${platform.color} text-white shadow-lg`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {platform.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  generateImages ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'
                }`}>
                  {generateImages && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={generateImages}
                  onChange={(e) => setGenerateImages(e.target.checked)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Generate AI Images (DALL-E 3)</span>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                  generateVideos ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 group-hover:border-indigo-400'
                }`}>
                  {generateVideos && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={generateVideos}
                  onChange={(e) => setGenerateVideos(e.target.checked)}
                  className="sr-only"
                />
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-600">Generate Videos (TikTok/Instagram)</span>
                </div>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="text-red-600 text-sm p-4 bg-red-50 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveSection('product')}
                className="px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <Button
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Generate Content
                  </span>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-4">
        {!result && !loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Ready to Create</h3>
            <p className="text-slate-500 text-sm">
              Fill in your product details and click generate to create AI-powered marketing content
            </p>
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Creating Your Content</h3>
            <p className="text-slate-500 text-sm">
              Analyzing your product and generating tailored content...
            </p>
          </div>
        )}

        {result?.contentItems?.map((item: any) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                  platforms.find(p => p.id === item.platform)?.color || 'from-slate-500 to-slate-600'
                } text-white`}>
                  {item.platform}
                </span>
                <span className="text-xs text-slate-500">{item.type}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(item.text_content, item.id)}
                  className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Copy to clipboard"
                >
                  {copiedId === item.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {item.text_content}
              </p>
            </div>
          </div>
        ))}

        {result?.images?.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h4 className="font-semibold text-slate-700 mb-4">Generated Images</h4>
            <div className="grid grid-cols-2 gap-4">
              {result.images.map((img: any, i: number) => (
                <div key={i} className="relative group">
                  <img
                    src={img.url}
                    alt="Generated"
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <a
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-lg"
                    >
                      <Download className="w-5 h-5 text-slate-700" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
