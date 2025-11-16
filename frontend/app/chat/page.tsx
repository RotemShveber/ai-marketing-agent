"use client"

import { useState } from "react"
import Link from "next/link"

export default function ChatPage() {
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([
    { role: "assistant", content: "👋 Hi! I'm your AI Marketing Assistant. Tell me about your perfume and I'll help you create amazing marketing content!\n\nYou can say things like:\n- \"Create Instagram posts for my new perfume\"\n- \"Generate ad copy for Rose Elegance\"\n- \"Help me with marketing ideas\"" }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = () => {
    if (!input.trim()) return

    // Add user message
    const newMessages = [...messages, { role: "user", content: input }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input)
      setMessages([...newMessages, { role: "assistant", content: response }])
      setLoading(false)
    }, 1500)
  }

  const generateResponse = (userInput: string) => {
    const lower = userInput.toLowerCase()

    if (lower.includes("instagram") || lower.includes("post")) {
      return "I can help you create Instagram posts! 📸\n\nFor the best results, please tell me:\n1. What's the perfume name?\n2. What are the main fragrance notes?\n3. What's the target audience?\n\nOr you can use the Generate Content page for a guided experience!"
    }

    if (lower.includes("video")) {
      return "Great! I can help with video content! 🎬\n\nI can create:\n- Product showcase videos\n- Instagram Reels\n- TikTok videos\n- YouTube ads\n\nWhat type of video would you like to create?"
    }

    if (lower.includes("help") || lower.includes("how")) {
      return "I can help you with:\n\n✨ Content Generation - Social posts, ad copy, captions\n🎬 Video Creation - Product videos, reels, ads\n🌍 Multi-Language - Translate content to 7 languages\n📱 Platform Optimization - Instagram, Facebook, TikTok, YouTube\n🎨 Brand Consistency - Apply your brand style\n📊 Marketing Strategy - Tips and best practices\n\nWhat would you like to work on?"
    }

    return `I understand you're interested in: "${userInput}"\n\nI can definitely help with that! To give you the best results, could you provide more details? Or you can:\n\n1. Use the Generate Content page for a guided experience\n2. Tell me more about your perfume (name, notes, target audience)\n3. Specify which platforms you want to target\n\nWhat works best for you?`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex flex-col">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
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
              <Link href="/generate" className="text-gray-600 hover:text-gray-900">Generate</Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Chat Container */}
      <div className="flex-1 container mx-auto px-6 py-8 flex flex-col max-w-4xl">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Chat with AI Marketing Assistant
        </h2>

        {/* Messages */}
        <div className="flex-1 bg-white rounded-xl shadow-lg p-6 mb-4 overflow-y-auto space-y-4" style={{minHeight: '500px'}}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <p className="whitespace-pre-line">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-lg">
                <p className="text-gray-600">AI is typing...</p>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message... (e.g., 'Create Instagram posts for my perfume')"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Demo Mode:</strong> This chat uses pre-programmed responses. Connect to the backend for real AI conversations with GPT-4!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
