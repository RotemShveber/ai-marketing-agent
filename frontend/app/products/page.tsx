"use client"

import { useState } from "react"
import Link from "next/link"

export default function ProductsPage() {
  const [products] = useState([
    {
      id: 1,
      name: "Rose Elegance",
      category: "Floral",
      notes: { top: "Rose, Bergamot", middle: "Jasmine", base: "Sandalwood" },
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=300",
      contentCount: 12
    },
    {
      id: 2,
      name: "Ocean Breeze",
      category: "Fresh",
      notes: { top: "Citrus, Mint", middle: "Sea Salt", base: "Amber" },
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300",
      contentCount: 8
    },
    {
      id: 3,
      name: "Midnight Musk",
      category: "Oriental",
      notes: { top: "Spice", middle: "Oud", base: "Musk, Vanilla" },
      image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300",
      contentCount: 15
    }
  ])

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
                <h1 className="text-xl font-bold">AI Marketing Agent</h1>
                <p className="text-sm text-gray-600">E N Trade LTD</p>
              </div>
            </Link>
            <nav className="flex gap-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
              <Link href="/generate" className="text-gray-600 hover:text-gray-900">Generate</Link>
              <Link href="/chat" className="text-gray-600 hover:text-gray-900">Chat</Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Products
            </h2>
            <p className="text-gray-600">Manage your perfume collection</p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all hover:scale-105">
            + Add New Product
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-medium text-gray-800">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>

                <div className="space-y-1 mb-4">
                  <div className="text-sm">
                    <span className="text-gray-600">Top:</span> <span className="text-gray-800">{product.notes.top}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Middle:</span> <span className="text-gray-800">{product.notes.middle}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Base:</span> <span className="text-gray-800">{product.notes.base}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    {product.contentCount} content items
                  </span>
                  <Link
                    href={`/generate?product=${product.id}`}
                    className="text-sm text-purple-600 font-semibold hover:text-purple-700"
                  >
                    Generate →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Ready to add your perfumes?</h3>
              <p className="text-gray-600 mb-4">
                Click "Add New Product" to create your first perfume entry. Then you can generate marketing content for it across all platforms!
              </p>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                  Add Product
                </button>
                <Link
                  href="/generate"
                  className="px-6 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-all"
                >
                  Generate Content
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 <strong>Demo Mode:</strong> These are sample products. Connect to the backend to manage your real product catalog!
          </p>
        </div>
      </main>
    </div>
  )
}
