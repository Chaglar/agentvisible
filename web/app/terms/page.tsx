import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - AgentVisible',
  description: 'Terms of service and user agreement for AgentVisible AI readiness scanner.'
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-accent hover:text-secondary transition-colors mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-dark-400">Last updated: April 17, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8">

            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                By accessing and using AgentVisible ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                AgentVisible is an AI readiness scanner that analyzes websites and provides scores and recommendations for AI agent compatibility. We offer:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Free website scans (up to 20 per hour)</li>
                <li>Pro subscription ($99/month) with unlimited scans and monitoring</li>
                <li>Agency subscription ($299/month) with white-label features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. User Responsibilities</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Provide accurate information when using our service</li>
                <li>Not abuse or overload our scanning infrastructure</li>
                <li>Only scan websites you own or have permission to scan</li>
                <li>Not attempt to reverse engineer or circumvent our security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Rate Limits and Usage</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                Free users are limited to 20 scans per hour. Excessive usage may result in temporary or permanent account restrictions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Payment and Subscriptions</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                Paid subscriptions are billed monthly in advance. Cancellations take effect at the end of the current billing period. No refunds are provided for partial months.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Data and Privacy</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                We collect and process data in accordance with our <Link href="/privacy" className="text-accent hover:text-secondary">Privacy Policy</Link>. Scan data is stored for improving our service but is not shared with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Disclaimers</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                AgentVisible provides analysis and recommendations "as is" without warranties. We are not responsible for decisions made based on our scan results.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                Our liability is limited to the amount paid for our service in the 12 months preceding any claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Termination</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                We may terminate or suspend access to our service for violations of these terms or for any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Changes to Terms</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                For questions about these terms, contact us at: <a href="mailto:legal@agentvisible.ai" className="text-accent hover:text-secondary">legal@agentvisible.ai</a>
              </p>
            </section>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-gray-dark-700">
          <div className="flex justify-between items-center">
            <Link
              href="/privacy"
              className="text-accent hover:text-secondary transition-colors"
            >
              Privacy Policy →
            </Link>
            <Link
              href="/refunds"
              className="text-accent hover:text-secondary transition-colors"
            >
              Refund Policy →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}