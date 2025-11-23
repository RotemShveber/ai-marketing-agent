'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { FolderOpen, Loader2, Edit2, Calendar, Trash2, Eye, Copy, Check } from 'lucide-react'

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  approved: 'bg-emerald-100 text-emerald-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-purple-100 text-purple-700',
}

const platformColors: Record<string, string> = {
  instagram: 'from-pink-500 to-purple-500',
  facebook: 'from-blue-500 to-blue-600',
  tiktok: 'from-slate-800 to-slate-900',
  linkedin: 'from-blue-600 to-blue-700',
  youtube: 'from-red-500 to-red-600',
  google_ads: 'from-green-500 to-yellow-500',
}

export default function ContentLibrary({ tenantId }: { tenantId: string }) {
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'draft' | 'approved' | 'scheduled'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchContent()
  }, [tenantId, filter])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tenantId })
      if (filter !== 'all') {
        params.append('status', filter)
      }

      const response = await fetch(`/api/content?${params}`)
      const data = await response.json()

      if (response.ok) {
        setContent(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Drafts' },
    { id: 'approved', label: 'Approved' },
    { id: 'scheduled', label: 'Scheduled' },
  ]

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-fit">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === f.id
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading content...</p>
        </div>
      ) : content.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Content Yet</h3>
          <p className="text-slate-500 text-sm mb-6">
            Generate some content to see it here
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
          >
            Refresh
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {content.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${
                    platformColors[item.platform] || 'from-slate-500 to-slate-600'
                  } text-white`}>
                    {item.platform}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    statusColors[item.status] || 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-slate-700 line-clamp-4 mb-4 leading-relaxed">
                  {item.text_content}
                </p>

                {/* Image preview */}
                {item.images && item.images.length > 0 && (
                  <div className="mb-4">
                    <img
                      src={item.images[0].url}
                      alt="Content"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => copyToClipboard(item.text_content, item.id)}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-green-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy
                  </button>
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
