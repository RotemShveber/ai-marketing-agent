'use client'

import { useState, useEffect } from 'react'
import { User, Mail, Save, Bell, Globe, Moon, Sun, Clock, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface AccountSettingsProps {
  tenantId: string
}

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
}

interface UserSettings {
  // Notifications
  email_notifications: boolean
  push_notifications: boolean
  content_ready_notifications: boolean
  post_published_notifications: boolean
  team_activity_notifications: boolean
  weekly_digest: boolean

  // Display
  theme: 'light' | 'dark' | 'auto'
  timezone: string
  language: string

  // Content
  default_tone: string | null
  default_platforms: string[] | null
  auto_save_drafts: boolean

  // Security
  two_factor_enabled: boolean
  session_timeout_minutes: number
}

export function AccountSettings({ tenantId }: AccountSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'preferences' | 'security'>('profile')

  // Form states
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    fetchProfile()
    fetchSettings()
  }, [])

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/settings/profile')
      const data = await response.json()
      if (data.profile) {
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/preferences')
      const data = await response.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: avatarUrl || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        alert('Profile updated successfully')
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/settings/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      alert('Failed to update settings')
    }
  }

  if (loading || !profile || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {[
            { id: 'profile' as const, name: 'Profile', icon: User },
            { id: 'notifications' as const, name: 'Notifications', icon: Bell },
            { id: 'preferences' as const, name: 'Preferences', icon: Globe },
            { id: 'security' as const, name: 'Security', icon: Shield }
          ].map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{section.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if you need to update your email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar URL
                </label>
                <Input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <Button
                onClick={handleSaveProfile}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Notifications</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via email</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => handleUpdateSettings({ email_notifications: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Content Ready</p>
                  <p className="text-sm text-gray-500">Notify when generated content is ready</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.content_ready_notifications}
                  onChange={(e) => handleUpdateSettings({ content_ready_notifications: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Post Published</p>
                  <p className="text-sm text-gray-500">Notify when posts are published</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.post_published_notifications}
                  onChange={(e) => handleUpdateSettings({ post_published_notifications: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Team Activity</p>
                  <p className="text-sm text-gray-500">Notify about team member actions</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.team_activity_notifications}
                  onChange={(e) => handleUpdateSettings({ team_activity_notifications: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Weekly Digest</p>
                  <p className="text-sm text-gray-500">Receive a weekly summary of activity</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.weekly_digest}
                  onChange={(e) => handleUpdateSettings({ weekly_digest: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notifications</h3>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Push Notifications</p>
                <p className="text-sm text-gray-500">Receive browser push notifications</p>
              </div>
              <input
                type="checkbox"
                checked={settings.push_notifications}
                onChange={(e) => handleUpdateSettings({ push_notifications: e.target.checked })}
                className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
              />
            </label>
          </Card>
        </div>
      )}

      {/* Preferences Section */}
      {activeSection === 'preferences' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Display Preferences</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleUpdateSettings({ theme: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto (System)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleUpdateSettings({ timezone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleUpdateSettings({ language: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="it">Italiano</option>
                  <option value="pt">Português</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Preferences</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Auto-save Drafts</p>
                  <p className="text-sm text-gray-500">Automatically save content as drafts</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.auto_save_drafts}
                  onChange={(e) => handleUpdateSettings({ auto_save_drafts: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Security Section */}
      {activeSection === 'security' && (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.two_factor_enabled}
                  onChange={(e) => handleUpdateSettings({ two_factor_enabled: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout
                </label>
                <select
                  value={settings.session_timeout_minutes}
                  onChange={(e) => handleUpdateSettings({ session_timeout_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="120">2 hours</option>
                  <option value="480">8 hours</option>
                  <option value="1440">24 hours</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  You'll be automatically logged out after this period of inactivity
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-red-50 border-red-200">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
            <p className="text-sm text-red-700 mb-4">
              Permanent actions that cannot be undone
            </p>
            <Button variant="outline" className="border-red-300 text-red-600 hover:bg-red-100">
              Delete Account
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
