import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Authentication Error - AgentVisible.ai',
  description: 'An error occurred during authentication.',
}

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-dark-1 text-white">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-dark-3 border border-red-500/30 rounded-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2 text-red-500">Authentication Error</h1>
            <p className="text-gray-300">
              Sorry, we couldn't sign you in. The authentication link may have expired or been used already.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/auth/signin"
              className="block w-full bg-teal-400 text-dark-1 py-2 px-4 rounded-lg hover:bg-teal-300 font-medium transition-colors"
            >
              Try signing in again
            </Link>

            <Link
              href="/"
              className="block w-full bg-transparent border border-dark-5 text-white py-2 px-4 rounded-lg hover:bg-dark-4 transition-colors"
            >
              Back to home
            </Link>
          </div>

          <div className="mt-6 text-sm text-gray-400">
            <p>
              If you continue having issues, please contact{' '}
              <a href="mailto:support@agentvisible.ai" className="text-teal-400 hover:text-teal-300">
                support@agentvisible.ai
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}