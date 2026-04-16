'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Simple scan history interface
interface ScanHistoryItem {
  url: string
  score: number
  rating: string
  timestamp: number
  report_slug: string
}

// Utility functions
function getScanHistory(): ScanHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem('agentvisible_scan_history')
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  return `${days} day${days > 1 ? 's' : ''} ago`
}

// Icon components for the 5 categories
function StructuredDataIcon() {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function CrawlabilityIcon() {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  )
}

function ParseabilityIcon() {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function CommerceIcon() {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
    </svg>
  )
}

function AgentDiscoveryIcon() {
  return (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  )
}

// Score gauge preview component
function ScoreGaugePreview() {
  return (
    <div className="relative w-32 h-32 mx-auto mb-6">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-gray-dark-800"
        />
        <circle
          cx="64"
          cy="64"
          r="56"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={`${65 * 3.5} ${100 * 3.5}`}
          className="text-accent"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-accent font-mono">65</div>
          <div className="text-xs text-gray-dark-400">Score</div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const router = useRouter()

  useEffect(() => {
    setScanHistory(getScanHistory())
  }, [])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) return

    // Navigate to scan page with URL parameter
    const encodedUrl = encodeURIComponent(url.trim())
    router.push(`/scan?url=${encodedUrl}`)
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-gray-dark-900"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-8">
              Can AI Agents Find
              <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                Your Business?
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-dark-300 mb-12 max-w-3xl mx-auto">
              Free scanner that reveals if your website is ready for AI agent discovery.
              Get actionable insights to optimize for the future of search.
            </p>

            {/* Massive URL Input */}
            <form onSubmit={handleScan} className="max-w-2xl mx-auto mb-16">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-8 py-6 text-xl bg-gray-dark-800 border border-gray-dark-700 rounded-2xl text-white placeholder-gray-dark-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="absolute right-3 top-3 px-8 py-3 bg-gradient-to-r from-accent to-secondary text-background font-bold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                >
                  Scan Free
                </button>
              </div>
            </form>

            {/* Score Preview */}
            <div className="inline-block">
              <ScoreGaugePreview />
              <p className="text-sm text-gray-dark-400 font-mono">Live example score</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-t border-gray-dark-800">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Most websites score under <span className="text-accent font-mono">45</span>
          </h2>
          <p className="text-xl text-gray-dark-300 mb-8">Where do you stand?</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-red-400 font-mono mb-2">23%</div>
              <div className="text-gray-dark-400">Sites score 75+ (Strong)</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-orange-400 font-mono mb-2">31%</div>
              <div className="text-gray-dark-400">Sites score 50-74 (Moderate)</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary font-mono mb-2">46%</div>
              <div className="text-gray-dark-400">Sites score under 50 (Weak)</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-r from-gray-dark-900 to-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-16">How It Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent text-background rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold mb-2">Enter URL</h3>
                <p className="text-gray-dark-300">Submit your website URL for comprehensive analysis</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-secondary text-background rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold mb-2">We Scan 5 Categories</h3>
                <p className="text-gray-dark-300">Deep analysis across all AI agent readiness factors</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-accent text-background rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-bold mb-2">Get Score + Fixes</h3>
                <p className="text-gray-dark-300">Receive actionable recommendations to improve</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Category Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
            5 Categories We Analyze
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700 hover:border-accent transition-colors group">
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform">
                <StructuredDataIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Structured Data</h3>
              <p className="text-gray-dark-300">JSON-LD, OpenGraph, and metadata that AI agents can easily parse</p>
              <div className="mt-4 text-sm font-mono text-accent">Weight: 30%</div>
            </div>

            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700 hover:border-accent transition-colors group">
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform">
                <CrawlabilityIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Crawlability</h3>
              <p className="text-gray-dark-300">robots.txt, AI policies, and crawling permissions</p>
              <div className="mt-4 text-sm font-mono text-accent">Weight: 20%</div>
            </div>

            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700 hover:border-accent transition-colors group">
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform">
                <ParseabilityIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Content Parseability</h3>
              <p className="text-gray-dark-300">Semantic HTML, heading structure, and content organization</p>
              <div className="mt-4 text-sm font-mono text-accent">Weight: 15%</div>
            </div>

            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700 hover:border-accent transition-colors group">
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform">
                <CommerceIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Commerce Protocols</h3>
              <p className="text-gray-dark-300">E-commerce APIs, payment schemas, and shopping integrations</p>
              <div className="mt-4 text-sm font-mono text-accent">Weight: 20%</div>
            </div>

            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700 hover:border-accent transition-colors group lg:col-span-1 md:col-span-2 lg:col-start-2">
              <div className="text-accent mb-4 group-hover:scale-110 transition-transform">
                <AgentDiscoveryIcon />
              </div>
              <h3 className="text-xl font-bold mb-3">Agent Discovery</h3>
              <p className="text-gray-dark-300">AI agent endpoints, RSS feeds, and discovery mechanisms</p>
              <div className="mt-4 text-sm font-mono text-accent">Weight: 15%</div>
            </div>
          </div>
        </div>
      </section>

      {/* Competitor Invisible */}
      <section className="py-20 bg-gradient-to-r from-gray-dark-900 to-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Your competitors are invisible too —{' '}
            <span className="text-accent">for now</span>
          </h2>
          <p className="text-xl text-gray-dark-300 mb-12 max-w-3xl mx-auto">
            The AI agent revolution is just beginning. Most businesses aren't prepared.
            Get ahead while there's still time to secure your competitive advantage.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700">
              <h3 className="text-2xl font-bold mb-4 text-red-400">The Problem</h3>
              <ul className="text-left space-y-3 text-gray-dark-300">
                <li>• AI agents can't find your business</li>
                <li>• Your data isn't machine-readable</li>
                <li>• You're invisible to the future of search</li>
                <li>• Competitors will capture AI traffic</li>
              </ul>
            </div>

            <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700">
              <h3 className="text-2xl font-bold mb-4 text-accent">The Solution</h3>
              <ul className="text-left space-y-3 text-gray-dark-300">
                <li>• Optimize for AI agent discovery</li>
                <li>• Structure your data correctly</li>
                <li>• Get found by future search</li>
                <li>• Stay ahead of the competition</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Repeat */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-8">
              Ready to see how AI agents view your website?
            </h2>

            <form onSubmit={handleScan} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-8 py-6 text-xl bg-gray-dark-800 border border-gray-dark-700 rounded-2xl text-white placeholder-gray-dark-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  required
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className="absolute right-3 top-3 px-8 py-3 bg-gradient-to-r from-accent to-secondary text-background font-bold rounded-xl hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                >
                  Scan Free
                </button>
              </div>
            </form>

            <p className="mt-6 text-gray-dark-400">
              Free scan • No signup required • Results in 15 seconds
            </p>

            {/* Recent Scans */}
            {scanHistory.length > 0 && (
              <div className="mt-12 max-w-2xl mx-auto">
                <h3 className="text-lg font-bold mb-4">Recent Scans</h3>
                <div className="space-y-2">
                  {scanHistory.slice(0, 3).map((item, index) => (
                    <button
                      key={index}
                      onClick={() => router.push(`/report/${item.report_slug}`)}
                      className="flex items-center justify-between w-full bg-gray-dark-800 p-3 rounded-lg hover:bg-gray-dark-700 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{item.url}</span>
                        <span className={`text-sm px-2 py-1 rounded ${
                          item.score >= 75 ? 'bg-green-500/20 text-green-400' :
                          item.score >= 50 ? 'bg-yellow-500/20 text-yellow-400' :
                          item.score >= 25 ? 'bg-orange-500/20 text-orange-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {item.score}/100
                        </span>
                      </div>
                      <span className="text-sm text-gray-dark-400">{getTimeAgo(item.timestamp)}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-dark-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-dark-400">
            © 2024 AgentVisible.ai • Made for the AI agent future
          </p>
        </div>
      </footer>
    </main>
  )
}