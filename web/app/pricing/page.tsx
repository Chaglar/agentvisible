'use client'

import { useState } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

// This would be better handled with generateMetadata in App Router
// export const metadata: Metadata = {
//   title: 'Pricing - AgentVisible',
//   description: 'Choose the right plan for AI agent readiness monitoring. Free scans, Pro monitoring, and Agency white-label solutions.'
// }

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [waitlistEmail, setWaitlistEmail] = useState('')
  const [showWaitlistForm, setShowWaitlistForm] = useState(false)
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false)

  const handleWaitlistSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (waitlistEmail) {
      // In a real app, this would send to an API
      console.log('Waitlist signup:', waitlistEmail)
      setWaitlistSubmitted(true)
      setTimeout(() => {
        setShowWaitlistForm(false)
        setWaitlistSubmitted(false)
        setWaitlistEmail('')
      }, 2000)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:text-secondary transition-colors mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Choose Your <span className="text-accent">AI Readiness</span> Plan
          </h1>
          <p className="text-xl text-gray-dark-300 mb-8 max-w-3xl mx-auto">
            From free scans to enterprise monitoring, find the perfect fit for optimizing your AI agent visibility.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`${!isAnnual ? 'text-white' : 'text-gray-dark-400'} font-medium`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-accent' : 'bg-gray-dark-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`${isAnnual ? 'text-white' : 'text-gray-dark-400'} font-medium`}>
              Annual
            </span>
            {isAnnual && (
              <span className="bg-green-500 text-green-900 px-2 py-1 rounded-full text-xs font-bold">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">

          {/* Free Plan */}
          <div className="bg-gray-dark-800 border border-gray-dark-600 rounded-2xl p-8 relative">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Free Scan</h3>
              <div className="text-4xl font-bold mb-4">
                $0<span className="text-lg font-normal text-gray-dark-400">/forever</span>
              </div>
              <p className="text-gray-dark-300">Perfect for occasional scans and getting started</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">20 scans per hour</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Complete AI readiness report</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">5 AI module analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Actionable fix recommendations</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Shareable report links</span>
              </li>
            </ul>

            <Link
              href="/"
              className="w-full bg-gray-dark-700 hover:bg-gray-dark-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors text-center block"
            >
              Start Free Scan
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-dark-800 border-2 border-accent rounded-2xl p-8 relative">
            {/* Popular Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-accent text-background px-4 py-1 rounded-full text-sm font-bold">
                Most Popular
              </span>
            </div>

            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Pro Monitoring</h3>
              <div className="text-4xl font-bold mb-4">
                ${isAnnual ? '79' : '99'}
                <span className="text-lg font-normal text-gray-dark-400">/month</span>
              </div>
              <p className="text-gray-dark-300">For businesses serious about AI agent optimization</p>
              {isAnnual && (
                <p className="text-green-400 text-sm mt-2">$240 saved annually</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200"><strong>Unlimited scans</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Weekly automated monitoring</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Email alerts for score changes</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Historical trend analysis</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Priority customer support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">API access for integrations</span>
              </li>
            </ul>

            <button
              onClick={() => setShowWaitlistForm(true)}
              className="w-full bg-accent hover:bg-secondary text-background font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Join Waitlist
            </button>
          </div>

          {/* Agency Plan */}
          <div className="bg-gray-dark-800 border border-gray-dark-600 rounded-2xl p-8 relative">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Agency</h3>
              <div className="text-4xl font-bold mb-4">
                ${isAnnual ? '239' : '299'}
                <span className="text-lg font-normal text-gray-dark-400">/month</span>
              </div>
              <p className="text-gray-dark-300">White-label solution for agencies and consultants</p>
              {isAnnual && (
                <p className="text-green-400 text-sm mt-2">$720 saved annually</p>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200"><strong>Everything in Pro</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">White-label reports (your branding)</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Client dashboard management</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Custom domain support</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Bulk client onboarding</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-dark-200">Dedicated account manager</span>
              </li>
            </ul>

            <button
              onClick={() => setShowWaitlistForm(true)}
              className="w-full bg-gray-dark-700 hover:bg-gray-dark-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Contact Sales
            </button>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="space-y-6">
            <details className="bg-gray-dark-800 border border-gray-dark-600 rounded-xl p-6 hover:border-gray-dark-500 transition-colors">
              <summary className="font-medium text-white cursor-pointer">What makes AgentVisible different from traditional SEO tools?</summary>
              <div className="mt-4 text-gray-dark-300">
                Traditional SEO focuses on human search engines. AgentVisible optimizes for AI agents that need structured, machine-readable data to understand and interact with your business.
              </div>
            </details>

            <details className="bg-gray-dark-800 border border-gray-dark-600 rounded-xl p-6 hover:border-gray-dark-500 transition-colors">
              <summary className="font-medium text-white cursor-pointer">Is the free plan really unlimited?</summary>
              <div className="mt-4 text-gray-dark-300">
                The free plan includes 20 scans per hour with full reports and recommendations. This is perfect for getting started and occasional monitoring. For continuous monitoring, consider our Pro plan.
              </div>
            </details>

            <details className="bg-gray-dark-800 border border-gray-dark-600 rounded-xl p-6 hover:border-gray-dark-500 transition-colors">
              <summary className="font-medium text-white cursor-pointer">How does the AI readiness score work?</summary>
              <div className="mt-4 text-gray-dark-300">
                Our scoring analyzes 5 key areas: structured data, AI crawlability, content parseability, commerce protocols, and agent discovery. Each area contributes to your overall score (0-100) with actionable recommendations for improvement.
              </div>
            </details>

            <details className="bg-gray-dark-800 border border-gray-dark-600 rounded-xl p-6 hover:border-gray-dark-500 transition-colors">
              <summary className="font-medium text-white cursor-pointer">Can I change or cancel my plan anytime?</summary>
              <div className="mt-4 text-gray-dark-300">
                Yes! You can upgrade, downgrade, or cancel your subscription at any time. Changes take effect at your next billing cycle. See our <Link href="/refunds" className="text-accent hover:text-secondary">refund policy</Link> for more details.
              </div>
            </details>

            <details className="bg-gray-dark-800 border border-gray-dark-600 rounded-xl p-6 hover:border-gray-dark-500 transition-colors">
              <summary className="font-medium text-white cursor-pointer">Do you offer custom enterprise solutions?</summary>
              <div className="mt-4 text-gray-dark-300">
                Yes! For enterprises with specific needs, custom integrations, or higher volume requirements, we offer tailored solutions. Contact our sales team to discuss your requirements.
              </div>
            </details>

            <details className="bg-gray-dark-800 border border-gray-dark-600 rounded-xl p-6 hover:border-gray-dark-500 transition-colors">
              <summary className="font-medium text-white cursor-pointer">How secure is my website data?</summary>
              <div className="mt-4 text-gray-dark-300">
                We only scan publicly available information on your website. No private data is accessed or stored. All scan data is encrypted and stored securely. See our <Link href="/privacy" className="text-accent hover:text-secondary">privacy policy</Link> for full details.
              </div>
            </details>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20 py-16 border-t border-gray-dark-800">
          <h2 className="text-3xl font-bold mb-6">Ready to optimize for AI agents?</h2>
          <p className="text-xl text-gray-dark-300 mb-8">
            Start with a free scan and see where your website stands.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-secondary text-background font-semibold rounded-xl transition-colors text-lg"
          >
            Start Free Scan →
          </Link>
        </div>
      </div>

      {/* Waitlist Modal */}
      {showWaitlistForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-dark-800 border border-gray-dark-600 rounded-2xl p-8 max-w-md w-full">
            {!waitlistSubmitted ? (
              <>
                <h3 className="text-2xl font-bold mb-4">Join the Waitlist</h3>
                <p className="text-gray-dark-300 mb-6">
                  Be the first to know when Pro and Agency plans launch. We'll send you early access and special launch pricing.
                </p>
                <form onSubmit={handleWaitlistSubmit}>
                  <input
                    type="email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 bg-gray-dark-700 border border-gray-dark-600 rounded-lg text-white placeholder-gray-dark-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors mb-4"
                    required
                  />
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowWaitlistForm(false)}
                      className="flex-1 px-4 py-3 bg-gray-dark-700 hover:bg-gray-dark-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-accent hover:bg-secondary text-background font-semibold rounded-lg transition-colors"
                    >
                      Join Waitlist
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="text-green-400 text-4xl mb-4">✓</div>
                <h3 className="text-2xl font-bold mb-4">You're on the list!</h3>
                <p className="text-gray-dark-300">
                  We'll notify you as soon as Pro and Agency plans are available.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}