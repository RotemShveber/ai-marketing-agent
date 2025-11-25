'use client'

import { useState, useEffect } from 'react'
import { Link as LinkIcon, Check, X, AlertCircle, Unlink, RefreshCw, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlatformCredentialsManager } from './PlatformCredentialsManager'

interface PlatformConnectionsProps {
  tenantId: string
}

interface Connection {
  id: string
  platform: string
  platform_user_id: string
  platform_username: string
  is_active: boolean
  last_sync_at: string | null
  token_expires_at: string | null
  is_expired: boolean
  created_at: string
}

interface Platform {
  id: string
  name: string
  icon: string
  description: string
  color: string
}

const PLATFORMS: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    description: 'Share photos and stories with your followers',
    color: 'from-pink-500 to-purple-500'
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    description: 'Post updates to your Facebook page',
    color: 'from-blue-600 to-blue-400'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    description: 'Create and share short-form videos',
    color: 'from-black to-cyan-500'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    description: 'Share professional content with your network',
    color: 'from-blue-700 to-blue-500'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '🎥',
    description: 'Upload and manage your video content',
    color: 'from-red-600 to-red-400'
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    icon: '🎯',
    description: 'Create and manage advertising campaigns',
    color: 'from-green-500 to-yellow-500'
  }
]

export function PlatformConnections({ tenantId }: PlatformConnectionsProps) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showCredentialsManager, setShowCredentialsManager] = useState(false)

  useEffect(() => {
    fetchConnections()
  }, [tenantId])

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/settings/platforms?tenantId=${tenantId}`)
      const data = await response.json()
      if (data.connections) {
        setConnections(data.connections)
      }
    } catch (error) {
      console.error('Error fetching connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const isConnected = (platformId: string) => {
    return connections.some(
      (conn) => conn.platform === platformId && conn.is_active && !conn.is_expired
    )
  }

  const getConnection = (platformId: string) => {
    return connections.find((conn) => conn.platform === platformId)
  }

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId)

    try {
      // Get OAuth URL
      const redirectUri = `${window.location.origin}/api/oauth/callback`
      const response = await fetch('/api/settings/platforms/oauth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, platform: platformId, redirectUri })
      })

      const data = await response.json()

      if (data.oauth_url) {
        // Open OAuth popup
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const popup = window.open(
          data.oauth_url,
          'oauth',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        // Listen for OAuth callback
        const handleMessage = (event: MessageEvent) => {
          if (event.data.type === 'oauth_success') {
            window.removeEventListener('message', handleMessage)
            popup?.close()
            fetchConnections()
            setConnecting(null)
          } else if (event.data.type === 'oauth_error') {
            window.removeEventListener('message', handleMessage)
            popup?.close()
            alert('Failed to connect: ' + event.data.error)
            setConnecting(null)
          }
        }

        window.addEventListener('message', handleMessage)

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener('message', handleMessage)
            setConnecting(null)
          }
        }, 1000)
      } else {
        if (data.needs_configuration) {
          // Show credentials manager if credentials are not configured
          alert(data.error + '\n\nClick "Manage API Credentials" to configure OAuth.')
          setShowCredentialsManager(true)
        } else {
          alert(data.error || 'Failed to generate OAuth URL')
        }
        setConnecting(null)
      }
    } catch (error) {
      console.error('Error connecting platform:', error)
      alert('Failed to initiate connection')
      setConnecting(null)
    }
  }

  const handleDisconnect = async (connectionId: string, platformName: string) => {
    if (!confirm(`Are you sure you want to disconnect ${platformName}? This will stop all scheduled posts to this platform.`)) {
      return
    }

    try {
      const response = await fetch('/api/settings/platforms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, connectionId })
      })

      if (response.ok) {
        fetchConnections()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to disconnect platform')
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error)
      alert('Failed to disconnect platform')
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Platform Connections</h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect your social media accounts to publish content automatically
          </p>
        </div>
        <Button
          onClick={() => setShowCredentialsManager(!showCredentialsManager)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {showCredentialsManager ? 'Hide' : 'Manage'} API Credentials
        </Button>
      </div>

      {/* Credentials Manager */}
      {showCredentialsManager && (
        <div className="border-t border-b border-gray-200 -mx-6 px-6 py-6 bg-gray-50">
          <PlatformCredentialsManager tenantId={tenantId} />
        </div>
      )}

      {/* Info Banner */}
      {!showCredentialsManager && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Configure OAuth Credentials</p>
            <p>
              Click "Manage API Credentials" above to configure OAuth apps for each platform.
              Once configured, you and your team can connect social media accounts with one click.
            </p>
          </div>
        </div>
      )}

      {/* Platforms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PLATFORMS.map((platform) => {
          const connection = getConnection(platform.id)
          const connected = isConnected(platform.id)
          const isExpired = connection?.is_expired

          return (
            <Card key={platform.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center text-2xl`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    <p className="text-xs text-gray-500">{platform.description}</p>
                  </div>
                </div>

                {connected && !isExpired && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <Check className="h-3 w-3" />
                    Connected
                  </div>
                )}

                {isExpired && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    <AlertCircle className="h-3 w-3" />
                    Expired
                  </div>
                )}
              </div>

              {connection && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Account:</span> @{connection.platform_username}
                  </p>
                  {connection.last_sync_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last synced: {new Date(connection.last_sync_at).toLocaleString()}
                    </p>
                  )}
                  {connection.token_expires_at && (
                    <p className="text-xs text-gray-500">
                      {isExpired ? 'Expired on' : 'Expires on'}: {new Date(connection.token_expires_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                {!connected || isExpired ? (
                  <Button
                    onClick={() => handleConnect(platform.id)}
                    disabled={connecting === platform.id}
                    className={`flex-1 bg-gradient-to-r ${platform.color} text-white hover:opacity-90`}
                  >
                    {connecting === platform.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="h-4 w-4 mr-2" />
                        {isExpired ? 'Reconnect' : 'Connect'}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleDisconnect(connection!.id, platform.name)}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

    </div>
  )
}
