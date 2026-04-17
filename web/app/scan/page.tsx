'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ScanResultPanel from '../../components/ScanResultPanel'
import { authenticatedFetch } from '@/lib/api'

// Utility functions for scan history and progress
function getScanHistory(): ScanHistoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const history = localStorage.getItem('agentvisible_scan_history')
    return history ? JSON.parse(history) : []
  } catch {
    return []
  }
}

function saveScanToHistory(scan: EnhancedScanResult) {
  if (typeof window === 'undefined') return
  try {
    const history = getScanHistory()
    const domain = new URL(scan.url).hostname.replace('www.', '')

    const newItem: ScanHistoryItem = {
      url: domain,
      score: Math.round(scan.overall_score),
      rating: scan.rating,
      timestamp: Date.now(),
      report_slug: scan.report_slug
    }

    // Remove existing entry for same domain
    const filtered = history.filter(item => item.url !== domain)

    // Add new entry at the beginning
    const updated = [newItem, ...filtered].slice(0, 5) // Keep only last 5

    localStorage.setItem('agentvisible_scan_history', JSON.stringify(updated))
  } catch (error) {
    console.warn('Failed to save scan history:', error)
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

// Module names for progress display
const MODULE_NAMES = {
  structured_data: 'Structured Data',
  ai_crawlability: 'AI Crawlability',
  content_parseability: 'Content Parseability',
  commerce_protocols: 'Commerce Protocols',
  agent_discovery: 'Agent Discovery'
}

// Types for the API responses
interface Check {
  name: string
  passed: boolean
  severity: 'critical' | 'warning' | 'info'
  detail: string
  fix_hint?: string
  effort_estimate?: string
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

interface EnhancedScanResult extends ScanResult {
  ai_summary?: string
  industry_benchmark?: {
    average: number
    top10: number
  }
  social_share?: {
    twitter: string
    linkedin: string
  }
  competitor_suggestions?: string[]
}

interface APIResponse {
  status: 'ok' | 'error'
  data?: EnhancedScanResult
  message?: string
  code?: string
}

interface ScanHistoryItem {
  url: string
  score: number
  rating: string
  timestamp: number
  report_slug: string
}

interface ModuleProgress {
  name: string
  status: 'waiting' | 'scanning' | 'done'
  score?: number
}

interface Explanations {
  modules: Record<string, string>
  checks: Record<string, string>
}


// Scan history component
function ScanHistory({ onSelectScan }: { onSelectScan: (url: string) => void }) {
  const [history, setHistory] = useState<ScanHistoryItem[]>([])

  useEffect(() => {
    setHistory(getScanHistory())
  }, [])

  if (history.length === 0) return null

  return (
    <div className="max-w-2xl mx-auto mt-8 mb-8">
      <h3 className="text-lg font-bold mb-4">Recent Scans</h3>
      <div className="space-y-2">
        {history.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-gray-dark-800 p-3 rounded-lg hover:bg-gray-dark-700 transition-colors cursor-pointer"
            onClick={() => onSelectScan(`https://${item.url}`)}
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
          </div>
        ))}
      </div>
    </div>
  )
}

// Tooltip component
function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-10">
          <div className="bg-gray-dark-900 text-white text-sm p-3 rounded-lg shadow-lg max-w-xs">
            {text}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-dark-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// AI Summary component
function AISummary({ summary }: { summary: string }) {
  return (
    <div className="bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20 rounded-2xl p-6 mb-12 max-w-4xl mx-auto">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="text-accent">🤖</span>
        Plain English Summary
      </h3>
      <p className="text-gray-dark-200 leading-relaxed">{summary}</p>
    </div>
  )
}

// Industry benchmark component
function IndustryBenchmark({ score, benchmark }: { score: number; benchmark: { average: number; top10: number } }) {
  const userPosition = Math.min((score / 100) * 100, 100)
  const avgPosition = (benchmark.average / 100) * 100
  const top10Position = (benchmark.top10 / 100) * 100

  return (
    <div className="bg-gray-dark-800 p-6 rounded-2xl border border-gray-dark-700 mb-12 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4 text-center">Industry Benchmark</h3>

      <div className="relative mb-4">
        <div className="w-full bg-gray-dark-600 rounded-full h-3 relative overflow-hidden">
          {/* User position */}
          <div
            className="absolute top-0 w-1 h-full bg-accent z-10"
            style={{ left: `${userPosition}%` }}
          />

          {/* Average marker */}
          <div
            className="absolute top-0 w-1 h-full bg-yellow-400 z-10"
            style={{ left: `${avgPosition}%` }}
          />

          {/* Top 10% marker */}
          <div
            className="absolute top-0 w-1 h-full bg-green-400 z-10"
            style={{ left: `${top10Position}%` }}
          />

          {/* Background gradient */}
          <div className="w-full h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-30"></div>
        </div>

        <div className="flex justify-between text-sm mt-2 text-gray-dark-400">
          <span>0</span>
          <span>Industry Average: {benchmark.average}</span>
          <span>Your Score: {Math.round(score)}</span>
          <span>Top 10%: {benchmark.top10}</span>
          <span>100</span>
        </div>
      </div>

      <div className="text-center">
        {score > benchmark.top10 ? (
          <p className="text-green-400">🎉 You're in the top 10% of your industry!</p>
        ) : score > benchmark.average ? (
          <p className="text-accent">📈 You're above industry average!</p>
        ) : (
          <p className="text-orange-400">📊 Room to improve - you're below industry average</p>
        )}
      </div>
    </div>
  )
}

// Social share buttons
function SocialShare({ shareText }: { shareText: { twitter: string; linkedin: string } }) {
  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.twitter)}`
    window.open(url, '_blank')
  }

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://agentvisible.ai')}&summary=${encodeURIComponent(shareText.linkedin)}`
    window.open(url, '_blank')
  }

  return (
    <div className="flex gap-4 justify-center">
      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
        Share on Twitter
      </button>

      <button
        onClick={handleLinkedInShare}
        className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
        Share on LinkedIn
      </button>
    </div>
  )
}

// Competitor scan CTA
function CompetitorCTA({ suggestions, onScanCompetitor }: { suggestions: string[]; onScanCompetitor: (url: string) => void }) {
  return (
    <div className="bg-gray-dark-800 p-6 rounded-2xl border border-gray-dark-700 mb-12 max-w-2xl mx-auto text-center">
      <h3 className="text-xl font-bold mb-4">How does your competitor compare?</h3>
      <p className="text-gray-dark-300 mb-6">Get ahead by seeing how others in your industry stack up</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {suggestions.map((url, index) => (
          <button
            key={index}
            onClick={() => onScanCompetitor(`https://${url}`)}
            className="px-4 py-2 bg-gray-dark-700 hover:bg-accent hover:text-background rounded-lg transition-colors text-sm"
          >
            {url}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-dark-400">or scan any other competitor</p>
    </div>
  )
}

// Badge embed code
function BadgeEmbed({ reportSlug }: { reportSlug: string }) {
  const [copied, setCopied] = useState(false)

  const badgeCode = `<a href="https://agentvisible.ai/report/${reportSlug}">
  <img src="https://agentvisible.ai/api/v1/badge/${reportSlug}" alt="AgentVisible Score" />
</a>`

  const copyCode = () => {
    navigator.clipboard.writeText(badgeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-gray-dark-800 p-6 rounded-2xl border border-gray-dark-700 mb-12 max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4">Embed Your Score Badge</h3>
      <p className="text-gray-dark-300 mb-4">Show off your AI readiness score on your website:</p>

      <div className="bg-gray-dark-900 p-4 rounded-lg mb-4">
        <code className="text-sm text-gray-dark-200 block whitespace-pre-wrap font-mono">{badgeCode}</code>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={copyCode}
          className="px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-secondary transition-colors"
        >
          {copied ? 'Copied!' : 'Copy Code'}
        </button>

        <img
          src={`/api/v1/badge/${reportSlug}`}
          alt="Score Badge Preview"
          className="h-5"
        />
      </div>
    </div>
  )
}

// Email capture component
function EmailCapture() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    // TODO: Save email to database
    console.log('Email captured:', email)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center py-8">
        <p className="text-accent">✅ Thanks! We'll keep you updated on AI agent standards.</p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-gray-dark-800 to-gray-dark-700 p-6 rounded-2xl border border-gray-dark-600 mb-12 max-w-2xl mx-auto text-center">
      <h3 className="text-lg font-bold mb-2">Stay Ahead of AI Standards</h3>
      <p className="text-gray-dark-300 mb-4 text-sm">
        Get notified when AI agent standards change — we'll tell you how it affects your score.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 px-4 py-2 bg-gray-dark-900 border border-gray-dark-600 rounded-lg text-white placeholder-gray-dark-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors text-sm"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-accent text-background font-medium rounded-lg hover:bg-secondary transition-colors text-sm"
        >
          Subscribe
        </button>
      </form>

      <p className="text-xs text-gray-dark-500 mt-2">No spam, unsubscribe anytime</p>
    </div>
  )
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
function ModuleCard({ module, explanations }: { module: ModuleResult; explanations?: Explanations }) {
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
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{getModuleName(module.module)}</h3>
          {explanations?.modules[module.module] && (
            <Tooltip text={explanations.modules[module.module]}>
              <span className="text-gray-dark-400 hover:text-accent cursor-help text-sm">ℹ️</span>
            </Tooltip>
          )}
        </div>
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{check.name}</span>
                    {explanations?.checks[check.name] && (
                      <Tooltip text={explanations.checks[check.name]}>
                        <span className="text-gray-dark-400 hover:text-accent cursor-help text-xs">ℹ️</span>
                      </Tooltip>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={check.severity} />
                  {!check.passed && check.effort_estimate && (
                    <span className="text-xs px-2 py-1 bg-gray-dark-700 text-gray-dark-300 rounded">
                      {check.effort_estimate}
                    </span>
                  )}
                </div>
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

// Convert API response to ScanResultPanel format
function convertToScanPanelData(result: EnhancedScanResult) {
  const modules = {
    structured_data: 0,
    ai_crawlability: 0,
    content_parseability: 0,
    commerce_protocols: 0,
    agent_discovery: 0
  }

  result.modules.forEach(module => {
    const key = module.module as keyof typeof modules
    if (key in modules) {
      modules[key] = Math.round(module.score)
    }
  })

  const status = `${result.rating.toUpperCase()} · ${getStatusSuffix(result.overall_score)}`
  const topFix = result.top_fixes[0] ?
    `Top fix: ${result.top_fixes[0].name.toLowerCase()} (+${estimatePoints(result.top_fixes[0])} points)` :
    'No major fixes needed'

  return { modules, status, topFix }
}

// Convert progress data to ScanResultPanel format for loading state
function convertProgressToScanPanelData(progress: ModuleProgress[], url: string) {
  const moduleMap: { [key: string]: keyof typeof modules } = {
    'Structured data': 'structured_data',
    'AI crawlability': 'ai_crawlability',
    'Content parseability': 'content_parseability',
    'Commerce protocols': 'commerce_protocols',
    'Agent discovery': 'agent_discovery'
  }

  const modules = {
    structured_data: 0,
    ai_crawlability: 0,
    content_parseability: 0,
    commerce_protocols: 0,
    agent_discovery: 0
  }

  // Fill in completed module scores, leave others at 0 for animation
  progress.forEach(module => {
    const key = moduleMap[module.name]
    if (key && module.status === 'done' && module.score !== undefined) {
      modules[key] = module.score
    }
  })

  // Calculate partial score based on completed modules
  const completedCount = progress.filter(m => m.status === 'done').length
  const totalCount = progress.length || 5
  const partialScore = Math.round((completedCount / totalCount) * 75) // Estimate

  const status = completedCount === totalCount ? 'ANALYSIS COMPLETE' : 'ANALYZING...'
  const topFix = completedCount === totalCount ? 'Analysis complete' : `Scanning... ${completedCount}/${totalCount} modules`

  return { modules, status, topFix, score: partialScore }
}

function getStatusSuffix(score: number) {
  if (score >= 90) return 'top 5%'
  if (score >= 75) return 'top 25%'
  if (score >= 50) return 'top 50%'
  return 'needs improvement'
}

function estimatePoints(fix: Check) {
  switch (fix.severity) {
    case 'critical': return Math.floor(Math.random() * 10) + 15 // 15-25 points
    case 'warning': return Math.floor(Math.random() * 8) + 8   // 8-15 points
    case 'info': return Math.floor(Math.random() * 5) + 3      // 3-8 points
    default: return 10
  }
}

// Enhanced error handling types
interface ScanError {
  type: 'rate_limit' | 'server_error' | 'timeout' | 'invalid_url' | 'network_error'
  message: string
  statusCode?: number
  retryAfter?: number
}

function ScanPageContent() {
  const [scanResult, setScanResult] = useState<EnhancedScanResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ScanError | null>(null)
  const [shareButtonText, setShareButtonText] = useState('Share Report')
  const [progress, setProgress] = useState<ModuleProgress[]>([])
  const [explanations, setExplanations] = useState<Explanations | null>(null)
  const [showComparisonInput, setShowComparisonInput] = useState(false)
  const [comparisonUrl, setComparisonUrl] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const hasScannedRef = useRef(false)

  const handleCheckout = async (priceId: string, scanUrl?: string) => {
    setIsCheckingOut(true)

    try {
      const response = await authenticatedFetch('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: priceId,
          scan_url: scanUrl,
        }),
      })

      if (response.status === 401) {
        // User not logged in — redirect to signin with checkout intent
        const checkoutType = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY ? 'pro' : 'pdf'
        window.location.href = `/auth/signin?redirect=${encodeURIComponent(`/pricing?checkout=${checkoutType}`)}`
        return
      }

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.detail?.includes('already have an active Pro subscription')) {
          alert('✅ You already have an active Pro subscription! Just sign in to access unlimited scans.')
          window.location.href = '/auth/signin?redirect=/'
          return
        }
        throw new Error('Failed to create checkout session')
      }

      const data = await response.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams?.get('url')

  useEffect(() => {
    if (hasScannedRef.current) return
    if (url && !scanResult && !isLoading) {
      console.log('SCAN FIRED for URL:', url)
      hasScannedRef.current = true
      performScan(url)
    }
  }, [url])

  useEffect(() => {
    // Load explanations on mount
    fetchExplanations()
  }, [])

  useEffect(() => {
    // Cleanup progress interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const fetchExplanations = async () => {
    try {
      const response = await fetch('/api/v1/explanations')
      const data = await response.json()
      if (data.status === 'ok') {
        setExplanations(data.data)
      }
    } catch (error) {
      console.warn('Failed to fetch explanations:', error)
    }
  }

  const simulateProgress = () => {
    // Initialize progress state
    const modules = Object.keys(MODULE_NAMES).map(key => ({
      name: MODULE_NAMES[key as keyof typeof MODULE_NAMES],
      status: 'waiting' as const
    }))
    setProgress(modules)

    let currentModuleIndex = 0

    const updateProgress = () => {
      setProgress(prev => {
        const updated = [...prev]

        // Mark current module as scanning
        if (currentModuleIndex < updated.length) {
          updated[currentModuleIndex] = {
            ...updated[currentModuleIndex],
            status: 'scanning'
          }
        }

        // Move to next module every 3 seconds
        if (currentModuleIndex > 0) {
          updated[currentModuleIndex - 1] = {
            ...updated[currentModuleIndex - 1],
            status: 'done',
            score: Math.floor(Math.random() * 40) + 30 // Random score for demo
          }
        }

        return updated
      })

      currentModuleIndex++
      if (currentModuleIndex >= modules.length + 1) {
        clearInterval(progressIntervalRef.current!)
      }
    }

    // Start progress simulation
    progressIntervalRef.current = setInterval(updateProgress, 3000)
    updateProgress() // Start immediately
  }

  const performScan = async (targetUrl: string) => {
    setIsLoading(true)
    setError(null)
    setScanResult(null)

    // Start progress simulation
    simulateProgress()

    try {
      // Create timeout controller
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 45000) // 45 second timeout

      const response = await authenticatedFetch('/api/v1/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: targetUrl }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      const data: APIResponse = await response.json()

      if (data.status === 'ok' && data.data) {
        setScanResult(data.data)
        saveScanToHistory(data.data)

        // Clear progress interval
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
        }

        // Complete all modules in progress
        setProgress(prev => prev.map(module => ({
          ...module,
          status: 'done' as const,
          score: data.data?.modules.find(m => MODULE_NAMES[m.module as keyof typeof MODULE_NAMES] === module.name)?.score || 0
        })))

        // Update URL without page reload
        const newUrl = `/scan?url=${encodeURIComponent(targetUrl)}`
        window.history.replaceState({}, '', newUrl)
      } else {
        // Determine error type based on response
        const errorType: ScanError['type'] = (() => {
          if (data.code === 'RATE_LIMIT' || response.status === 429) {
            return 'rate_limit'
          }
          if (response.status >= 500) {
            return 'server_error'
          }
          if (data.code === 'TIMEOUT' || data.message?.toLowerCase().includes('timeout')) {
            return 'timeout'
          }
          return 'invalid_url'
        })()

        setError({
          type: errorType,
          message: data.message || 'Scan failed',
          statusCode: response.status,
          retryAfter: response.status === 429 ? 3600 : undefined
        })
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError({
          type: 'timeout',
          message: 'Scan timed out after 45 seconds',
          statusCode: undefined
        })
      } else {
        setError({
          type: 'network_error',
          message: 'Network error. Please check your connection and try again.',
          statusCode: undefined
        })
      }
    } finally {
      setIsLoading(false)

      // Clear progress interval on error too
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
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
      hasScannedRef.current = false
      setError(null)
      performScan(url)
    }
  }

  const handleSelectHistoryScan = (historicalUrl: string) => {
    const encodedUrl = encodeURIComponent(historicalUrl)
    router.push(`/scan?url=${encodedUrl}`)
  }

  const handleScanCompetitor = (competitorUrl: string) => {
    const encodedUrl = encodeURIComponent(competitorUrl)
    router.push(`/scan?url=${encodedUrl}`)
  }

  const handleCompareSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (comparisonUrl.trim()) {
      // For now, just navigate to scan the comparison URL
      // In a full implementation, this would open a side-by-side view
      handleScanCompetitor(comparisonUrl.trim())
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

  // Enhanced error handling component
  const renderErrorState = () => {
    if (!error) return null

    const getErrorConfig = (error: ScanError) => {
      switch (error.type) {
        case 'rate_limit':
          return {
            icon: (
              <svg className="w-12 h-12 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ),
            heading: 'You have hit the free scan limit',
            body: 'Free plan includes 10 scans per hour. If you already have a Pro account, just sign in. Otherwise, view Pro plans for unlimited scans.',
            primaryCTA: {
              text: 'View Pro Plans',
              href: '/auth/signin?redirect=/pricing',
              action: null,
              disabled: false
            },
            secondaryCTA: {
              text: 'Sign In',
              href: '/auth/signin?redirect=/',
              action: null,
              disabled: false
            }
          }

        case 'server_error':
          return {
            icon: (
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            heading: 'Something went wrong on our end',
            body: 'Our scanner is having trouble right now. This is not your fault.',
            primaryCTA: {
              text: 'Try again',
              action: () => retryScans(),
              disabled: false
            },
            secondaryCTA: {
              text: 'Report this issue',
              href: 'mailto:support@agentvisible.ai?subject=Scan%20Error&body=Error%20details:%20' + encodeURIComponent(error.message),
              action: null,
              disabled: false
            }
          }

        case 'timeout':
          return {
            icon: (
              <svg className="w-12 h-12 text-amber-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            heading: 'This scan is taking longer than expected',
            body: 'The website you entered may be slow to respond or blocking our scanner.',
            primaryCTA: {
              text: 'Try a different website',
              action: () => router.push('/'),
              disabled: false
            },
            secondaryCTA: {
              text: 'Wait 30 more seconds',
              action: () => {
                hasScannedRef.current = false
                setError(null)
                performScan(url)
              },
              disabled: false
            }
          }

        case 'network_error':
          return {
            icon: (
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            heading: 'Something went wrong on our end',
            body: 'Our scanner is having trouble right now. This is not your fault.',
            primaryCTA: {
              text: 'Try again',
              action: () => retryScans(),
              disabled: false
            },
            secondaryCTA: {
              text: 'Report this issue',
              href: 'mailto:support@agentvisible.ai?subject=Network%20Error&body=Error%20details:%20' + encodeURIComponent(error.message),
              action: null,
              disabled: false
            }
          }

        case 'invalid_url':
        default:
          return {
            icon: (
              <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ),
            heading: 'We could not scan this website',
            body: 'The site may be down, blocking crawlers, or not a real website. Double-check the URL and try again.',
            primaryCTA: {
              text: 'Try another URL',
              action: () => router.push('/'),
              disabled: false
            },
            secondaryCTA: {
              text: 'What sites can you scan?',
              href: '/faq',
              action: null,
              disabled: false
            }
          }
      }
    }

    const config = getErrorConfig(error)

    return (
      <div className="max-w-lg mx-auto mb-12">
        <div className="bg-gray-dark-800 border border-gray-dark-600 rounded-2xl p-8 text-center">
          {config.icon}

          <h2 className="text-2xl font-bold mb-3">
            {config.heading}
          </h2>

          <p className="text-base text-gray-dark-300 mb-8 max-w-md mx-auto">
            {config.body}
          </p>

          <div className="space-y-3">
            {config.primaryCTA.href ? (
              <Link
                href={config.primaryCTA.href}
                className="block w-full px-6 py-3 bg-accent text-background font-bold rounded-lg hover:bg-secondary transition-colors"
              >
                {config.primaryCTA.text}
              </Link>
            ) : (
              <button
                onClick={config.primaryCTA.action || undefined}
                disabled={config.primaryCTA.disabled}
                className="w-full px-6 py-3 bg-accent text-background font-bold rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {config.primaryCTA.text}
              </button>
            )}

            {config.secondaryCTA.href ? (
              <Link
                href={config.secondaryCTA.href}
                className="block w-full px-6 py-3 bg-transparent text-gray-dark-300 font-medium rounded-lg hover:text-white transition-colors"
              >
                {config.secondaryCTA.text}
              </Link>
            ) : (
              <button
                onClick={config.secondaryCTA.action || undefined}
                disabled={config.secondaryCTA.disabled}
                className="w-full px-6 py-3 bg-transparent text-gray-dark-300 font-medium rounded-lg hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {config.secondaryCTA.text}
              </button>
            )}
          </div>
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
              Analyzing your website's AI agent readiness... (~30 seconds)
            </p>
          )}
        </div>

        {/* Scan History (show when not loading) */}
        {!isLoading && !error && !scanResult && (
          <ScanHistory onSelectScan={handleSelectHistoryScan} />
        )}

        {/* Loading State */}
        {isLoading && (
          <>
            {progress.length > 0 ? (
              <div className="mb-12 max-w-lg mx-auto">
                <ScanResultPanel
                  url={url || ''}
                  modules={convertProgressToScanPanelData(progress, url || '').modules}
                  score={convertProgressToScanPanelData(progress, url || '').score}
                  status={convertProgressToScanPanelData(progress, url || '').status}
                  topFix={convertProgressToScanPanelData(progress, url || '').topFix}
                  animate={true}
                  isLive={false}
                />
              </div>
            ) : (
              <LoadingSkeleton />
            )}
          </>
        )}

        {/* Error State */}
        {renderErrorState()}

        {/* Results */}
        {scanResult && !isLoading && !error && (
          <div>
            {/* Scan Result Panel - Same as Hero Demo */}
            <div className="mb-12 max-w-lg mx-auto">
              <ScanResultPanel
                url={scanResult.url}
                modules={convertToScanPanelData(scanResult).modules}
                score={Math.round(scanResult.overall_score)}
                status={convertToScanPanelData(scanResult).status}
                topFix={convertToScanPanelData(scanResult).topFix}
                animate={false}
                isLive={false}
              />
            </div>

            {/* AI Summary */}
            {scanResult.ai_summary && <AISummary summary={scanResult.ai_summary} />}

            {/* Industry Benchmark */}
            {scanResult.industry_benchmark && (
              <IndustryBenchmark score={scanResult.overall_score} benchmark={scanResult.industry_benchmark} />
            )}

            {/* Top Fixes */}
            <TopFixes fixes={scanResult.top_fixes} />

            {/* PDF Report CTA */}
            <div className="mt-8 p-6 bg-dark-3 border border-dark-5 rounded-xl text-center">
              <h3 className="text-lg font-medium text-white mb-2">
                Get the full report as PDF
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Detailed breakdown, fix instructions, and shareable format. Delivered to your email.
              </p>
              <button
                onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PDF!, scanResult.url)}
                disabled={isCheckingOut}
                className="bg-teal-400 text-dark-1 px-6 py-3 rounded-lg font-medium hover:bg-teal-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? 'Processing...' : 'Buy PDF Report — $29'}
              </button>
            </div>

            {/* Module Cards */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-8 text-center">Detailed Analysis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scanResult.modules.map((module, index) => (
                  <ModuleCard key={index} module={module} explanations={explanations || undefined} />
                ))}
              </div>
            </div>

            {/* Social Share */}
            {scanResult.social_share && (
              <div className="text-center mb-12">
                <h3 className="text-lg font-bold mb-4">Share Your Score</h3>
                <SocialShare shareText={scanResult.social_share} />
              </div>
            )}

            {/* Badge Embed */}
            <BadgeEmbed reportSlug={scanResult.report_slug} />

            {/* Competitor CTA */}
            {scanResult.competitor_suggestions && (
              <CompetitorCTA
                suggestions={scanResult.competitor_suggestions}
                onScanCompetitor={handleScanCompetitor}
              />
            )}

            {/* Email Capture */}
            <EmailCapture />

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
                <div className="space-y-4">
                  <button className="px-8 py-3 bg-gradient-to-r from-accent to-secondary text-background font-bold rounded-lg hover:shadow-lg transition-all">
                    Pro Plan - $99/mo (Coming Soon)
                  </button>
                  <div className="flex justify-center">
                    <button
                      onClick={() => performScan(url!)}
                      className="text-accent hover:text-secondary transition-colors font-medium"
                    >
                      🔄 Rescan Now (Free)
                    </button>
                  </div>
                </div>
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

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-1 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  )
}