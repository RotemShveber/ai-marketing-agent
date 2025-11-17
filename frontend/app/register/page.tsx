"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { register } from "@/lib/auth"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const invitationToken = searchParams?.get("token")

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    message: "",
    color: "gray"
  })

  const checkPasswordStrength = (password: string) => {
    let score = 0
    let message = "Weak"
    let color = "red"

    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) score++

    if (score >= 4) {
      message = "Strong"
      color = "green"
    } else if (score >= 3) {
      message = "Medium"
      color = "yellow"
    }

    setPasswordStrength({ score, message, color })
  }

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    if (password) {
      checkPasswordStrength(password)
    } else {
      setPasswordStrength({ score: 0, message: "", color: "gray" })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (passwordStrength.score < 3) {
      setError("Please use a stronger password")
      return
    }

    setLoading(true)

    try {
      await register(
        formData.email,
        formData.password,
        formData.full_name,
        invitationToken || undefined
      )
      router.push("/dashboard")
    } catch (err: any) {
      setError(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4">
            <span className="text-3xl font-bold text-white">AI</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-600">
            {invitationToken ? "You've been invited to join an organization" : "Start automating your marketing"}
          </p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Invitation Notice */}
          {invitationToken && (
            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-800 font-medium">
                You're joining an existing organization
              </p>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="you@company.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-semibold text-${passwordStrength.color}-600`}>
                      {passwordStrength.message}
                    </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-${passwordStrength.color}-500 transition-all`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 mt-1"
              />
              <label className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-purple-600 hover:text-purple-700 font-medium">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-700 font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
              Sign in
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  )
}
