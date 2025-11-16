"use client"

import { useState } from "react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                AI
              </div>
              <div>
                <h1 className="text-xl font-bold">AI Marketing Agent</h1>
                <p className="text-sm text-gray-600">E N Trade LTD</p>
              </div>
            </div>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/chat" className="text-gray-600 hover:text-gray-900">
                Chat
              </Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">
                Products
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Transform Your Perfume Marketing with AI
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            From product image to professional marketing content across all platforms—in seconds.
          </p>

          <div className="flex gap-4 justify-center mb-16">
            <Link
              href="/generate"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Generate Content
            </Link>
            <Link
              href="/chat"
              className="px-8 py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all"
            >
              Chat with AI
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <FeatureCard
              icon="✨"
              title="AI Content Generation"
              description="Create captivating social media posts, ad copy, and captions automatically"
            />
            <FeatureCard
              icon="🎬"
              title="Video Creation"
              description="Generate professional product videos with multiple styles and effects"
            />
            <FeatureCard
              icon="🌍"
              title="Multi-Language"
              description="Reach global audiences with automatic translation in 7+ languages"
            />
            <FeatureCard
              icon="📱"
              title="All Platforms"
              description="Optimized content for Instagram, Facebook, TikTok, YouTube, and Google Ads"
            />
            <FeatureCard
              icon="🎨"
              title="Brand Consistency"
              description="Maintain your brand identity with custom logos, colors, and style"
            />
            <FeatureCard
              icon="📊"
              title="Analytics"
              description="Track performance and optimize your marketing strategy"
            />
          </div>

          {/* How it Works */}
          <div className="mt-24">
            <h3 className="text-3xl font-bold mb-12">How It Works</h3>
            <div className="grid md:grid-cols-4 gap-6">
              <Step number={1} title="Upload Product" description="Add your perfume image, name, and fragrance notes" />
              <Step number={2} title="AI Generates" description="Our AI creates posts, videos, and ads automatically" />
              <Step number={3} title="Review & Edit" description="Preview and customize the generated content" />
              <Step number={4} title="Publish" description="Post directly to social media or schedule" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24 py-8 bg-white/50">
        <div className="container mx-auto px-6 text-center text-gray-600">
          <p>&copy; 2024 E N Trade LTD. All rights reserved.</p>
          <p className="text-sm mt-2">Powered by AI Marketing Agent</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white flex items-center justify-center font-bold text-xl mx-auto mb-4">
        {number}
      </div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  )
}
