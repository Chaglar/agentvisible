'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Demo data for live animation
const DEMO_BRANDS = [
  {
    domain: 'stripe.com',
    score: 76,
    rating: 'Strong',
    modules: [
      { name: 'Structured Data', score: 92, status: 'pass' },
      { name: 'AI Crawlability', score: 88, status: 'pass' },
      { name: 'Content Parseability', score: 71, status: 'warn' },
      { name: 'Commerce Protocols', score: 47, status: 'fail' },
      { name: 'Agent Discovery', score: 85, status: 'pass' },
    ],
    topFix: 'enable MCP endpoints (+18 points)'
  },
  {
    domain: 'shopify.com',
    score: 82,
    rating: 'Strong',
    modules: [
      { name: 'Structured Data', score: 95, status: 'pass' },
      { name: 'AI Crawlability', score: 78, status: 'pass' },
      { name: 'Content Parseability', score: 84, status: 'pass' },
      { name: 'Commerce Protocols', score: 89, status: 'pass' },
      { name: 'Agent Discovery', score: 64, status: 'warn' },
    ],
    topFix: 'add AI plugin manifest (+12 points)'
  },
  {
    domain: 'notion.so',
    score: 64,
    rating: 'Moderate',
    modules: [
      { name: 'Structured Data', score: 71, status: 'warn' },
      { name: 'AI Crawlability', score: 82, status: 'pass' },
      { name: 'Content Parseability', score: 58, status: 'warn' },
      { name: 'Commerce Protocols', score: 23, status: 'fail' },
      { name: 'Agent Discovery', score: 88, status: 'pass' },
    ],
    topFix: 'improve semantic HTML (+16 points)'
  },
  {
    domain: 'vercel.com',
    score: 91,
    rating: 'Strong',
    modules: [
      { name: 'Structured Data', score: 89, status: 'pass' },
      { name: 'AI Crawlability', score: 94, status: 'pass' },
      { name: 'Content Parseability', score: 92, status: 'pass' },
      { name: 'Commerce Protocols', score: 76, status: 'pass' },
      { name: 'Agent Discovery', score: 95, status: 'pass' },
    ],
    topFix: 'optimize payment schema (+4 points)'
  },
  {
    domain: 'ooow.com.au',
    score: 58,
    rating: 'Moderate',
    modules: [
      { name: 'Structured Data', score: 78, status: 'pass' },
      { name: 'AI Crawlability', score: 44, status: 'fail' },
      { name: 'Content Parseability', score: 67, status: 'warn' },
      { name: 'Commerce Protocols', score: 72, status: 'pass' },
      { name: 'Agent Discovery', score: 29, status: 'fail' },
    ],
    topFix: 'update robots.txt (+22 points)'
  }
]

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

// Live Demo Panel Component
function LiveDemoPanel() {
  const [currentBrand, setCurrentBrand] = useState(0)
  const [animationPhase, setAnimationPhase] = useState<'loading' | 'scanning' | 'complete'>('loading')
  const [visibleModules, setVisibleModules] = useState<number>(0)
  const [isPaused, setIsPaused] = useState(false)
  const [showGauge, setShowGauge] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const brand = DEMO_BRANDS[currentBrand]

  useEffect(() => {
    const startAnimation = () => {
      if (isPaused) return

      setAnimationPhase('loading')
      setVisibleModules(0)
      setShowGauge(false)
      setShowResults(false)

      // Phase 1: Loading (0.8s)
      setTimeout(() => {
        if (isPaused) return
        setAnimationPhase('scanning')

        // Phase 2: Modules appear one by one (0.8s + 5*1.2s = 6.8s)
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            if (!isPaused) setVisibleModules(i + 1)
          }, i * 1200)
        }

        // Phase 3: Gauge animation (6s)
        setTimeout(() => {
          if (!isPaused) setShowGauge(true)
        }, 5200)

        // Phase 4: Results (7s)
        setTimeout(() => {
          if (!isPaused) {
            setShowResults(true)
            setAnimationPhase('complete')
          }
        }, 6200)

        // Phase 5: Next brand (12s)
        setTimeout(() => {
          if (!isPaused) {
            setCurrentBrand((prev) => (prev + 1) % DEMO_BRANDS.length)
          }
        }, 11200)
      }, 800)
    }

    if (!isPaused) {
      startAnimation()
      intervalRef.current = setInterval(startAnimation, 12000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPaused, currentBrand])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return '✓'
      case 'warn': return '⚠'
      case 'fail': return '✗'
      default: return '○'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'text-green-400'
      case 'warn': return 'text-yellow-400'
      case 'fail': return 'text-red-400'
      default: return 'text-gray-dark-400'
    }
  }

  return (
    <div
      className="bg-dark-secondary border border-dark-border rounded-2xl p-6 max-w-lg mx-auto lg:mx-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Browser Chrome */}
      <div className="bg-gray-dark-800 rounded-t-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></div>
            <span className="text-xs text-green-400 font-mono">LIVE</span>
          </div>
        </div>
        <div className="text-xs text-gray-dark-300 font-mono bg-gray-dark-900 px-3 py-1 rounded">
          agentvisible.ai/scan/{brand.domain}
        </div>
      </div>

      {/* Terminal */}
      <div className="bg-black rounded-lg p-4 mb-4 font-mono text-sm">
        <div className="text-green-400 mb-2">$ agentvisible scan {brand.domain}<span className="animate-pulse">_</span></div>

        {animationPhase !== 'loading' && (
          <div className="space-y-2">
            {brand.modules.slice(0, visibleModules).map((module, index) => (
              <div
                key={index}
                className={`flex justify-between items-center transition-all duration-300 ${
                  index < visibleModules ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ animationDelay: `${index * 1200}ms` }}
              >
                <span className="text-gray-dark-300">{module.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-dark-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        module.status === 'pass' ? 'bg-green-400' :
                        module.status === 'warn' ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{
                        width: `${module.score}%`,
                        animationDelay: `${index * 1200 + 400}ms`
                      }}
                    />
                  </div>
                  <span className={`text-sm ${getStatusColor(module.status)}`}>
                    {getStatusIcon(module.status)}
                  </span>
                  <span className="text-gray-dark-400 text-xs w-12">{module.score}/100</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-18 h-18">
          {showGauge && (
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 72 72">
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-dark-700"
              />
              <circle
                cx="36"
                cy="36"
                r="32"
                stroke={brand.score >= 75 ? '#10b981' : brand.score >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="6"
                fill="none"
                strokeDasharray="201"
                strokeDashoffset={201 - (brand.score / 100) * 201}
                strokeLinecap="round"
                className="transition-all duration-2000 ease-out"
              />
            </svg>
          )}
          {showGauge && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-lg font-bold font-mono ${
                  brand.score >= 75 ? 'text-green-400' :
                  brand.score >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {brand.score}
                </div>
                <div className="text-xs text-gray-dark-400">score</div>
              </div>
            </div>
          )}
        </div>

        {showResults && (
          <div className="flex-1 animate-fade-in-up">
            <div className={`text-lg font-bold ${
              brand.score >= 75 ? 'text-green-400' :
              brand.score >= 50 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {brand.score}/100 {brand.rating.toUpperCase()}
            </div>
            <div className="text-xs text-gray-dark-400 mt-1">
              Top fix: {brand.topFix}
            </div>
          </div>
        )}
      </div>

      {/* Live Badge */}
      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-dark-400">
        <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse-slow"></div>
        <span>live demo running</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([])
  const [isClickAnimating, setIsClickAnimating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setScanHistory(getScanHistory())
  }, [])

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setIsClickAnimating(true)
    setTimeout(() => setIsClickAnimating(false), 150)

    const encodedUrl = encodeURIComponent(url.trim())
    router.push(`/scan?url=${encodedUrl}`)
  }

  return (
    <main>
      {/* HERO SECTION - DARK */}
      <section className="bg-dark py-20 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark to-dark-secondary"></div>

        <div className="relative container mx-auto px-4">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></div>
            <span className="text-xs text-green-400 font-mono tracking-wide">live demo running</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-8 tracking-tight-premium">
                Can AI agents find
                <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  your business?
                </span>
              </h1>

              <p className="text-xl text-dark-text-secondary mb-8 leading-relaxed max-w-2xl">
                Get a score out of 100 and actionable insights to optimize for the future of search.
              </p>

              {/* URL Input */}
              <form onSubmit={handleScan} className="mb-6">
                <div className="relative">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-6 py-4 text-lg bg-dark-secondary border border-dark-border rounded-xl text-dark-text-primary placeholder-dark-text-secondary focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                    required
                  />
                  <button
                    type="submit"
                    disabled={!url.trim()}
                    className={`absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-accent to-secondary text-dark font-bold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                      isClickAnimating ? 'animate-scale-click' : ''
                    }`}
                  >
                    Scan free
                  </button>
                </div>
                <p className="text-sm text-dark-text-secondary mt-2">Press Enter to scan</p>
              </form>

              <p className="text-sm text-dark-text-secondary">
                <span className="text-secondary">46%</span> of websites score under 50
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <LiveDemoPanel />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <svg className="w-6 h-6 text-dark-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR - LIGHT */}
      <section className="bg-light-secondary py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
            <div className="text-sm text-light-text-secondary mb-4 md:mb-0">
              <span className="font-medium text-light-text-primary">Trusted by</span> innovative businesses
            </div>

            <div className="flex items-center gap-8 opacity-60">
              <div className="text-xs font-mono text-light-text-secondary">Shopify</div>
              <div className="text-xs font-mono text-light-text-secondary">Notion</div>
              <div className="text-xs font-mono text-light-text-secondary">Vercel</div>
              <div className="text-xs font-mono text-light-text-secondary">Stripe</div>
            </div>

            <div className="text-sm text-light-text-secondary">
              <span className="font-medium text-accent-dark">1,247</span> sites scanned this week
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS - LIGHT */}
      <section className="bg-light py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-light-text-primary mb-16 tracking-tight-premium">
              How it works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="w-12 h-12 bg-accent-dark text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-bold text-light-text-primary mb-4">Enter URL</h3>
                <p className="text-light-text-secondary leading-relaxed">Submit your website URL for comprehensive AI agent readiness analysis</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="w-12 h-12 bg-secondary-dark text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-bold text-light-text-primary mb-4">We scan 5 categories</h3>
                <p className="text-light-text-secondary leading-relaxed">Deep analysis across all AI agent readiness factors in seconds</p>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1">
                <div className="w-12 h-12 bg-accent-dark text-white rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-bold text-light-text-primary mb-4">Get score + fixes</h3>
                <p className="text-light-text-secondary leading-relaxed">Receive actionable recommendations to improve your AI visibility</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT WE CHECK - LIGHT */}
      <section className="bg-light py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-light-text-primary text-center mb-16 tracking-tight-premium">
            What we check
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-l-4 border-accent-dark">
              <h3 className="text-xl font-bold text-light-text-primary mb-4">Structured Data</h3>
              <p className="text-light-text-secondary mb-4 leading-relaxed">JSON-LD, OpenGraph, and metadata that AI agents can easily parse</p>
              <div className="text-sm font-mono text-accent-dark">Weight: 30%</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-l-4 border-secondary-dark">
              <h3 className="text-xl font-bold text-light-text-primary mb-4">AI Crawlability</h3>
              <p className="text-light-text-secondary mb-4 leading-relaxed">robots.txt, AI policies, and crawling permissions</p>
              <div className="text-sm font-mono text-secondary-dark">Weight: 20%</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-l-4 border-accent-dark">
              <h3 className="text-xl font-bold text-light-text-primary mb-4">Content Parseability</h3>
              <p className="text-light-text-secondary mb-4 leading-relaxed">Semantic HTML, heading structure, and content organization</p>
              <div className="text-sm font-mono text-accent-dark">Weight: 15%</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-l-4 border-secondary-dark">
              <h3 className="text-xl font-bold text-light-text-primary mb-4">Commerce Protocols</h3>
              <p className="text-light-text-secondary mb-4 leading-relaxed">E-commerce APIs, payment schemas, and shopping integrations</p>
              <div className="text-sm font-mono text-secondary-dark">Weight: 20%</div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 border-l-4 border-accent-dark lg:col-span-1 md:col-span-2 lg:col-start-2">
              <h3 className="text-xl font-bold text-light-text-primary mb-4">Agent Discovery</h3>
              <p className="text-light-text-secondary mb-4 leading-relaxed">AI agent endpoints, RSS feeds, and discovery mechanisms</p>
              <div className="text-sm font-mono text-accent-dark">Weight: 15%</div>
            </div>
          </div>
        </div>
      </section>

      {/* SEE A REAL REPORT - DARK */}
      <section className="bg-dark py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-dark-text-primary mb-8 tracking-tight-premium">
            See a real report
          </h2>
          <p className="text-xl text-dark-text-secondary mb-12 max-w-3xl mx-auto">
            Here's what your comprehensive AI agent readiness report looks like
          </p>

          <div className="max-w-4xl mx-auto bg-dark-secondary border border-dark-border rounded-2xl p-8">
            <div className="text-left">
              <div className="flex items-center gap-4 mb-8">
                <div className="relative w-16 h-16">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-gray-dark-700"/>
                    <circle cx="32" cy="32" r="28" stroke="#22d3ee" strokeWidth="4" fill="none" strokeDasharray="176" strokeDashoffset="44" strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-secondary font-mono">76</div>
                      <div className="text-xs text-dark-text-secondary">score</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-secondary">STRONG Rating</div>
                  <div className="text-dark-text-secondary">stripe.com • Scanned today</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-text-primary">Structured Data</span>
                    <span className="text-green-400 font-mono">92/100</span>
                  </div>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-dark-text-primary">Commerce Protocols</span>
                    <span className="text-yellow-400 font-mono">47/100</span>
                  </div>
                </div>
              </div>

              <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-accent text-dark rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <div>
                    <div className="font-medium text-dark-text-primary mb-1">Enable MCP endpoints</div>
                    <div className="text-sm text-dark-text-secondary">Add Model Context Protocol support for +18 points</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/report/stripe-com-example"
              className="inline-flex items-center gap-2 text-accent hover:text-secondary transition-colors"
            >
              View full example report
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* PRICING - LIGHT */}
      <section className="bg-light py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-light-text-primary text-center mb-16 tracking-tight-premium">
            Simple pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-light-border">
              <h3 className="text-xl font-bold text-light-text-primary mb-2">Free Scan</h3>
              <div className="text-3xl font-bold text-light-text-primary mb-4">$0</div>
              <ul className="space-y-3 text-light-text-secondary mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  One-time scan
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Full report with fixes
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Shareable results
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-accent-dark relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-accent-dark text-white px-3 py-1 rounded-full text-sm font-medium">Popular</span>
              </div>
              <h3 className="text-xl font-bold text-light-text-primary mb-2">Pro Monitoring</h3>
              <div className="text-3xl font-bold text-light-text-primary mb-1">$99<span className="text-lg text-light-text-secondary">/month</span></div>
              <div className="text-sm text-light-text-secondary mb-4">Coming soon</div>
              <ul className="space-y-3 text-light-text-secondary mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Weekly auto-scans
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Score tracking & alerts
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Priority support
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-light-border">
              <h3 className="text-xl font-bold text-light-text-primary mb-2">Agency</h3>
              <div className="text-3xl font-bold text-light-text-primary mb-1">$299<span className="text-lg text-light-text-secondary">/month</span></div>
              <div className="text-sm text-light-text-secondary mb-4">Coming soon</div>
              <ul className="space-y-3 text-light-text-secondary mb-6">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Multiple sites
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  White-label reports
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  API access
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ - LIGHT */}
      <section className="bg-light py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-light-text-primary text-center mb-16 tracking-tight-premium">
            Frequently asked questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <details className="bg-white p-6 rounded-lg shadow-sm">
              <summary className="font-medium text-light-text-primary cursor-pointer">What exactly does AgentVisible scan?</summary>
              <div className="mt-4 text-light-text-secondary">
                We analyze 5 key areas: structured data (JSON-LD, schema markup), AI crawlability (robots.txt, permissions), content parseability (semantic HTML), commerce protocols (e-commerce APIs), and agent discovery features.
              </div>
            </details>

            <details className="bg-white p-6 rounded-lg shadow-sm">
              <summary className="font-medium text-light-text-primary cursor-pointer">How is this different from SEO tools?</summary>
              <div className="mt-4 text-light-text-secondary">
                Traditional SEO focuses on human search engines. AgentVisible optimizes for AI agents that need structured, machine-readable data to understand and interact with your business.
              </div>
            </details>

            <details className="bg-white p-6 rounded-lg shadow-sm">
              <summary className="font-medium text-light-text-primary cursor-pointer">Is the free scan really free?</summary>
              <div className="mt-4 text-light-text-secondary">
                Yes, completely free with no signup required. You get a full report with your score and actionable fixes. Pro plans add monitoring and advanced features.
              </div>
            </details>

            <details className="bg-white p-6 rounded-lg shadow-sm">
              <summary className="font-medium text-light-text-primary cursor-pointer">What's coming in the Pro plan?</summary>
              <div className="mt-4 text-light-text-secondary">
                Weekly automated rescans, score tracking over time, alerts when your score changes, and priority support. Launch expected Q2 2024.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* CTA REPEAT - DARK */}
      <section className="bg-dark py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-dark-text-primary mb-8 tracking-tight-premium">
              Ready to see how AI agents view your website?
            </h2>

            <form onSubmit={handleScan} className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-8 py-6 text-xl bg-dark-secondary border border-dark-border rounded-2xl text-dark-text-primary placeholder-dark-text-secondary focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                  required
                />
                <button
                  type="submit"
                  disabled={!url.trim()}
                  className={`absolute right-3 top-3 px-8 py-3 bg-gradient-to-r from-accent to-secondary text-dark font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ${
                    isClickAnimating ? 'animate-scale-click' : ''
                  }`}
                >
                  Scan Free
                </button>
              </div>
            </form>

            <p className="text-dark-text-secondary">
              Free scan • No signup required • Results in 15 seconds
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER - DARK */}
      <footer className="bg-dark border-t border-dark-border py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-dark-text-primary mb-4">AgentVisible</h3>
                <p className="text-dark-text-secondary text-sm">
                  Making businesses discoverable to AI agents
                </p>
              </div>

              <div>
                <h4 className="font-medium text-dark-text-primary mb-3">Product</h4>
                <ul className="space-y-2 text-sm text-dark-text-secondary">
                  <li><Link href="/scan" className="hover:text-accent transition-colors">Free Scan</Link></li>
                  <li><span className="opacity-50">Pro Monitoring</span></li>
                  <li><span className="opacity-50">Agency Plan</span></li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-dark-text-primary mb-3">Resources</h4>
                <ul className="space-y-2 text-sm text-dark-text-secondary">
                  <li><span className="opacity-50">Documentation</span></li>
                  <li><span className="opacity-50">API Reference</span></li>
                  <li><span className="opacity-50">Blog</span></li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium text-dark-text-primary mb-3">Support</h4>
                <ul className="space-y-2 text-sm text-dark-text-secondary">
                  <li><span className="opacity-50">Help Center</span></li>
                  <li><span className="opacity-50">Contact</span></li>
                  <li><span className="opacity-50">Status</span></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-dark-border pt-8 text-center">
              <p className="text-dark-text-secondary text-sm">
                © 2024 AgentVisible.ai • Made for the AI agent future
              </p>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}