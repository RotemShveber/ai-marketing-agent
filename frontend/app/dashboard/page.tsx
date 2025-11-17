"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getUser, logout, User } from "@/lib/auth"
import { getAllCustomers, getCurrentCustomer, type CustomerConfig } from "@/lib/config"

export default function DashboardPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [currentCustomer, setCurrentCustomer] = useState<CustomerConfig | null>(null)
  const [customers, setCustomers] = useState<CustomerConfig[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)

  useEffect(() => {
    const user = getUser()
    if (!user) {
      router.push('/login?redirect=/dashboard')
      return
    }
    setCurrentUser(user)

    const allCustomers = getAllCustomers()
    setCustomers(allCustomers)
    setCurrentCustomer(getCurrentCustomer())
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const stats = [
    { label: "Total Content Created", value: "156", icon: "✨", change: "+12% this month", color: "from-purple-500 to-pink-500" },
    { label: "Social Posts", value: "89", icon: "📱", change: "+8 today", color: "from-blue-500 to-cyan-500" },
    { label: "Videos Generated", value: "23", icon: "🎬", change: "+3 this week", color: "from-green-500 to-emerald-500" },
    { label: "Active Platforms", value: "5", icon: "🌐", change: "All Connected", color: "from-orange-500 to-red-500" },
  ]

  const quickActions = [
    { title: "Generate Content", desc: "Create AI-powered content", icon: "✨", href: "/generate", color: "purple" },
    { title: "Manage Users", desc: "Add & manage team members", icon: "👥", href: "/users", color: "blue" },
    { title: "Platform Settings", desc: "Configure APIs & integrations", icon: "🔗", href: "/settings", color: "green" },
    { title: "View Products", desc: "Manage your product catalog", icon: "📦", href: "/products", color: "pink" },
  ]

  const recentActivity = [
    { action: "Content Generated", item: "Rose Elegance - Instagram Post", time: "2 hours ago", user: "Admin" },
    { action: "User Added", item: "john@entrade.com invited", time: "5 hours ago", user: "Admin" },
    { action: "Platform Connected", item: "TikTok API configured", time: "1 day ago", user: "Admin" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold shadow-lg">
                AI
              </div>
              <div>
                <h1 className="text-xl font-bold">AstralAI</h1>
                <p className="text-xs text-gray-500">{currentCustomer?.brandName || 'Multi-Platform Marketing'}</p>
              </div>
            </Link>

            <nav className="hidden md:flex gap-2">
              <Link href="/dashboard" className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg">
                Dashboard
              </Link>
              <Link href="/generate" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Generate
              </Link>
              <Link href="/chat" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Chat
              </Link>
              <Link href="/products" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Products
              </Link>
              {currentUser?.is_super_admin && (
                <Link href="/admin" className="px-4 py-2 text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-medium shadow-md hover:shadow-lg transition-all">
                  ⚡ Admin
                </Link>
              )}
            </nav>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold">{currentUser?.full_name}</p>
                  <p className="text-xs text-gray-500">{currentUser?.is_super_admin ? 'Super Admin' : 'User'}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                  {currentUser?.full_name?.charAt(0) || 'A'}
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border py-2 z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold">{currentUser?.full_name}</p>
                    <p className="text-xs text-gray-500">{currentUser?.email}</p>
                  </div>
                  {currentUser?.is_super_admin && (
                    <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                      ⚡ Admin Dashboard
                    </Link>
                  )}
                  <Link href="/users" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    👥 Manage Users
                  </Link>
                  <Link href="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    ⚙️ Settings
                  </Link>
                  <div className="border-t mt-2"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome back, {currentUser?.full_name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">Here's what's happening with your marketing automation</p>
        </div>

        {/* Admin Quick Access */}
        {currentUser?.is_super_admin && (
          <div className="mb-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold mb-2">⚡ Admin Access</h3>
                <p className="text-purple-100 mb-4">
                  Manage all customers, users, and system settings from your admin dashboard
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/admin"
                    className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all inline-block"
                  >
                    Open Admin Dashboard
                  </Link>
                  <Link
                    href="/users"
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-all inline-block"
                  >
                    Manage Users
                  </Link>
                </div>
              </div>
              <div className="hidden lg:block text-8xl">
                🎯
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-2xl shadow-md`}>
                  {stat.icon}
                </div>
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <Link
                key={idx}
                href={action.href}
                className={`bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all hover:scale-105 border-2 border-transparent hover:border-${action.color}-200`}
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <h4 className="font-bold text-lg mb-1">{action.title}</h4>
                <p className="text-sm text-gray-600">{action.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {activity.user.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.item}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Info */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Current Customer</h3>
              {currentCustomer ? (
                <div>
                  <div
                    className="h-16 w-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl mb-4 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${currentCustomer.primaryColor}, ${currentCustomer.secondaryColor})` }}
                  >
                    {currentCustomer.brandName.charAt(0)}
                  </div>
                  <h4 className="font-bold text-lg">{currentCustomer.brandName}</h4>
                  <p className="text-sm text-gray-600 mb-4">{currentCustomer.companyName}</p>
                  <Link
                    href="/settings"
                    className="block text-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                  >
                    Manage Settings
                  </Link>
                </div>
              ) : (
                <p className="text-gray-500">No customer selected</p>
              )}
            </div>

            {/* Platform Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Platform Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Facebook</span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Setup Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Instagram</span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Setup Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">TikTok</span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Setup Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">YouTube</span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Setup Required</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Google Ads</span>
                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">Setup Required</span>
                </div>
              </div>
              <Link
                href="/settings"
                className="block text-center mt-4 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors font-medium"
              >
                Configure Platforms →
              </Link>
            </div>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
          <h3 className="text-xl font-bold mb-4">🚀 Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">1️⃣</div>
              <h4 className="font-semibold mb-1">Add Team Members</h4>
              <p className="text-sm text-gray-600 mb-2">Invite users and assign roles</p>
              <Link href="/users" className="text-sm text-purple-600 hover:underline">Go to Users →</Link>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">2️⃣</div>
              <h4 className="font-semibold mb-1">Connect Platforms</h4>
              <p className="text-sm text-gray-600 mb-2">Set up API keys for social platforms</p>
              <Link href="/settings" className="text-sm text-purple-600 hover:underline">Go to Settings →</Link>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl mb-2">3️⃣</div>
              <h4 className="font-semibold mb-1">Generate Content</h4>
              <p className="text-sm text-gray-600 mb-2">Create AI-powered marketing content</p>
              <Link href="/generate" className="text-sm text-purple-600 hover:underline">Start Generating →</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
