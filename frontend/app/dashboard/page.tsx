"use client"

import Link from "next/link"

export default function DashboardPage() {
  const stats = [
    { label: "Total Content Created", value: "156", icon: "✨", change: "+12% this month" },
    { label: "Social Posts", value: "89", icon: "📱", change: "+8 today" },
    { label: "Videos Generated", value: "23", icon: "🎬", change: "+3 this week" },
    { label: "Platforms", value: "5", icon: "🌐", change: "Active" },
  ]

  const recentContent = [
    { id: 1, product: "Rose Elegance", platform: "Instagram", date: "2 hours ago", status: "Published" },
    { id: 2, product: "Ocean Breeze", platform: "Facebook", date: "5 hours ago", status: "Scheduled" },
    { id: 3, product: "Midnight Musk", platform: "TikTok", date: "1 day ago", status: "Published" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
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
              <Link href="/generate" className="text-gray-600 hover:text-gray-900">Generate</Link>
              <Link href="/chat" className="text-gray-600 hover:text-gray-900">Chat</Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-gray-600">Welcome back! Here's your marketing overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3xl">{stat.icon}</span>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/generate"
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-6 hover:shadow-lg transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">✨</div>
            <h3 className="text-xl font-bold mb-2">Generate Content</h3>
            <p className="text-white/90">Create new marketing materials</p>
          </Link>

          <Link
            href="/chat"
            className="bg-white rounded-xl shadow-sm border-2 border-purple-600 p-6 hover:shadow-md transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">💬</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Chat with AI</h3>
            <p className="text-gray-600">Get instant marketing help</p>
          </Link>

          <Link
            href="/products"
            className="bg-white rounded-xl shadow-sm border-2 border-purple-600 p-6 hover:shadow-md transition-all hover:scale-105"
          >
            <div className="text-3xl mb-3">🧴</div>
            <h3 className="text-xl font-bold mb-2 text-gray-900">Manage Products</h3>
            <p className="text-gray-600">View and edit your products</p>
          </Link>
        </div>

        {/* Recent Content */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-2xl font-bold mb-6">Recent Content</h3>
          <div className="space-y-4">
            {recentContent.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.product}</h4>
                  <p className="text-sm text-gray-600">{item.platform} • {item.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    item.status === 'Published'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.status}
                  </span>
                  <button className="text-gray-600 hover:text-gray-900">View →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Demo Mode:</strong> This dashboard shows sample data. Connect to the backend to see your real content and analytics!
          </p>
        </div>
      </main>
    </div>
  )
}
