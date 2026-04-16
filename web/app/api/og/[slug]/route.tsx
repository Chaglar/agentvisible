import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    // Fetch scan result from API
    const apiUrl = process.env.NODE_ENV === 'production'
      ? 'https://agentvisible.ai/api/v1'
      : 'http://localhost:8000/api/v1'

    const response = await fetch(`${apiUrl}/report/${slug}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })

    if (!response.ok) {
      // Return a generic error image for 404 or other errors
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0a0e17',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <div style={{ fontSize: 48, color: '#ef4444', marginBottom: 20 }}>
              404
            </div>
            <div style={{ fontSize: 32, color: '#fff', marginBottom: 10 }}>
              Report Not Found
            </div>
            <div style={{ fontSize: 18, color: '#9ca3af' }}>
              Scanned by AgentVisible.ai
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      )
    }

    const data: APIResponse = await response.json()

    if (data.status !== 'ok' || !data.data) {
      throw new Error('Invalid scan result')
    }

    const scanResult = data.data
    const domain = new URL(scanResult.url).hostname.replace('www.', '')

    // Get score color
    const getScoreColor = (score: number) => {
      if (score >= 75) return '#10b981' // green-400
      if (score >= 50) return '#f59e0b' // yellow-400
      if (score >= 25) return '#f97316' // orange-400
      return '#ef4444' // red-400
    }

    const getRatingColor = (rating: string) => {
      switch (rating) {
        case 'Strong': return '#10b981'
        case 'Moderate': return '#f59e0b'
        case 'Weak': return '#f97316'
        case 'Critical': return '#ef4444'
        default: return '#9ca3af'
      }
    }

    // Module names mapping
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

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0e17',
            fontFamily: 'Inter, sans-serif',
            padding: 80,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 60 }}>
            <div>
              <div style={{ fontSize: 56, color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>
                {domain}
              </div>
              <div style={{ fontSize: 24, color: '#9ca3af' }}>
                AI Agent Readiness Report
              </div>
            </div>

            {/* Score circle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  border: `12px solid ${getScoreColor(scanResult.overall_score)}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ fontSize: 48, color: getScoreColor(scanResult.overall_score), fontWeight: 'bold' }}>
                  {Math.round(scanResult.overall_score)}
                </div>
                <div style={{ fontSize: 18, color: '#9ca3af' }}>
                  out of 100
                </div>
              </div>
              <div
                style={{
                  marginTop: 16,
                  padding: '8px 20px',
                  backgroundColor: getRatingColor(scanResult.rating),
                  color: '#0a0e17',
                  borderRadius: 20,
                  fontSize: 20,
                  fontWeight: 'bold',
                }}
              >
                {scanResult.rating}
              </div>
            </div>
          </div>

          {/* Module scores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 60 }}>
            {scanResult.modules.map((module, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 20, color: '#fff', fontWeight: '500', width: 280 }}>
                  {getModuleName(module.module)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 200,
                      height: 12,
                      backgroundColor: '#1f2937',
                      borderRadius: 6,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${module.score}%`,
                        height: '100%',
                        backgroundColor: getScoreColor(module.score),
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 20, color: getScoreColor(module.score), fontWeight: 'bold', width: 60 }}>
                    {Math.round(module.score)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 24, color: '#63ffd1', fontWeight: 'bold' }}>
              AgentVisible.ai
            </div>
            <div style={{ fontSize: 18, color: '#9ca3af' }}>
              Free AI Agent Readiness Scanner
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)

    // Return error image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0e17',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ fontSize: 48, color: '#ef4444', marginBottom: 20 }}>
            Error
          </div>
          <div style={{ fontSize: 32, color: '#fff', marginBottom: 10 }}>
            Unable to Generate Image
          </div>
          <div style={{ fontSize: 18, color: '#9ca3af' }}>
            Scanned by AgentVisible.ai
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  }
}

export const runtime = 'edge'