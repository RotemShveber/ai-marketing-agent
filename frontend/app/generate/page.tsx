"use client"

import { useState } from "react"
import Link from "next/link"

export default function GeneratePage() {
  const [productName, setProductName] = useState("")
  const [topNotes, setTopNotes] = useState("")
  const [middleNotes, setMiddleNotes] = useState("")
  const [baseNotes, setBaseNotes] = useState("")
  const [platforms, setPlatforms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handlePlatformToggle = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform))
    } else {
      setPlatforms([...platforms, platform])
    }
  }

  const handleGenerate = async () => {
    if (!productName || !topNotes) {
      alert("Please fill in at least Product Name and Top Notes")
      return
    }

    setLoading(true)

    // Simulate API call
    setTimeout(() => {
      setResult({
        social_posts: [
          {
            platform: "instagram",
            text: `✨ Introducing ${productName} ✨\n\nA captivating blend of ${topNotes.split(',')[0]} that dances with ${middleNotes.split(',')[0] || 'exotic florals'}, settling into warm ${baseNotes.split(',')[0] || 'musk'}.\n\nExperience luxury in every spritz. 🌹\n\n#Perfume #Luxury #${productName.replace(/\s/g, '')} #BeautyEssentials #FragranceLovers`
          },
          {
            platform: "facebook",
            text: `Discover ${productName} - where elegance meets sophistication.\n\nOur master perfumers have crafted a unique scent journey:\n🌸 Opening with fresh ${topNotes}\n💐 Heart notes of ${middleNotes || 'jasmine and lily'}\n🌿 Base of rich ${baseNotes || 'sandalwood and vanilla'}\n\nPerfect for those who appreciate the finer things in life.\n\nShop now and transform your signature scent! →`
          }
        ],
        images: [
          "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400",
          "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400"
        ]
      })
      setLoading(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                AI
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Marketing Agent</h1>
                <p className="text-sm text-gray-600">E N Trade LTD</p>
              </div>
            </Link>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/chat" className="text-gray-600 hover:text-gray-900">Chat</Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Generate Marketing Content
          </h2>
          <p className="text-gray-600 mb-8">
            Tell us about your perfume and we'll create amazing marketing content for all platforms!
          </p>

          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., Rose Elegance"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Fragrance Notes */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Top Notes *
                  </label>
                  <input
                    type="text"
                    value={topNotes}
                    onChange={(e) => setTopNotes(e.target.value)}
                    placeholder="Rose, Bergamot"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Middle Notes
                  </label>
                  <input
                    type="text"
                    value={middleNotes}
                    onChange={(e) => setMiddleNotes(e.target.value)}
                    placeholder="Jasmine, Lily"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Notes
                  </label>
                  <input
                    type="text"
                    value={baseNotes}
                    onChange={(e) => setBaseNotes(e.target.value)}
                    placeholder="Sandalwood, Musk"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Platforms */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Select Platforms
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Instagram', 'Facebook', 'TikTok', 'YouTube'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => handlePlatformToggle(platform.toLowerCase())}
                      className={`px-4 py-3 rounded-lg border-2 font-medium transition-all ${
                        platforms.includes(platform.toLowerCase())
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? '🔄 Generating Content...' : '✨ Generate Content'}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6">Generated Content</h3>

              {/* Social Posts */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold mb-4">Social Media Posts</h4>
                <div className="space-y-4">
                  {result.social_posts.map((post: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-purple-600 uppercase">{post.platform}</span>
                        <button className="text-sm text-gray-600 hover:text-gray-900">Copy</button>
                      </div>
                      <p className="text-gray-700 whitespace-pre-line">{post.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Images */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Generated Images</h4>
                <div className="grid grid-cols-2 gap-4">
                  {result.images.map((img: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <img src={img} alt={`Generated ${idx + 1}`} className="w-full h-48 object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium">Download</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Demo Mode:</strong> This is showing sample content. Connect to the backend API to generate real AI content with GPT-4 and DALL-E!
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
