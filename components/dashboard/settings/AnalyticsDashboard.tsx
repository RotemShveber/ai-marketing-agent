'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Eye, Heart, MessageCircle, Share2, MousePointerClick, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface AnalyticsDashboardProps {
  tenantId: string
}

interface AnalyticsData {
  totals: {
    views: number
    likes: number
    comments: number
    shares: number
    clicks: number
    impressions: number
    reach: number
  }
  averages: {
    engagement_rate: number
    click_through_rate: number
  }
  by_platform: Array<{
    platform: string
    views: number
    likes: number
    comments: number
    shares: number
    clicks: number
    impressions: number
    posts_count: number
  }>
}

interface TopPost {
  id: string
  platform: string
  date: string
  metrics: {
    views: number
    likes: number
    comments: number
    shares: number
    clicks: number
    impressions: number
    engagement_rate: number
    click_through_rate: number
  }
  content: {
    type: string
    text_content: string
    platform: string
  } | null
}

export function AnalyticsDashboard({ tenantId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [topPosts, setTopPosts] = useState<TopPost[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')

  useEffect(() => {
    fetchAnalytics()
    fetchTopPosts()
  }, [tenantId, dateRange, selectedPlatform])

  const fetchAnalytics = async () => {
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date()

      if (dateRange === '7d') {
        startDate.setDate(startDate.getDate() - 7)
      } else if (dateRange === '30d') {
        startDate.setDate(startDate.getDate() - 30)
      } else {
        startDate.setDate(startDate.getDate() - 90)
      }

      const params = new URLSearchParams({
        tenantId,
        startDate: startDate.toISOString().split('T')[0],
        endDate
      })

      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }

      const response = await fetch(`/api/settings/analytics?${params}`)
      const data = await response.json()

      if (data) {
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTopPosts = async () => {
    try {
      const params = new URLSearchParams({
        tenantId,
        limit: '5',
        metric: 'engagement_rate'
      })

      if (selectedPlatform !== 'all') {
        params.append('platform', selectedPlatform)
      }

      const response = await fetch(`/api/settings/analytics/top-posts?${params}`)
      const data = await response.json()

      if (data.top_posts) {
        setTopPosts(data.top_posts)
      }
    } catch (error) {
      console.error('Error fetching top posts:', error)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      instagram: 'from-pink-500 to-purple-500',
      facebook: 'from-blue-600 to-blue-400',
      tiktok: 'from-black to-cyan-500',
      linkedin: 'from-blue-700 to-blue-500',
      youtube: 'from-red-600 to-red-400',
      google_ads: 'from-green-500 to-yellow-500'
    }
    return colors[platform] || 'from-gray-500 to-gray-400'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!analytics || !analytics.totals) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Analytics Data Yet
        </h3>
        <p className="text-gray-600">
          Start publishing content to see your performance metrics. Make sure you've run the database migrations to enable analytics tracking.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Analytics Overview</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track your content performance across platforms
          </p>
        </div>

        <div className="flex gap-3">
          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          {/* Platform Filter */}
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Platforms</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="linkedin">LinkedIn</option>
            <option value="youtube">YouTube</option>
            <option value="google_ads">Google Ads</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Views</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(analytics.totals.views)}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatNumber(analytics.totals.likes)}
              </p>
            </div>
            <div className="h-12 w-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.averages.engagement_rate.toFixed(2)}%
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Click Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {analytics.averages.click_through_rate.toFixed(2)}%
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MousePointerClick className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance by Platform
          </h3>
          <div className="space-y-4">
            {analytics.by_platform.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No platform data available</p>
            ) : (
              analytics.by_platform.map((platform) => (
                <div key={platform.platform} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${getPlatformColor(platform.platform)}`}></div>
                      <span className="font-medium text-gray-900 capitalize">
                        {platform.platform}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {platform.posts_count} posts
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-gray-500">Views</p>
                      <p className="font-semibold text-gray-900">{formatNumber(platform.views)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Likes</p>
                      <p className="font-semibold text-gray-900">{formatNumber(platform.likes)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Comments</p>
                      <p className="font-semibold text-gray-900">{formatNumber(platform.comments)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Shares</p>
                      <p className="font-semibold text-gray-900">{formatNumber(platform.shares)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Engagement Breakdown */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Total Engagement
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-gray-900">Comments</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatNumber(analytics.totals.comments)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Share2 className="h-5 w-5 text-green-600" />
                <span className="font-medium text-gray-900">Shares</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatNumber(analytics.totals.shares)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MousePointerClick className="h-5 w-5 text-purple-600" />
                <span className="font-medium text-gray-900">Clicks</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatNumber(analytics.totals.clicks)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-indigo-600" />
                <span className="font-medium text-gray-900">Impressions</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatNumber(analytics.totals.impressions)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Performing Posts */}
      {topPosts.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Posts
          </h3>
          <div className="space-y-4">
            {topPosts.map((post, index) => (
              <div key={post.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getPlatformColor(post.platform)} text-white capitalize`}>
                        {post.platform}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(post.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {post.metrics.engagement_rate.toFixed(2)}% engagement
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatNumber(post.metrics.impressions)} impressions
                    </p>
                  </div>
                </div>

                {post.content && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                    {post.content.text_content}
                  </p>
                )}

                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-gray-500">Likes</p>
                    <p className="font-semibold text-gray-900">{formatNumber(post.metrics.likes)}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-gray-500">Comments</p>
                    <p className="font-semibold text-gray-900">{formatNumber(post.metrics.comments)}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-gray-500">Shares</p>
                    <p className="font-semibold text-gray-900">{formatNumber(post.metrics.shares)}</p>
                  </div>
                  <div className="text-center p-2 bg-white rounded">
                    <p className="text-gray-500">Clicks</p>
                    <p className="font-semibold text-gray-900">{formatNumber(post.metrics.clicks)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
