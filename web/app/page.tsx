'use client'

import { useState } from 'react'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) return

    setIsScanning(true)

    try {
      // TODO: Implement scan API call
      console.log('Scanning URL:', url)

      // Placeholder - will be implemented in future tasks
      setTimeout(() => {
        setIsScanning(false)
        alert('Scan functionality coming soon!')
      }, 2000)

    } catch (error) {
      console.error('Scan error:', error)
      setIsScanning(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Is Your Website
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              AI Agent Ready?
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Free scanner that analyzes your website's AI agent readiness.
            Get a score (0-100) and actionable fixes to optimize for AI discovery.
          </p>
        </div>

        {/* URL Scanner Form */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://yourwebsite.com"
                className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isScanning}
                required
              />

              <button
                type="submit"
                disabled={isScanning || !url.trim()}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isScanning ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          </form>

          {/* Features Preview */}
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Structured Data</h3>
              <p className="text-gray-600 text-sm">
                JSON-LD schema, OpenGraph tags, and metadata optimization
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">AI Crawlability</h3>
              <p className="text-gray-600 text-sm">
                robots.txt, AI bot policies, and sitemap accessibility
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Commerce Protocols</h3>
              <p className="text-gray-600 text-sm">
                E-commerce APIs, payment data, and shopping integrations
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}