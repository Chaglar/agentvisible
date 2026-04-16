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

// Demo Panel Component with Zero-to-Final Animation
function LiveDemoPanel() {
  // Brand rotation data as specified in Task 015
  const demos = [
    { url: 'stripe.com', modules: [92, 88, 71, 47, 85], score: 76, label: 'STRONG · top 25%' },
    { url: 'shopify.com', modules: [95, 84, 78, 89, 82], score: 85, label: 'STRONG · top 15%' },
    { url: 'notion.so', modules: [78, 65, 82, 42, 71], score: 67, label: 'MODERATE · top 50%' },
    { url: 'vercel.com', modules: [94, 91, 88, 85, 97], score: 91, label: 'EXCELLENT · top 5%' },
  ]

  const moduleNames = [
    'Structured data',
    'AI crawlability',
    'Content parseability',
    'Commerce protocols',
    'Agent discovery'
  ]

  const [currentBrand, setCurrentBrand] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  // Animated values - these count up from 0 to target
  const [moduleValues, setModuleValues] = useState([0, 0, 0, 0, 0])
  const [currentScore, setCurrentScore] = useState(0)
  const [showStatus, setShowStatus] = useState(false)
  const [showTopFix, setShowTopFix] = useState(false)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRefs = useRef<NodeJS.Timeout[]>([])

  const currentDemo = demos[currentBrand]

  // Count-up animation helper
  const animateCountUp = (
    setValue: (value: number) => void,
    targetValue: number,
    duration: number,
    delay: number = 0
  ) => {
    const timeoutId = setTimeout(() => {
      const steps = 30
      const increment = targetValue / steps
      let step = 0

      const interval = setInterval(() => {
        step++
        const newValue = Math.min(Math.round(increment * step), targetValue)
        setValue(newValue)

        if (step >= steps) {
          clearInterval(interval)
        }
      }, duration / steps)
    }, delay)

    timeoutRefs.current.push(timeoutId)
  }

  // Get status icon based on value
  const getStatusIcon = (value: number) => {
    if (value >= 75) return '✓'
    if (value >= 50) return '⚠'
    if (value > 0) return '✗'
    return ''
  }

  // Get status color based on value
  const getStatusColor = (value: number) => {
    if (value >= 75) return 'text-green-400'
    if (value >= 50) return 'text-yellow-400'
    if (value > 0) return 'text-red-400'
    return 'text-gray-dark-400'
  }

  // Main animation sequence
  const startAnimation = () => {
    if (isPaused) return

    // Clear any existing timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    timeoutRefs.current = []

    // Reset to zero state
    setIsAnimating(true)
    setModuleValues([0, 0, 0, 0, 0])
    setCurrentScore(0)
    setShowStatus(false)
    setShowTopFix(false)

    // Animate modules sequentially (0.5s delay between each)
    currentDemo.modules.forEach((targetValue, index) => {
      animateCountUp(
        (value) => setModuleValues(prev => {
          const newValues = [...prev]
          newValues[index] = value
          return newValues
        }),
        targetValue,
        1000, // 1 second duration
        500 + index * 500 // Start at 0.5s, then 1s, 1.5s, 2s, 2.5s
      )
    })

    // Animate gauge (starts at 5.5s)
    animateCountUp(setCurrentScore, currentDemo.score, 1500, 5500)

    // Show status at 7s
    const statusTimeout = setTimeout(() => {
      setShowStatus(true)
    }, 7000)
    timeoutRefs.current.push(statusTimeout)

    // Show top fix at 7.5s
    const topFixTimeout = setTimeout(() => {
      setShowTopFix(true)
    }, 7500)
    timeoutRefs.current.push(topFixTimeout)

    // Rotate to next brand at 10s
    const rotateTimeout = setTimeout(() => {
      if (!isPaused) {
        setCurrentBrand((prev) => (prev + 1) % demos.length)
      }
    }, 10000)
    timeoutRefs.current.push(rotateTimeout)
  }

  // Setup animation loop
  useEffect(() => {
    if (!isPaused) {
      startAnimation()
      intervalRef.current = setInterval(startAnimation, 10000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [isPaused, currentBrand])

  // Handle pause/resume
  useEffect(() => {
    if (isPaused && intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout))
    } else if (!isPaused && !intervalRef.current) {
      startAnimation()
      intervalRef.current = setInterval(startAnimation, 10000)
    }
  }, [isPaused])

  // Calculate gauge stroke offset
  const circumference = 2 * Math.PI * 32
  const gaugeOffset = circumference - (currentScore / 100) * circumference

  return (
    <div
      className="relative"
      style={{ height: '480px' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="absolute inset-0 bg-dark-3 border border-dark-5 rounded-xl overflow-hidden">
        <div className="absolute inset-0 p-6 flex flex-col gap-3">

          {/* Browser Chrome - 48px */}
          <div className="bg-dark-4 rounded-t-lg p-3 flex-shrink-0" style={{ height: '48px' }}>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow"></div>
                <span className="text-xs text-green-400 font-mono">LIVE</span>
              </div>
              <div className="text-xs text-slate-400 font-mono ml-4">
                agentvisible.ai/scan/{currentDemo.url}
              </div>
            </div>
          </div>

          {/* Terminal - 24px */}
          <div className="bg-black rounded-lg p-3 flex-shrink-0">
            <div className="text-green-400 text-sm font-mono">
              $ agentvisible scan {currentDemo.url}<span className="animate-pulse">_</span>
            </div>
          </div>

          {/* Module rows - Always visible, values animate from 0 */}
          <div className="flex-1 space-y-2">
            {moduleNames.map((name, index) => (
              <div key={index} className="flex justify-between items-center h-10">
                <span className="text-slate-300 text-sm">{name}</span>
                <div className="flex items-center gap-2">
                  {/* Progress bar track - always visible */}
                  <div className="w-20 bg-dark-5 rounded-full overflow-hidden" style={{ height: '6px' }}>
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        moduleValues[index] >= 75 ? 'bg-green-400' :
                        moduleValues[index] >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${moduleValues[index]}%` }}
                    />
                  </div>
                  {/* Status icon */}
                  <span className={`text-sm ${getStatusColor(moduleValues[index])}`}>
                    {getStatusIcon(moduleValues[index])}
                  </span>
                  {/* Score value */}
                  <span className="text-slate-400 text-sm font-mono w-12">{moduleValues[index]}/100</span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer with gauge - Always visible, values animate */}
          <div className="flex items-center gap-6 flex-shrink-0" style={{ height: '80px' }}>
            {/* Gauge */}
            <div className="relative" style={{ width: '96px', height: '96px' }}>
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                {/* Background circle - always visible */}
                <circle
                  cx="48"
                  cy="48"
                  r="32"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-dark-5"
                />
                {/* Progress arc - animates from 0 to score */}
                <circle
                  cx="48"
                  cy="48"
                  r="32"
                  stroke={currentScore >= 75 ? '#10b981' : currentScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={gaugeOffset}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1500ms ease-out, stroke 300ms ease-out'
                  }}
                />
              </svg>
              {/* Score text - always visible */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className={`text-2xl font-bold font-mono transition-colors duration-300 ${
                    currentScore >= 75 ? 'text-green-400' :
                    currentScore >= 50 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {currentScore}
                  </div>
                  <div className="text-xs text-slate-400">score</div>
                </div>
              </div>
            </div>

            {/* Results - Always visible but content fades in */}
            <div className="flex-1">
              <div className={`text-xl font-bold font-mono transition-all duration-300 ${
                showStatus ? 'opacity-100' : 'opacity-0'
              } ${
                currentScore >= 75 ? 'text-green-400' :
                currentScore >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {currentScore}/100 {showStatus ? currentDemo.label : 'SCANNING...'}
              </div>
              <div className={`text-sm text-slate-400 mt-1 transition-all duration-300 ${
                showTopFix ? 'opacity-100' : 'opacity-0'
              }`}>
                {showTopFix ? `Top fix: ${DEMO_BRANDS[currentBrand].topFix}` : ''}
              </div>
            </div>
          </div>
        </div>
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
                Is your website invisible to
                <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                  AI agents like ChatGPT?
                </span>
              </h1>

              <p className="text-xl text-dark-text-secondary mb-8 leading-relaxed max-w-2xl">
                Free scan in 30 seconds. Get a score out of 100 for AI agent visibility.
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

              {/* Trust indicators */}
              <div className="border-t border-dark-border pt-4 mb-4">
                <div className="flex flex-col gap-2 text-sm text-dark-text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    <span>1,247 sites scanned this week</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    <span>No signup required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    <span>Results in 30 seconds</span>
                  </div>
                </div>
              </div>

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


      <div className="h-10 bg-gradient-to-b from-dark to-dark-2"></div>

      {/* HOW IT WORKS - DARK */}
      <section className="bg-dark-1 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-16 tracking-tight-premium">
              How it works
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 bg-accent text-dark-1 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6">1</div>
                <h3 className="text-xl font-bold text-white mb-4">Enter your URL</h3>
                <p className="text-slate-300 leading-relaxed">Paste any website. We'll scan it live — no signup, no credit card, no waiting.</p>
              </div>

              <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 bg-secondary text-dark-1 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6">2</div>
                <h3 className="text-xl font-bold text-white mb-4">We check 5 categories</h3>
                <p className="text-slate-300 leading-relaxed">Structured data, AI crawlability, content parseability, commerce protocols, and agent discovery.</p>
              </div>

              <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200">
                <div className="w-12 h-12 bg-accent text-dark-1 rounded-xl flex items-center justify-center text-xl font-bold mx-auto mb-6">3</div>
                <h3 className="text-xl font-bold text-white mb-4">Get your score + fixes</h3>
                <p className="text-slate-300 leading-relaxed">A score out of 100, plus the top 3 fixes ranked by impact. Most fixes take under 30 minutes.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-10 bg-gradient-to-b from-dark-1 to-dark-2"></div>

      {/* WHAT WE CHECK - DARK */}
      <section className="bg-dark-2 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-16 tracking-tight-premium">
            What we check
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-accent">
              <h3 className="text-xl font-bold text-white mb-4">Structured Data</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">JSON-LD, OpenGraph, and metadata that AI agents can easily parse</p>
              <div className="text-sm font-mono text-teal-300">Weight: 30%</div>
            </div>

            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-secondary">
              <h3 className="text-xl font-bold text-white mb-4">AI Crawlability</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">robots.txt, AI policies, and crawling permissions</p>
              <div className="text-sm font-mono text-cyan-400">Weight: 20%</div>
            </div>

            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-accent">
              <h3 className="text-xl font-bold text-white mb-4">Content Parseability</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">Semantic HTML, heading structure, and content organization</p>
              <div className="text-sm font-mono text-teal-300">Weight: 15%</div>
            </div>

            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-secondary">
              <h3 className="text-xl font-bold text-white mb-4">Commerce Protocols</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">E-commerce APIs, payment schemas, and shopping integrations</p>
              <div className="text-sm font-mono text-cyan-400">Weight: 20%</div>
            </div>

            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200 border-l-4 border-l-accent lg:col-span-1 md:col-span-2 lg:col-start-2">
              <h3 className="text-xl font-bold text-white mb-4">Agent Discovery</h3>
              <p className="text-slate-300 mb-4 leading-relaxed">AI agent endpoints, RSS feeds, and discovery mechanisms</p>
              <div className="text-sm font-mono text-teal-300">Weight: 15%</div>
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

      <div className="h-10 bg-gradient-to-b from-dark-2 to-dark-2"></div>

      {/* PRICING - DARK */}
      <section className="bg-dark-2 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-16 tracking-tight-premium">
            Simple pricing
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200">
              <h3 className="text-xl font-bold text-white mb-2">Free Scan</h3>
              <div className="text-3xl font-bold text-white mb-4">$0</div>
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

            <div className="bg-dark-3 border border-accent rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-accent text-dark-1 px-3 py-1 rounded-full text-sm font-medium">Popular</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Pro Monitoring</h3>
              <div className="text-3xl font-bold text-white mb-1">$99<span className="text-lg text-slate-400">/month</span></div>
              <div className="text-sm text-slate-400 mb-4">Coming soon</div>
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

            <div className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 hover:-translate-y-0.5 transition-all duration-200">
              <h3 className="text-xl font-bold text-white mb-2">Agency</h3>
              <div className="text-3xl font-bold text-white mb-1">$299<span className="text-lg text-slate-400">/month</span></div>
              <div className="text-sm text-slate-400 mb-4">Coming soon</div>
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

      <div className="h-10 bg-gradient-to-b from-dark-2 to-dark-1"></div>

      {/* FAQ - DARK */}
      <section className="bg-dark-1 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl lg:text-5xl font-bold text-white text-center mb-16 tracking-tight-premium">
            Frequently asked questions
          </h2>

          <div className="max-w-3xl mx-auto space-y-6">
            <details className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 transition-all duration-200">
              <summary className="font-medium text-white cursor-pointer">What exactly does AgentVisible scan?</summary>
              <div className="mt-4 text-slate-300">
                We analyze 5 key areas: structured data (JSON-LD, schema markup), AI crawlability (robots.txt, permissions), content parseability (semantic HTML), commerce protocols (e-commerce APIs), and agent discovery features.
              </div>
            </details>

            <details className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 transition-all duration-200">
              <summary className="font-medium text-white cursor-pointer">How is this different from SEO tools?</summary>
              <div className="mt-4 text-slate-300">
                Traditional SEO focuses on human search engines. AgentVisible optimizes for AI agents that need structured, machine-readable data to understand and interact with your business.
              </div>
            </details>

            <details className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 transition-all duration-200">
              <summary className="font-medium text-white cursor-pointer">Is the free scan really free?</summary>
              <div className="mt-4 text-slate-300">
                Yes, completely free with no signup required. You get a full report with your score and actionable fixes. Pro plans add monitoring and advanced features.
              </div>
            </details>

            <details className="bg-dark-3 border border-dark-5 rounded-xl p-6 hover:border-dark-6 transition-all duration-200">
              <summary className="font-medium text-white cursor-pointer">What's coming in the Pro plan?</summary>
              <div className="mt-4 text-slate-300">
                Weekly automated rescans, score tracking over time, alerts when your score changes, and priority support. Launch expected Q2 2024.
              </div>
            </details>
          </div>
        </div>
      </section>

      <div className="h-10 bg-gradient-to-b from-dark-1 to-dark-2"></div>

      {/* CTA REPEAT - DARK */}
      <section className="bg-dark-2 py-20">
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
      <footer className="bg-dark-1 border-t border-dark-5 py-12">
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