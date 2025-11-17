"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { getAccessToken, UserRole, getRoleDisplayName, getRoleColor } from "@/lib/auth"
import { getAllCustomers, getCurrentCustomer, type CustomerConfig } from "@/lib/config"

interface User {
  id: number
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  is_active: boolean
  last_login?: string
  created_at: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [customers, setCustomers] = useState<CustomerConfig[]>([])
  const [currentCustomer, setCurrentCustomer] = useState<CustomerConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.VIEWER)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteToken, setInviteToken] = useState("")
  const [showTestUserModal, setShowTestUserModal] = useState(false)
  const [testUserCredentials, setTestUserCredentials] = useState<{email: string, password: string, role: string} | null>(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (currentCustomer) {
      loadUsers()
    }
  }, [currentCustomer])

  const loadCustomers = async () => {
    try {
      // Load customers from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/customers`)
      if (response.ok) {
        const backendCustomers = await response.json()
        setCustomers(backendCustomers)

        // Check URL for customer parameter
        const params = new URLSearchParams(window.location.search)
        const customerIdFromUrl = params.get('customer')

        if (customerIdFromUrl) {
          const selected = backendCustomers.find((c: any) => c.id === parseInt(customerIdFromUrl))
          setCurrentCustomer(selected || backendCustomers[0] || null)
        } else if (backendCustomers.length > 0) {
          setCurrentCustomer(backendCustomers[0])
        }
      }
    } catch (error) {
      console.error("Failed to load customers:", error)
    }
  }

  const loadUsers = async () => {
    if (!currentCustomer) return

    setLoading(true)
    try {
      const token = getAccessToken()
      if (!token) {
        window.location.href = "/login"
        return
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/users/customer/${currentCustomer.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Failed to load users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async () => {
    if (!inviteEmail || !currentCustomer) return

    try {
      const token = getAccessToken()
      if (!token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/auth/invite`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
            customer_id: currentCustomer.id,
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setInviteToken(data.invitation_token)
        setInviteEmail("")
        // Show success message or invitation link
      }
    } catch (error) {
      console.error("Failed to invite user:", error)
    }
  }

  const handleChangeRole = async (userId: number, newRole: UserRole) => {
    if (!currentCustomer) return

    try {
      const token = getAccessToken()
      if (!token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/users/customer/${currentCustomer.id}/user/${userId}/role`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: newRole }),
        }
      )

      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error("Failed to change role:", error)
    }
  }

  const handleRemoveUser = async (userId: number) => {
    if (!currentCustomer || !confirm("Are you sure you want to remove this user?")) return

    try {
      const token = getAccessToken()
      if (!token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/users/customer/${currentCustomer.id}/user/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error("Failed to remove user:", error)
    }
  }

  const handleCreateTestUser = async (role: string) => {
    if (!currentCustomer?.id) {
      alert("Please select a customer first")
      return
    }

    try {
      const customerName = currentCustomer.brand_name || currentCustomer.brandName
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/users/create-test-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: `${role}@${customerName.toLowerCase().replace(/\s+/g, '')}.com`,
            full_name: `${customerName} ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            role: role,
            customer_id: currentCustomer.id
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTestUserCredentials({
          email: data.email,
          password: data.password,
          role: data.role
        })
        loadUsers()
      } else {
        const error = await response.json()
        alert(error.detail || "Failed to create test user")
      }
    } catch (error) {
      console.error("Failed to create test user:", error)
      alert("Failed to create test user")
    }
  }

  const handleLoginAsUser = async (userId: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/auth/login-as/${userId}`,
        {
          method: "POST",
        }
      )

      if (response.ok) {
        const data = await response.json()
        // Save auth tokens
        localStorage.setItem("auth_tokens", JSON.stringify(data))
        // Reload to apply new user context
        window.location.reload()
      }
    } catch (error) {
      console.error("Failed to login as user:", error)
    }
  }

  const getRoleBadgeClass = (role: UserRole) => {
    const colors = {
      super_admin: "bg-purple-100 text-purple-800 border-purple-200",
      customer_admin: "bg-blue-100 text-blue-800 border-blue-200",
      manager: "bg-green-100 text-green-800 border-green-200",
      editor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      viewer: "bg-gray-100 text-gray-800 border-gray-200",
    }
    return colors[role] || colors.viewer
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
                <p className="text-sm text-gray-600">User Management</p>
              </div>
            </Link>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/generate" className="text-gray-600 hover:text-gray-900">Generate</Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Team Members
              </h2>
              <p className="text-gray-600">
                Manage users and permissions for {currentCustomer?.brandName || "your organization"}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTestUserModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                🧪 Create Test User
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105"
              >
                + Invite User
              </button>
            </div>
          </div>

          {/* Customer Selector */}
          {customers.length > 1 && (
            <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Customer
              </label>
              <select
                value={currentCustomer?.id || ""}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value)
                  setCurrentCustomer(customer || null)
                }}
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              >
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.brandName} ({customer.companyName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        Loading users...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No users found. Invite your first team member!
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold">
                              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.full_name || "No name"}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.role)}`}
                          >
                            <option value={UserRole.VIEWER}>Viewer</option>
                            <option value={UserRole.EDITOR}>Editor</option>
                            <option value={UserRole.MANAGER}>Manager</option>
                            <option value={UserRole.CUSTOMER_ADMIN}>Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {user.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {user.last_login
                            ? new Date(user.last_login).toLocaleDateString()
                            : "Never"
                          }
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleLoginAsUser(user.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              title="Login as this user"
                            >
                              Login As
                            </button>
                            <button
                              onClick={() => handleRemoveUser(user.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Test User Creation Modal */}
          {showTestUserModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold mb-4">🧪 Create Test User</h3>
                <p className="text-gray-600 mb-6">
                  Create a test user for <span className="font-semibold text-purple-600">{currentCustomer?.brand_name || currentCustomer?.brandName || 'this customer'}</span> with one of the following roles:
                </p>

                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => {
                      handleCreateTestUser("editor")
                      setShowTestUserModal(false)
                    }}
                    className="w-full p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-yellow-800 mb-1">Editor</div>
                    <div className="text-sm text-yellow-700">Can create and edit content</div>
                    <div className="text-xs text-yellow-600 mt-2 font-mono">editor@entrade.com</div>
                  </button>

                  <button
                    onClick={() => {
                      handleCreateTestUser("manager")
                      setShowTestUserModal(false)
                    }}
                    className="w-full p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-green-800 mb-1">Manager</div>
                    <div className="text-sm text-green-700">Can manage content and invite users</div>
                    <div className="text-xs text-green-600 mt-2 font-mono">manager@entrade.com</div>
                  </button>

                  <button
                    onClick={() => {
                      handleCreateTestUser("viewer")
                      setShowTestUserModal(false)
                    }}
                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <div className="font-semibold text-gray-800 mb-1">Viewer</div>
                    <div className="text-sm text-gray-700">Read-only access</div>
                    <div className="text-xs text-gray-600 mt-2 font-mono">viewer@entrade.com</div>
                  </button>
                </div>

                <button
                  onClick={() => setShowTestUserModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Test User Credentials Modal */}
          {testUserCredentials && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold mb-4 text-green-600">✅ Test User Created!</h3>

                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-4">
                    Use these credentials to login and test the {testUserCredentials.role} role:
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-green-700 font-semibold">Email</label>
                      <div className="mt-1 p-2 bg-white rounded font-mono text-sm">
                        {testUserCredentials.email}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-green-700 font-semibold">Password</label>
                      <div className="mt-1 p-2 bg-white rounded font-mono text-sm">
                        {testUserCredentials.password}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-green-700 font-semibold">Role</label>
                      <div className="mt-1 p-2 bg-white rounded font-mono text-sm capitalize">
                        {testUserCredentials.role}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`Email: ${testUserCredentials.email}\nPassword: ${testUserCredentials.password}`)
                      alert("Credentials copied to clipboard!")
                    }}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Copy Credentials
                  </button>
                  <button
                    onClick={() => setTestUserCredentials(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    💡 <span className="font-semibold">Tip:</span> Click "Login As" next to any user to instantly switch to their account and test their permissions!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invite Modal */}
          {showInviteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <h3 className="text-2xl font-bold mb-4">Invite Team Member</h3>

                {inviteToken ? (
                  <div>
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium mb-2">Invitation created!</p>
                      <p className="text-xs text-green-700">Share this link with your team member:</p>
                    </div>
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg font-mono text-sm break-all">
                      {window.location.origin}/register?token={inviteToken}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?token=${inviteToken}`)
                        alert("Link copied to clipboard!")
                      }}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 mb-2"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => {
                        setShowInviteModal(false)
                        setInviteToken("")
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="user@company.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as UserRole)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value={UserRole.VIEWER}>Viewer - View only</option>
                        <option value={UserRole.EDITOR}>Editor - Create and edit content</option>
                        <option value={UserRole.MANAGER}>Manager - Manage content and invite users</option>
                        <option value={UserRole.CUSTOMER_ADMIN}>Admin - Full access</option>
                      </select>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleInviteUser}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all"
                      >
                        Send Invite
                      </button>
                      <button
                        onClick={() => setShowInviteModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
