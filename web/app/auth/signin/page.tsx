import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './signin-form'

export const metadata: Metadata = {
  title: 'Sign In - AgentVisible.ai',
  description: 'Sign in to your AgentVisible account to access Pro features and scan history.',
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-dark-1 text-white">
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <Link href="/" className="text-teal-400 hover:text-teal-300 text-sm">
            ← Back to AgentVisible.ai
          </Link>
        </div>

        <div className="bg-dark-3 border border-dark-5 rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Sign In</h1>
            <p className="text-gray-300">
              Enter your email to receive a magic link
            </p>
          </div>

          <SignInForm />

          <div className="mt-6 text-center text-sm text-gray-400">
            <p>
              Don't have an account? Sign up is automatic when you first sign in.
            </p>
            <p className="mt-2">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-teal-400 hover:text-teal-300">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-teal-400 hover:text-teal-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}