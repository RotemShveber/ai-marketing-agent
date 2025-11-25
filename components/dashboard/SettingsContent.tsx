'use client'

import { useState } from 'react'
import { Settings, Users, BarChart3, Link as LinkIcon, Bell, User } from 'lucide-react'
import { UserManagement } from './settings/UserManagement'
import { AnalyticsDashboard } from './settings/AnalyticsDashboard'
import { PlatformConnections } from './settings/PlatformConnections'
import { AccountSettings } from './settings/AccountSettings'

interface SettingsContentProps {
  tenantId: string
}

type SettingsTab = 'account' | 'users' | 'analytics' | 'platforms' | 'notifications'

export function SettingsContent({ tenantId }: SettingsContentProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('account')

  const tabs = [
    { id: 'account' as SettingsTab, name: 'Account', icon: User },
    { id: 'users' as SettingsTab, name: 'Team', icon: Users },
    { id: 'analytics' as SettingsTab, name: 'Analytics', icon: BarChart3 },
    { id: 'platforms' as SettingsTab, name: 'Platforms', icon: LinkIcon },
    { id: 'notifications' as SettingsTab, name: 'Notifications', icon: Bell }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8 text-indigo-600" />
            Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Manage your account, team, and integrations
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto" aria-label="Settings tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                      ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'account' && <AccountSettings tenantId={tenantId} />}
            {activeTab === 'users' && <UserManagement tenantId={tenantId} />}
            {activeTab === 'analytics' && <AnalyticsDashboard tenantId={tenantId} />}
            {activeTab === 'platforms' && <PlatformConnections tenantId={tenantId} />}
            {activeTab === 'notifications' && (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Notification Settings
                </h3>
                <p className="text-gray-600">
                  Manage your email and push notification preferences
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
