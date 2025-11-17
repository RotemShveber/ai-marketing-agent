"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getUser } from "@/lib/auth"
import {
  loadConfig,
  saveConfig,
  clearConfig,
  maskApiKey,
  getCurrentCustomer,
  getAllCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setCurrentCustomer,
  type AppConfig,
  type CustomerConfig
} from "@/lib/config"

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig>({
    openaiApiKey: '',
    anthropicApiKey: '',
    didApiKey: '',
    elevenlabsApiKey: '',
    customers: [],
    enableImageGeneration: true,
    enableVideoGeneration: true,
    enableMultiLanguage: true,
  })
  const [currentCustomer, setCurrentCustomerState] = useState<CustomerConfig | null>(null)
  const [customers, setCustomers] = useState<CustomerConfig[]>([])
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [activeTab, setActiveTab] = useState<'ai-keys' | 'customers' | 'platforms' | 'features'>('platforms')
  const [editingCustomer, setEditingCustomer] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    const user = getUser()
    setCurrentUser(user)
    const loaded = loadConfig()
    setConfig(loaded)
    setCustomers(getAllCustomers())
    setCurrentCustomerState(getCurrentCustomer())
  }, [])

  const handleSave = () => {
    try {
      saveConfig(config)
      if (currentCustomer) {
        updateCustomer(currentCustomer.id!, currentCustomer)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      alert('Failed to save configuration. Please try again.')
    }
  }

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all configuration? This cannot be undone.')) {
      clearConfig()
      window.location.reload()
    }
  }

  const handleAddCustomer = () => {
    const newCustomer: CustomerConfig = {
      id: `customer-${Date.now()}`,
      companyName: 'New Customer',
      brandName: 'New Brand',
      primaryColor: '#7C3AED',
      secondaryColor: '#EC4899',
      toneOfVoice: 'professional',
      platforms: {},
    }
    addCustomer(newCustomer)
    setCustomers(getAllCustomers())
    setCurrentCustomerState(newCustomer)
    setCurrentCustomer(newCustomer.id!)
  }

  const handleSelectCustomer = (customerId: string) => {
    setCurrentCustomer(customerId)
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setCurrentCustomerState(customer)
    }
  }

  const handleDeleteCustomer = (customerId: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      deleteCustomer(customerId)
      setCustomers(getAllCustomers())
      setCurrentCustomerState(getCurrentCustomer())
    }
  }

  const updateCurrentCustomer = (updates: Partial<CustomerConfig>) => {
    if (currentCustomer) {
      const updated = { ...currentCustomer, ...updates }
      setCurrentCustomerState(updated)
      updateCustomer(currentCustomer.id!, updates)
    }
  }

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
                <h1 className="text-xl font-bold">AstralAI</h1>
                <p className="text-sm text-gray-600">Multi-Platform Marketing</p>
              </div>
            </Link>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/generate" className="text-gray-600 hover:text-gray-900">Generate</Link>
              <Link href="/chat" className="text-gray-600 hover:text-gray-900">Chat</Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Settings
            </h2>
            <p className="text-gray-600">Configure API keys, manage customers, and platform integrations</p>
          </div>

          {/* Success Message */}
          {saved && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">✓ Settings saved successfully!</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6 flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('ai-keys')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'ai-keys'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              AI Service Keys
            </button>
            {currentUser?.is_super_admin && (
              <button
                onClick={() => setActiveTab('customers')}
                className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                  activeTab === 'customers'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Customers ({customers.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('platforms')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'platforms'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Platform APIs
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'features'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Features
            </button>
          </div>

          {/* AI Service Keys Tab */}
          {activeTab === 'ai-keys' && (
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-1">AI Service API Keys</h3>
                  <p className="text-sm text-gray-600">Keys for AI services used across all customers</p>
                </div>
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {showKeys ? '🔒 Hide Keys' : '👁️ Show Keys'}
                </button>
              </div>

              <div className="space-y-6">
                {/* OpenAI API Key */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    OpenAI API Key * <span className="text-xs font-normal text-gray-500">(Required for content generation)</span>
                  </label>
                  <input
                    type={showKeys ? "text" : "password"}
                    value={config.openaiApiKey}
                    onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                    placeholder="sk-proj-..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">OpenAI Platform</a>
                  </p>
                </div>

                {/* Anthropic API Key */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Anthropic API Key <span className="text-xs font-normal text-gray-500">(Optional - for Claude integration)</span>
                  </label>
                  <input
                    type={showKeys ? "text" : "password"}
                    value={config.anthropicApiKey || ''}
                    onChange={(e) => setConfig({ ...config, anthropicApiKey: e.target.value })}
                    placeholder="sk-ant-..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                </div>

                {/* D-ID API Key */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    D-ID API Key <span className="text-xs font-normal text-gray-500">(Optional - for avatar videos)</span>
                  </label>
                  <input
                    type={showKeys ? "text" : "password"}
                    value={config.didApiKey || ''}
                    onChange={(e) => setConfig({ ...config, didApiKey: e.target.value })}
                    placeholder="Enter D-ID API key"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                </div>

                {/* ElevenLabs API Key */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ElevenLabs API Key <span className="text-xs font-normal text-gray-500">(Optional - for voice generation)</span>
                  </label>
                  <input
                    type={showKeys ? "text" : "password"}
                    value={config.elevenlabsApiKey || ''}
                    onChange={(e) => setConfig({ ...config, elevenlabsApiKey: e.target.value })}
                    placeholder="Enter ElevenLabs API key"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-lg p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Customer Management</h3>
                    <p className="text-sm text-gray-600">Manage different customers and their brand settings</p>
                  </div>
                  <button
                    onClick={handleAddCustomer}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    + Add Customer
                  </button>
                </div>

                {/* Customer List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {customers.map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        currentCustomer?.id === customer.id
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleSelectCustomer(customer.id!)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-lg">{customer.brandName}</h4>
                          <p className="text-sm text-gray-600">{customer.companyName}</p>
                          <div className="flex gap-2 mt-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: customer.primaryColor }}
                            />
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: customer.secondaryColor }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCustomer(customer.id!)
                          }}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current Customer Editor */}
                {currentCustomer && (
                  <div className="border-t pt-6">
                    <h4 className="text-xl font-bold mb-4">Edit Customer: {currentCustomer.brandName}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name</label>
                        <input
                          type="text"
                          value={currentCustomer.companyName}
                          onChange={(e) => updateCurrentCustomer({ companyName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Brand Name</label>
                        <input
                          type="text"
                          value={currentCustomer.brandName}
                          onChange={(e) => updateCurrentCustomer({ brandName: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Industry</label>
                        <input
                          type="text"
                          value={currentCustomer.industry || ''}
                          onChange={(e) => updateCurrentCustomer({ industry: e.target.value })}
                          placeholder="e.g., Beauty, Tech, Fashion"
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Website</label>
                        <input
                          type="url"
                          value={currentCustomer.website || ''}
                          onChange={(e) => updateCurrentCustomer({ website: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentCustomer.primaryColor}
                            onChange={(e) => updateCurrentCustomer({ primaryColor: e.target.value })}
                            className="h-10 w-20 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={currentCustomer.primaryColor}
                            onChange={(e) => updateCurrentCustomer({ primaryColor: e.target.value })}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Secondary Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={currentCustomer.secondaryColor}
                            onChange={(e) => updateCurrentCustomer({ secondaryColor: e.target.value })}
                            className="h-10 w-20 border rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={currentCustomer.secondaryColor}
                            onChange={(e) => updateCurrentCustomer({ secondaryColor: e.target.value })}
                            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tone of Voice</label>
                        <select
                          value={currentCustomer.toneOfVoice}
                          onChange={(e) => updateCurrentCustomer({ toneOfVoice: e.target.value })}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                          <option value="professional">Professional</option>
                          <option value="casual">Casual</option>
                          <option value="luxury">Luxury</option>
                          <option value="playful">Playful</option>
                          <option value="friendly">Friendly</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                        <textarea
                          value={currentCustomer.targetAudience || ''}
                          onChange={(e) => updateCurrentCustomer({ targetAudience: e.target.value })}
                          placeholder="Describe your target audience..."
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform APIs Tab */}
          {activeTab === 'platforms' && currentCustomer && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-1">Platform API Keys</h3>
                <p className="text-sm text-gray-600">Configure API keys for {currentCustomer.brandName}</p>
              </div>

              <div className="space-y-8">
                {/* Facebook/Instagram (Meta) */}
                <div className="border-b pb-6">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-blue-600">Facebook & Instagram</span>
                    <span className="text-xs text-gray-500">(Meta Business API)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Facebook Access Token</label>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={currentCustomer.platforms.facebook?.accessToken || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            facebook: { ...currentCustomer.platforms.facebook, accessToken: e.target.value }
                          }
                        })}
                        placeholder="Enter Meta access token"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Facebook Page ID</label>
                      <input
                        type="text"
                        value={currentCustomer.platforms.facebook?.pageId || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            facebook: { ...currentCustomer.platforms.facebook, pageId: e.target.value }
                          }
                        })}
                        placeholder="Page ID"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Instagram Access Token</label>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={currentCustomer.platforms.instagram?.accessToken || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            instagram: { ...currentCustomer.platforms.instagram, accessToken: e.target.value }
                          }
                        })}
                        placeholder="Enter Instagram token"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Instagram Account ID</label>
                      <input
                        type="text"
                        value={currentCustomer.platforms.instagram?.accountId || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            instagram: { ...currentCustomer.platforms.instagram, accountId: e.target.value }
                          }
                        })}
                        placeholder="Account ID"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* TikTok */}
                <div className="border-b pb-6">
                  <h4 className="text-lg font-bold mb-4 text-gray-900">TikTok</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">TikTok Access Token</label>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={currentCustomer.platforms.tiktok?.accessToken || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            tiktok: { accessToken: e.target.value }
                          }
                        })}
                        placeholder="Enter TikTok access token"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* YouTube */}
                <div className="border-b pb-6">
                  <h4 className="text-lg font-bold mb-4 text-red-600">YouTube</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">YouTube API Key</label>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={currentCustomer.platforms.youtube?.apiKey || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            youtube: { ...currentCustomer.platforms.youtube, apiKey: e.target.value }
                          }
                        })}
                        placeholder="Enter YouTube API key"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">YouTube Channel ID</label>
                      <input
                        type="text"
                        value={currentCustomer.platforms.youtube?.channelId || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            youtube: { ...currentCustomer.platforms.youtube, channelId: e.target.value }
                          }
                        })}
                        placeholder="Channel ID"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Google Ads */}
                <div>
                  <h4 className="text-lg font-bold mb-4 text-green-600">Google Ads</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Customer ID</label>
                      <input
                        type="text"
                        value={currentCustomer.platforms.googleAds?.customerId || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            googleAds: { ...currentCustomer.platforms.googleAds, customerId: e.target.value }
                          }
                        })}
                        placeholder="123-456-7890"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Access Token</label>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={currentCustomer.platforms.googleAds?.accessToken || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            googleAds: { ...currentCustomer.platforms.googleAds, accessToken: e.target.value }
                          }
                        })}
                        placeholder="Enter access token"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">Developer Token</label>
                      <input
                        type={showKeys ? "text" : "password"}
                        value={currentCustomer.platforms.googleAds?.developerToken || ''}
                        onChange={(e) => updateCurrentCustomer({
                          platforms: {
                            ...currentCustomer.platforms,
                            googleAds: { ...currentCustomer.platforms.googleAds, developerToken: e.target.value }
                          }
                        })}
                        placeholder="Developer token"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6">Feature Flags</h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">Image Generation</p>
                    <p className="text-sm text-gray-600">Generate product images with DALL-E</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableImageGeneration}
                    onChange={(e) => setConfig({ ...config, enableImageGeneration: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">Video Generation</p>
                    <p className="text-sm text-gray-600">Create marketing videos automatically</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableVideoGeneration}
                    onChange={(e) => setConfig({ ...config, enableVideoGeneration: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900">Multi-Language Support</p>
                    <p className="text-sm text-gray-600">Generate content in 7 languages</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableMultiLanguage}
                    onChange={(e) => setConfig({ ...config, enableMultiLanguage: e.target.checked })}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSave}
              className="flex-1 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
            >
              Save All Settings
            </button>
            <button
              onClick={handleClear}
              className="px-8 py-4 border-2 border-red-500 text-red-600 rounded-lg font-semibold hover:bg-red-50 transition-all"
            >
              Clear All
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              🔒 <strong>Privacy First:</strong> All your API keys and customer data are stored locally in your browser using localStorage. They are never sent to external servers. Only you have access to your keys.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
