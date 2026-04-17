'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  return (
    <div className="min-h-screen bg-dark-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-dark-3 border border-dark-5 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-teal-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-white mb-3">Payment successful</h1>
        <p className="text-gray-300 mb-8">
          Thank you for your purchase. You'll receive a confirmation email shortly.
        </p>
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-teal-400 text-dark-1 py-3 rounded-lg font-medium hover:bg-teal-300 transition"
          >
            Scan another site
          </Link>
          <Link
            href="/dashboard"
            className="block w-full border border-dark-5 text-gray-300 py-3 rounded-lg hover:border-dark-6 transition"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-1" />}>
      <SuccessContent />
    </Suspense>
  )
}