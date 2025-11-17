"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import {
  getAllCustomers,
  getCurrentCustomer,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  type CustomerConfig,
} from "@/lib/config";

type Tab =
  | "overview"
  | "customers"
  | "users"
  | "platforms"
  | "billing"
  | "settings";

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [customers, setCustomers] = useState<CustomerConfig[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerConfig | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalUsers: 0,
    activeUsers: 0,
    contentGenerated: 0,
  });

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push("/login?redirect=/admin");
      return;
    }
    setCurrentUser(user);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load customers from backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/customers`,
      );
      if (response.ok) {
        const backendCustomers = await response.json();
        setCustomers(backendCustomers);
        setSelectedCustomer(backendCustomers[0] || null);
        setStats({
          totalCustomers: backendCustomers.length,
          totalUsers: backendCustomers.length, // Mock data
          activeUsers: backendCustomers.length,
          contentGenerated: 0,
        });
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      // Fallback to localStorage
      const allCustomers = getAllCustomers();
      setCustomers(allCustomers);
      setSelectedCustomer(allCustomers[0] || null);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Top Navigation */}
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold">
                  AI
                </div>
                <div>
                  <h1 className="text-xl font-bold">AstralAI</h1>
                  <p className="text-xs text-gray-500">Admin Dashboard</p>
                </div>
              </Link>

              {/* Main Navigation */}
              <nav className="hidden md:flex gap-1">
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/generate"
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Generate
                </Link>
                <Link
                  href="/admin"
                  className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg"
                >
                  Admin
                </Link>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold">
                  {currentUser?.full_name}
                </p>
                <p className="text-xs text-gray-500">{currentUser?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                {currentUser?.full_name?.charAt(0) || "A"}
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-lg p-4 sticky top-24">
              <div className="space-y-1">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "overview"
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  📊 Overview
                </button>
                <button
                  onClick={() => setActiveTab("customers")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "customers"
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  🏢 Customers
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "users"
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  👥 Users & Permissions
                </button>
                <button
                  onClick={() => setActiveTab("platforms")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "platforms"
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  🔗 Platform APIs
                </button>
                <button
                  onClick={() => setActiveTab("billing")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "billing"
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  💳 Billing & Plans
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    activeTab === "settings"
                      ? "bg-purple-100 text-purple-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  ⚙️ System Settings
                </button>
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Quick Actions
                </p>
                <div className="space-y-2">
                  <Link
                    href="/generate"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Generate Content
                  </Link>
                  <Link
                    href="/products"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Manage Products
                  </Link>
                  <Link
                    href="/settings"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Customer Settings
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === "overview" && (
              <OverviewTab stats={stats} customers={customers} />
            )}
            {activeTab === "customers" && (
              <CustomersTab customers={customers} onUpdate={loadData} />
            )}
            {activeTab === "users" && (
              <UsersTab selectedCustomer={selectedCustomer} />
            )}
            {activeTab === "platforms" && (
              <PlatformsTab
                customers={customers}
                selectedCustomer={selectedCustomer}
                onUpdate={loadData}
              />
            )}
            {activeTab === "billing" && <BillingTab customers={customers} />}
            {activeTab === "settings" && <SettingsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Overview Tab
function OverviewTab({
  stats,
  customers,
}: {
  stats: any;
  customers: CustomerConfig[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          System Overview
        </h2>
        <p className="text-gray-600">Real-time statistics and system health</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
              🏢
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
              Active
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalCustomers}
          </p>
          <p className="text-sm text-gray-600 mt-1">Total Customers</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center text-2xl">
              👥
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
              +12%
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-600 mt-1">Total Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center text-2xl">
              ✅
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
              Online
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.activeUsers}
          </p>
          <p className="text-sm text-gray-600 mt-1">Active Users</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center text-2xl">
              📝
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
              Today
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.contentGenerated}
          </p>
          <p className="text-sm text-gray-600 mt-1">Content Generated</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Recent Customers</h3>
        <div className="space-y-3">
          {customers.slice(0, 5).map((customer, idx) => {
            const brandName =
              (customer as any).brand_name || customer.brandName;
            const companyName =
              (customer as any).company_name || customer.companyName;
            const primaryColor =
              (customer as any).primary_color || customer.primaryColor;
            const secondaryColor =
              (customer as any).secondary_color || customer.secondaryColor;

            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    {brandName?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="font-semibold">{brandName}</p>
                    <p className="text-sm text-gray-600">{companyName}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {customer.industry || "N/A"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">API Server</span>
              <span className="text-green-600 font-semibold">● Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Database</span>
              <span className="text-green-600 font-semibold">● Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">AI Services</span>
              <span className="text-green-600 font-semibold">
                ● Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Platform APIs</span>
              <span className="text-yellow-600 font-semibold">● Partial</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Platforms Connected</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Content Types</span>
              <span className="font-semibold">12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Languages Supported</span>
              <span className="font-semibold">7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Uptime</span>
              <span className="text-green-600 font-semibold">99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Customers Tab Component
function CustomersTab({
  customers,
  onUpdate,
}: {
  customers: CustomerConfig[];
  onUpdate: () => void;
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    companyName: "",
    brandName: "",
    industry: "",
    website: "",
    primaryColor: "#7C3AED",
    secondaryColor: "#EC4899",
    toneOfVoice: "professional",
  });

  const handleAddCustomer = async () => {
    if (!newCustomer.companyName || !newCustomer.brandName) {
      alert("Please fill in required fields");
      return;
    }

    try {
      // Create customer via backend API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/customers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company_name: newCustomer.companyName,
            brand_name: newCustomer.brandName,
            industry: newCustomer.industry,
            primary_color: newCustomer.primaryColor,
            secondary_color: newCustomer.secondaryColor,
            tone_of_voice: newCustomer.toneOfVoice,
          }),
        },
      );

      if (response.ok) {
        const createdCustomer = await response.json();
        alert(
          `✅ Customer "${createdCustomer.brand_name}" created successfully!`,
        );
        setShowAddModal(false);
        setNewCustomer({
          companyName: "",
          brandName: "",
          industry: "",
          website: "",
          primaryColor: "#7C3AED",
          secondaryColor: "#EC4899",
          toneOfVoice: "professional",
        });
        onUpdate();
      } else {
        const error = await response.json();
        alert(`Failed to create customer: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to create customer:", error);
      alert("Failed to create customer. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Customer Management
          </h2>
          <p className="text-gray-600">
            Manage all customer accounts and their settings
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
        >
          + Add Customer
        </button>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customers.map((customer, idx) => {
          // Handle both snake_case (backend) and camelCase (frontend) property names
          const brandName = (customer as any).brand_name || customer.brandName;
          const companyName =
            (customer as any).company_name || customer.companyName;
          const primaryColor =
            (customer as any).primary_color || customer.primaryColor;
          const secondaryColor =
            (customer as any).secondary_color || customer.secondaryColor;
          const toneOfVoice =
            (customer as any).tone_of_voice || customer.toneOfVoice;

          return (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="h-12 w-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  {brandName?.charAt(0) || "?"}
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                  Active
                </span>
              </div>

              <h3 className="text-xl font-bold mb-1">{brandName}</h3>
              <p className="text-sm text-gray-600 mb-4">{companyName}</p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Industry:</span>
                  <span className="font-medium">
                    {customer.industry || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Tone:</span>
                  <span className="font-medium capitalize">{toneOfVoice}</span>
                </div>
                {customer.website && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Website:</span>
                    <a
                      href={customer.website}
                      target="_blank"
                      className="text-purple-600 hover:underline truncate"
                    >
                      {customer.website
                        .replace("https://", "")
                        .replace("http://", "")}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex gap-2">
                <Link
                  href={`/users?customer=${customer.id}`}
                  className="flex-1 px-3 py-2 text-center text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-medium"
                >
                  Manage Users
                </Link>
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        `Delete ${brandName}? This will also remove all associated users.`,
                      )
                    ) {
                      try {
                        const response = await fetch(
                          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/customers/${customer.id}`,
                          {
                            method: "DELETE",
                          },
                        );
                        if (response.ok) {
                          alert(
                            `✅ Customer "${brandName}" deleted successfully!`,
                          );
                          onUpdate();
                        } else {
                          alert("Failed to delete customer");
                        }
                      } catch (error) {
                        console.error("Failed to delete customer:", error);
                        alert("Failed to delete customer");
                      }
                    }
                  }}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6">Add New Customer</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.companyName}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      companyName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="E N Trade LTD"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.brandName}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      brandName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="E N Trade"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={newCustomer.industry}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, industry: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="Beauty, Tech, Fashion..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={newCustomer.website}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, website: e.target.value })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCustomer.primaryColor}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        primaryColor: e.target.value,
                      })
                    }
                    className="h-10 w-20 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCustomer.primaryColor}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        primaryColor: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={newCustomer.secondaryColor}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="h-10 w-20 border rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newCustomer.secondaryColor}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        secondaryColor: e.target.value,
                      })
                    }
                    className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">
                  Tone of Voice
                </label>
                <select
                  value={newCustomer.toneOfVoice}
                  onChange={(e) =>
                    setNewCustomer({
                      ...newCustomer,
                      toneOfVoice: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="luxury">Luxury</option>
                  <option value="playful">Playful</option>
                  <option value="friendly">Friendly</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddCustomer}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold"
              >
                Create Customer
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Users Tab Component - Will be created in part 2
function UsersTab({
  selectedCustomer,
}: {
  selectedCustomer: CustomerConfig | null;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold mb-4">User & Permission Management</h3>
      <p className="text-gray-600 mb-6">
        Manage user roles and access control for your customers
      </p>

      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <p className="text-gray-500 mb-4">User management interface</p>
        <Link
          href="/users"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold inline-block hover:bg-purple-700"
        >
          Go to User Management
        </Link>
      </div>
    </div>
  );
}

// Platforms Tab - Will be created in part 2
function PlatformsTab({
  customers,
  selectedCustomer,
  onUpdate,
}: {
  customers: CustomerConfig[];
  selectedCustomer: CustomerConfig | null;
  onUpdate: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold mb-4">Platform API Configuration</h3>
      <p className="text-gray-600 mb-6">
        Configure API keys for Facebook, Instagram, TikTok, YouTube, and Google
        Ads
      </p>

      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔗</div>
        <p className="text-gray-500 mb-4">Platform configuration interface</p>
        <Link
          href="/settings"
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold inline-block hover:bg-purple-700"
        >
          Go to Platform Settings
        </Link>
      </div>
    </div>
  );
}

// Billing Tab - Will be created in part 2
function BillingTab({ customers }: { customers: CustomerConfig[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        Billing & Subscriptions
      </h2>
      <p className="text-gray-600">
        Manage customer subscriptions and billing information
      </p>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-gray-500 mb-4">Billing management coming soon</p>
          <p className="text-sm text-gray-400">
            Connect with Stripe or PayPal for subscription management
          </p>
        </div>
      </div>
    </div>
  );
}

// Settings Tab - Will be created in part 2
function SettingsTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        System Settings
      </h2>
      <p className="text-gray-600">
        Configure system-wide settings and preferences
      </p>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚙️</div>
          <p className="text-gray-500 mb-4">System settings interface</p>
          <Link
            href="/settings"
            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold inline-block hover:bg-purple-700"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    </div>
  );
}
