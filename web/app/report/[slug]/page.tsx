import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Types for the API responses (same as scan page)
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

// Server-side components for rendering the report
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

function ModuleCard({ module }: { module: ModuleResult }) {
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
            className={`h-2 rounded-full ${getScoreColor(module.score)}`}
            style={{ width: `${module.score}%` }}
          />
        </div>
      </div>

      <p className="text-gray-dark-300 text-sm mb-4">{module.summary}</p>

      {/* Always show all checks in report (not expandable) */}
      <div className="space-y-3">
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
    </div>
  )
}

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

// Generate metadata for SEO
export async function generateMetadata(
  { params }: { params: { slug: string } }
): Promise<Metadata> {
  try {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://agentvisible.ai/api/v1'
      : 'http://localhost:8000/api/v1'

    const response = await fetch(`${apiUrl}/report/${params.slug}`, {
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      return {
        title: 'Report Not Found - AgentVisible.ai',
        description: 'The requested scan report could not be found.',
      }
    }

    const data: APIResponse = await response.json()

    if (data.status !== 'ok' || !data.data) {
      return {
        title: 'Report Not Found - AgentVisible.ai',
        description: 'The requested scan report could not be found.',
      }
    }

    const scanResult = data.data
    const domain = new URL(scanResult.url).hostname.replace('www.', '')
    const score = Math.round(scanResult.overall_score)

    const description = `${domain} scored ${score}/100 on AI agent readiness. ${scanResult.rating} rating across structured data, crawlability, parseability, commerce protocols, and agent discovery.`

    return {
      title: `AgentVisible: ${domain} — Score: ${score}/100`,
      description,
      openGraph: {
        title: `AgentVisible: ${domain} — Score: ${score}/100`,
        description,
        images: [`/api/og/${params.slug}`],
        url: `https://agentvisible.ai/report/${params.slug}`,
        siteName: 'AgentVisible.ai',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `AgentVisible: ${domain} — Score: ${score}/100`,
        description,
        images: [`/api/og/${params.slug}`],
      },
    }
  } catch (error) {
    return {
      title: 'Report Not Found - AgentVisible.ai',
      description: 'The requested scan report could not be found.',
    }
  }
}

// Fetch scan result on the server
async function getScanResult(slug: string): Promise<ScanResult | null> {
  try {
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://agentvisible.ai/api/v1'
      : 'http://localhost:8000/api/v1'

    const response = await fetch(`${apiUrl}/report/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      return null
    }

    const data: APIResponse = await response.json()

    if (data.status === 'ok' && data.data) {
      return data.data
    }

    return null
  } catch (error) {
    console.error('Error fetching scan result:', error)
    return null
  }
}

export default async function ReportPage({
  params
}: {
  params: { slug: string }
}) {
  const scanResult = await getScanResult(params.slug)

  if (!scanResult) {
    notFound()
  }

  const domain = new URL(scanResult.url).hostname.replace('www.', '')
  const scannedDate = new Date(scanResult.scanned_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold mb-4">
            AI Agent Readiness Report
          </h1>
          <p className="text-xl text-accent font-mono mb-2">{domain}</p>
          <p className="text-gray-dark-400 text-sm">
            Scanned on {scannedDate}
          </p>
        </div>

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

        {/* Footer Actions */}
        <div className="text-center space-y-6">
          <div className="bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20 rounded-2xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-bold mb-4">Want to scan your own website?</h3>
            <p className="text-gray-dark-300 mb-6">
              Get your free AI agent readiness score in seconds.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-accent to-secondary text-background font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Scan Your Website Free
            </Link>
          </div>

          <div className="text-gray-dark-400 text-sm">
            <p>Powered by <Link href="/" className="text-accent hover:text-secondary transition-colors">AgentVisible.ai</Link></p>
            <p className="mt-1">Free AI Agent Readiness Scanner</p>
          </div>
        </div>
      </div>
    </main>
  )
}