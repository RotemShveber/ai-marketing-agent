'use client'

import { useState, useEffect } from 'react'
import { Settings, Plus, Edit2, Trash2, Save, X, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface PlatformCredentialsManagerProps {
  tenantId: string
}

interface Credential {
  id: string
  platform: string
  client_id: string
  scopes: string[] | null
  redirect_uri: string | null
  is_active: boolean
  last_tested_at: string | null
  test_status: string | null
  created_at: string
}

interface Platform {
  id: string
  name: string
  icon: string
  description: string
  color: string
  defaultScopes: string[]
  setupInstructions: string
}

const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Also enables Instagram integration',
    color: 'from-blue-600 to-blue-400',
    defaultScopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    setupInstructions: 'Create an app at developers.facebook.com'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Uses Facebook OAuth credentials',
    color: 'from-pink-500 to-purple-500',
    defaultScopes: ['instagram_basic', 'instagram_content_publish'],
    setupInstructions: 'Same as Facebook - create an app at developers.facebook.com'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    description: 'TikTok for Business',
    color: 'from-black to-cyan-500',
    defaultScopes: ['user.info.basic', 'video.list', 'video.upload'],
    setupInstructions: 'Create an app at developers.tiktok.com'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'LinkedIn Marketing Solutions',
    color: 'from-blue-700 to-blue-500',
    defaultScopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    setupInstructions: 'Create an app at developer.linkedin.com'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '🎥',
    description: 'Google Cloud OAuth',
    color: 'from-red-600 to-red-400',
    defaultScopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    setupInstructions: 'Create credentials in Google Cloud Console'
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    icon: '🎯',
    description: 'Google Ads API',
    color: 'from-green-500 to-yellow-500',
    defaultScopes: ['https://www.googleapis.com/auth/adwords'],
    setupInstructions: 'Create credentials in Google Cloud Console'
  }
]

export function PlatformCredentialsManager({ tenantId }: PlatformCredentialsManagerProps) {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null)
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    scopes: '',
    redirectUri: ''
  })

  useEffect(() => {
    fetchCredentials()
  }, [tenantId])

  const fetchCredentials = async () => {
    try {
      const response = await fetch(`/api/settings/platforms/credentials?tenantId=${tenantId}`)
      const data = await response.json()
      if (data.credentials) {
        setCredentials(data.credentials)
      }
    } catch (error) {
      console.error('Error fetching credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const hasCredentials = (platformId: string) => {
    return credentials.some(c => c.platform === platformId)
  }

  const getCredential = (platformId: string) => {
    return credentials.find(c => c.platform === platformId)
  }

  const handleEdit = (platform: Platform) => {
    const existing = getCredential(platform.id)
    if (existing) {
      setFormData({
        clientId: existing.client_id,
        clientSecret: '', // Never pre-fill secrets
        scopes: existing.scopes?.join(', ') || platform.defaultScopes.join(', '),
        redirectUri: existing.redirect_uri || ''
      })
    } else {
      setFormData({
        clientId: '',
        clientSecret: '',
        scopes: platform.defaultScopes.join(', '),
        redirectUri: ''
      })
    }
    setEditingPlatform(platform.id)
  }

  const handleSave = async () => {
    if (!editingPlatform) return

    setSaving(true)
    try {
      const scopesArray = formData.scopes
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const response = await fetch('/api/settings/platforms/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          platform: editingPlatform,
          clientId: formData.clientId,
          clientSecret: formData.clientSecret,
          scopes: scopesArray,
          redirectUri: formData.redirectUri || undefined
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert(data.message || 'Credentials saved successfully!')
        setEditingPlatform(null)
        fetchCredentials()
      } else {
        alert(data.error || 'Failed to save credentials')
      }
    } catch (error) {
      console.error('Error saving credentials:', error)
      alert('Failed to save credentials')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (credentialId: string, platformName: string) => {
    if (!confirm(`Are you sure you want to delete ${platformName} credentials? This will disconnect all ${platformName} accounts.`)) {
      return
    }

    try {
      const response = await fetch('/api/settings/platforms/credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, credentialId })
      })

      if (response.ok) {
        alert('Credentials deleted successfully')
        fetchCredentials()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete credentials')
      }
    } catch (error) {
      console.error('Error deleting credentials:', error)
      alert('Failed to delete credentials')
    }
  }

  const toggleShowSecret = (platformId: string) => {
    setShowSecret(prev => ({ ...prev, [platformId]: !prev[platformId] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          API Credentials Management
        </h3>
        <p className="text-sm text-gray-600">
          Configure OAuth credentials for each platform to enable social media connections.
          Your clients can then connect their social accounts without touching any code.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {PLATFORMS.map((platform) => {
          const credential = getCredential(platform.id)
          const isEditing = editingPlatform === platform.id

          return (
            <Card key={platform.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center text-2xl`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                    <p className="text-xs text-gray-500">{platform.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {credential && !isEditing && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="h-3 w-3" />
                      Configured
                    </div>
                  )}
                  {!credential && !isEditing && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                      <XCircle className="h-3 w-3" />
                      Not Configured
                    </div>
                  )}
                </div>
              </div>

              {!isEditing ? (
                <div>
                  {credential && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                      <p><span className="font-medium">Client ID:</span> {credential.client_id.substring(0, 20)}...</p>
                      <p><span className="font-medium">Scopes:</span> {credential.scopes?.join(', ') || 'Default'}</p>
                      {credential.redirect_uri && (
                        <p><span className="font-medium">Redirect URI:</span> {credential.redirect_uri}</p>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleEdit(platform)}
                      variant="outline"
                      className="flex-1"
                    >
                      {credential ? (
                        <>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit Credentials
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Credentials
                        </>
                      )}
                    </Button>
                    {credential && (
                      <Button
                        onClick={() => handleDelete(credential.id, platform.name)}
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
                    <p className="font-medium mb-1">Setup Instructions:</p>
                    <p>{platform.setupInstructions}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client ID / App ID *
                    </label>
                    <Input
                      type="text"
                      value={formData.clientId}
                      onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                      placeholder="Enter your Client ID"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Secret / App Secret *
                    </label>
                    <div className="relative">
                      <Input
                        type={showSecret[platform.id] ? 'text' : 'password'}
                        value={formData.clientSecret}
                        onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                        placeholder={credential ? 'Leave blank to keep existing' : 'Enter your Client Secret'}
                        required={!credential}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret(platform.id)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showSecret[platform.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OAuth Scopes (comma-separated)
                    </label>
                    <Input
                      type="text"
                      value={formData.scopes}
                      onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
                      placeholder="Default scopes will be used if left empty"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Redirect URI (optional)
                    </label>
                    <Input
                      type="url"
                      value={formData.redirectUri}
                      onChange={(e) => setFormData({ ...formData, redirectUri: e.target.value })}
                      placeholder="https://yourdomain.com/api/oauth/callback"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      If not specified, the default redirect URI will be used
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={saving || !formData.clientId || (!credential && !formData.clientSecret)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Credentials'}
                    </Button>
                    <Button
                      onClick={() => setEditingPlatform(null)}
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
