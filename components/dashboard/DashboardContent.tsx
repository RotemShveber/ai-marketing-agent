'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import ContentLibrary from './ContentLibrary'
import ContentGenerator from './ContentGenerator'
import ScheduleCalendar from './ScheduleCalendar'
import AIChat from './AIChat'
import { SettingsContent } from './SettingsContent'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  FolderOpen,
  Calendar,
  MessageSquare,
  LogOut,
  Menu,
  X,
  Zap,
  Settings
} from 'lucide-react'

type TabType = 'generate' | 'library' | 'schedule' | 'chat' | 'settings'

export default function DashboardContent({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('generate')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const navItems = [
    { id: 'generate' as TabType, label: 'Generate', icon: Sparkles, description: 'Create AI content' },
    { id: 'chat' as TabType, label: 'AI Chat', icon: MessageSquare, description: 'Chat with AI' },
    { id: 'library' as TabType, label: 'Library', icon: FolderOpen, description: 'View content' },
    { id: 'schedule' as TabType, label: 'Schedule', icon: Calendar, description: 'Plan posts' },
    { id: 'settings' as TabType, label: 'Settings', icon: Settings, description: 'Manage account' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">MarketAI</h1>
              <p className="text-xs text-slate-500">Content Studio</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} />
                <div>
                  <span className="font-medium">{item.label}</span>
                  <p className={`text-xs ${activeTab === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                    {item.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-100">
            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-slate-100">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">MarketAI</span>
          </div>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {navItems.find(item => item.id === activeTab)?.label}
            </h2>
            <p className="text-slate-500 mt-1">
              {activeTab === 'generate' && 'Create stunning marketing content with AI'}
              {activeTab === 'chat' && 'Chat with your AI marketing assistant'}
              {activeTab === 'library' && 'Browse and manage your generated content'}
              {activeTab === 'schedule' && 'Plan and schedule your social media posts'}
              {activeTab === 'settings' && 'Manage your account, team, and integrations'}
            </p>
          </div>

          {/* Content */}
          <div className="animate-in fade-in duration-300">
            {activeTab === 'generate' && <ContentGenerator tenantId={tenantId} />}
            {activeTab === 'chat' && <AIChat tenantId={tenantId} />}
            {activeTab === 'library' && <ContentLibrary tenantId={tenantId} />}
            {activeTab === 'schedule' && <ScheduleCalendar tenantId={tenantId} />}
            {activeTab === 'settings' && <SettingsContent tenantId={tenantId} />}
          </div>
        </div>
      </main>
    </div>
  )
}
