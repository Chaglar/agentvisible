'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { authenticatedFetch } from '@/lib/api'

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [jwtDebugResult, setJwtDebugResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    const supabase = createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    setAuthState({
      session: !!session,
      user: session?.user?.email || null,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      error: error?.message
    })
  }

  const testCheckoutEndpoint = async () => {
    setLoading(true)
    try {
      const response = await authenticatedFetch('/api/v1/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          price_id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY,
        }),
      })

      const result = {
        status: response.status,
        statusText: response.statusText,
        data: null,
        error: null
      }

      try {
        result.data = await response.json()
      } catch (e) {
        result.error = 'Failed to parse JSON'
      }

      setTestResult(result)
    } catch (error) {
      setTestResult({
        status: 'Network Error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    setLoading(false)
  }

  const testJwtDebug = async () => {
    setLoading(true)
    try {
      const response = await authenticatedFetch('/api/v1/debug/jwt-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()
      setJwtDebugResult(result)
    } catch (error) {
      setJwtDebugResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Debug</h1>

        <div className="space-y-8">
          {/* Auth State */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
            <pre className="text-sm text-green-400 whitespace-pre-wrap">
              {JSON.stringify(authState, null, 2)}
            </pre>
            <button
              onClick={checkAuthState}
              className="mt-4 bg-blue-600 px-4 py-2 rounded"
            >
              Refresh Auth State
            </button>
          </div>

          {/* Test Checkout Endpoint */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Test Checkout Endpoint</h2>
            <button
              onClick={testCheckoutEndpoint}
              disabled={loading}
              className="bg-teal-600 px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Checkout API'}
            </button>

            {testResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Result:</h3>
                <pre className="text-sm text-yellow-400 whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* JWT Debug */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">JWT Token Debug</h2>
            <button
              onClick={testJwtDebug}
              disabled={loading}
              className="bg-red-600 px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Debug JWT Token'}
            </button>

            {jwtDebugResult && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">JWT Debug Result:</h3>
                <pre className="text-sm text-red-400 whitespace-pre-wrap">
                  {JSON.stringify(jwtDebugResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Quick Login */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-x-4">
              <button
                onClick={() => window.location.href = '/auth/signin'}
                className="bg-purple-600 px-4 py-2 rounded"
              >
                Go to Sign In
              </button>
              <button
                onClick={() => window.location.href = '/pricing'}
                className="bg-green-600 px-4 py-2 rounded"
              >
                Go to Pricing
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}