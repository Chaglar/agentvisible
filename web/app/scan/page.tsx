'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

// Types for the API responses
interface Check {
  name: string
  passed: boolean
  severity: 'critical' | 'warning' | 'info'
  detail: string
  fix_hint?: string
}

interface ModuleResult {
  module: string
  score: number
  weight: number
  checks: Check[]
  summary: string
}

interface ScanResult {
  url: string
  overall_score: number
  rating: 'Strong' | 'Moderate' | 'Weak' | 'Critical'
  modules: ModuleResult[]
  top_fixes: Check[]
  scanned_at: string
  report_slug: string
}

interface APIResponse {
  status: 'ok' | 'error'
  data?: ScanResult
  message?: string
  code?: string
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Score gauge skeleton */}
      <div className="text-center mb-12">
        <div className="w-48 h-48 bg-gray-dark-700 rounded-full mx-auto mb-4"></div>
        <div className="h-8 bg-gray-dark-700 rounded w-64 mx-auto mb-2"></div>
        <div className="h-6 bg-gray-dark-700 rounded w-48 mx-auto"></div>
      </div>

      {/* Module cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-gray-dark-800 p-6 rounded-2xl border border-gray-dark-700">
            <div className="h-6 bg-gray-dark-600 rounded mb-4"></div>
            <div className="h-4 bg-gray-dark-600 rounded mb-3 w-3/4"></div>
            <div className="h-3 bg-gray-dark-600 rounded w-full"></div>
          </div>
        ))}
      </div>

      {/* Top fixes skeleton */}
      <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700">
        <div className="h-8 bg-gray-dark-600 rounded w-64 mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="mb-6">
            <div className="h-6 bg-gray-dark-600 rounded mb-2"></div>
            <div className="h-4 bg-gray-dark-600 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Score gauge component
function ScoreGauge({ score, rating }: { score: number; rating: string }) {
  const getColor = (score: number) => {
    if (score >= 75) return 'text-green-400'
    if (score >= 50) return 'text-yellow-400'
    if (score >= 25) return 'text-orange-400'
    return 'text-red-400'
  }

  const getStrokeColor = (score: number) => {
    if (score >= 75) return '#10b981'
    if (score >= 50) return '#f59e0b'
    if (score >= 25) return '#f97316'
    return '#ef4444'
  }

  const circumference = 2 * Math.PI * 70
  const strokeDasharray = `${(score / 100) * circumference} ${circumference}`

  return (
    <div className="text-center mb-12">
      <div className="relative inline-block">
        <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="none"
            className="text-gray-dark-700"
          />
          <circle
            cx="80"
            cy="80"
            r="70"
            stroke={getStrokeColor(score)}
            strokeWidth="12"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-4xl font-bold font-mono ${getColor(score)}`}>{score.toFixed(0)}</div>
            <div className="text-sm text-gray-dark-400">out of 100</div>
          </div>
        </div>
      </div>
      <h2 className={`text-2xl font-bold mt-4 ${getColor(score)}`}>{rating} Rating</h2>
      <p className="text-gray-dark-400 mt-2">AI Agent Readiness Score</p>
    </div>
  )
}

// Severity badge component
function SeverityBadge({ severity }: { severity: string }) {
  const getColors = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'info':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${getColors(severity)}`}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  )
}

// Module card component
function ModuleCard({ module }: { module: ModuleResult }) {
  const [expanded, setExpanded] = useState(false)

  const getModuleName = (module: string) => {
    const names = {
      structured_data: 'Structured Data',
      ai_crawlability: 'AI Crawlability',
      content_parseability: 'Content Parseability',
      commerce_protocols: 'Commerce Protocols',
      agent_discovery: 'Agent Discovery'
    }
    return names[module as keyof typeof names] || module
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-400'
    if (score >= 50) return 'bg-yellow-400'
    if (score >= 25) return 'bg-orange-400'
    return 'bg-red-400'
  }

  const passedChecks = module.checks.filter(check => check.passed).length
  const totalChecks = module.checks.length

  return (
    <div className="bg-gray-dark-800 p-6 rounded-2xl border border-gray-dark-700">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold">{getModuleName(module.module)}</h3>
        <span className="text-sm font-mono text-accent">{(module.weight * 100).toFixed(0)}%</span>
      </div>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>{module.score.toFixed(0)}/100</span>
          <span className="text-gray-dark-400">{passedChecks}/{totalChecks} checks passed</span>
        </div>
        <div className="w-full bg-gray-dark-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${getScoreColor(module.score)}`}
            style={{ width: `${module.score}%` }}
          />
        </div>
      </div>

      <p className="text-gray-dark-300 text-sm mb-4">{module.summary}</p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-accent hover:text-secondary text-sm font-medium transition-colors"
      >
        {expanded ? 'Hide Details' : 'Show Details'} ({totalChecks} checks)
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {module.checks.map((check, index) => (
            <div key={index} className="border-t border-gray-dark-700 pt-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{check.passed ? '✅' : '❌'}</span>
                  <span className="font-medium">{check.name}</span>
                </div>
                <SeverityBadge severity={check.severity} />
              </div>
              <p className="text-sm text-gray-dark-300 mb-2">{check.detail}</p>
              {!check.passed && check.fix_hint && (
                <div className="bg-gray-dark-900 p-3 rounded-lg">
                  <p className="text-xs text-accent mb-1">💡 How to fix:</p>
                  <p className="text-sm text-gray-dark-300">{check.fix_hint}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Top fixes component
function TopFixes({ fixes }: { fixes: Check[] }) {
  if (fixes.length === 0) return null

  return (
    <div className="bg-gray-dark-800 p-8 rounded-2xl border border-gray-dark-700 mb-12">
      <h2 className="text-2xl font-bold mb-6">🔥 Top 3 Priority Fixes</h2>

      <div className="space-y-6">
        {fixes.map((fix, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-accent text-background rounded-full flex items-center justify-center font-bold">
              {index + 1}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold">{fix.name}</h3>
                <SeverityBadge severity={fix.severity} />
              </div>
              <p className="text-gray-dark-300 mb-3">{fix.detail}</p>
              {fix.fix_hint && (
                <div className="bg-gray-dark-900 p-4 rounded-lg">
                  <h4 className="text-accent font-medium mb-2">How to fix:</h4>
                  <p className="text-sm text-gray-dark-300">{fix.fix_hint}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ScanPage() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareButtonText, setShareButtonText] = useState('Share Report')

  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams?.get('url')

  useEffect(() => {
    if (url && !scanResult && !isLoading) {
      performScan(url)
    }
  }, [url, scanResult, isLoading])

  const performScan = async (targetUrl: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
      })

      const data: APIResponse = await response.json()

      if (data.status === 'ok' && data.data) {
        setScanResult(data.data)
        // Update URL without page reload
        const newUrl = `/scan?url=${encodeURIComponent(targetUrl)}`
        window.history.replaceState({}, '', newUrl)
      } else {
        setError(data.message || 'Scan failed. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    if (!scanResult) return

    const reportUrl = `${window.location.origin}/report/${scanResult.report_slug}`

    try {
      await navigator.clipboard.writeText(reportUrl)
      setShareButtonText('Copied!')
      setTimeout(() => setShareButtonText('Share Report'), 2000)
    } catch (err) {
      // Fallback for older browsers
      setShareButtonText(reportUrl)
      setTimeout(() => setShareButtonText('Share Report'), 3000)
    }
  }

  const retryScans = () => {
    if (url) {
      performScan(url)
    }
  }

  if (!url) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No URL provided</h1>
          <p className="text-gray-dark-400 mb-8">Please provide a URL to scan.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-accent text-background font-bold rounded-lg hover:bg-secondary transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            Scanning <span className="text-accent font-mono">{url}</span>
          </h1>
          {isLoading && (
            <p className="text-gray-dark-400">
              Analyzing your website's AI agent readiness... (~15 seconds)
            </p>
          )}
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSkeleton />}

        {/* Error State */}
        {error && (
          <div className="text-center">
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 mb-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-red-400 mb-4">Scan Failed</h2>
              <p className="text-gray-dark-300 mb-6">{error}</p>
              <div className="space-x-4">
                <button
                  onClick={retryScans}
                  className="px-6 py-3 bg-accent text-background font-bold rounded-lg hover:bg-secondary transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-6 py-3 bg-gray-dark-700 text-white font-bold rounded-lg hover:bg-gray-dark-600 transition-colors"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {scanResult && !isLoading && (
          <div>
            {/* Score Gauge */}
            <ScoreGauge score={scanResult.overall_score} rating={scanResult.rating} />

            {/* Top Fixes */}
            <TopFixes fixes={scanResult.top_fixes} />

            {/* Module Cards */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-8 text-center">Detailed Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scanResult.modules.map((module, index) => (
                  <ModuleCard key={index} module={module} />
                ))}
              </div>
            </div>

            {/* Share and CTA */}
            <div className="text-center space-y-6">
              <button
                onClick={handleShare}
                className="px-8 py-4 bg-gray-dark-700 text-white font-bold rounded-lg hover:bg-gray-dark-600 transition-colors"
              >
                {shareButtonText}
              </button>

              <div className="bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20 rounded-2xl p-8 max-w-2xl mx-auto">
                <h3 className="text-xl font-bold mb-4">Monitor Weekly Progress</h3>
                <p className="text-gray-dark-300 mb-6">
                  Track improvements over time, get alerts for new issues, and access advanced optimization features.
                </p>
                <button className="px-8 py-3 bg-gradient-to-r from-accent to-secondary text-background font-bold rounded-lg hover:shadow-lg transition-all">
                  Pro Plan - $99/mo (Coming Soon)
                </button>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => router.push('/')}
                  className="text-accent hover:text-secondary transition-colors"
                >
                  ← Scan Another Website
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}