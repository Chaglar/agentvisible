import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - AgentVisible',
  description: 'Privacy policy and data handling practices for AgentVisible AI readiness scanner.'
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-dark-1">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors mb-6"
          >
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold mb-4 text-white">Privacy Policy</h1>
          <p className="text-gray-dark-400">Last updated: April 17, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8">

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">1. Information We Collect</h2>

              <h3 className="text-xl font-semibold mb-3 text-white">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Website URLs you submit for scanning</li>
                <li>IP addresses and browser information</li>
                <li>Usage patterns and scan frequency</li>
                <li>Scan results and analysis data</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3 mt-6 text-white">Voluntarily Provided Information</h3>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Email addresses (for subscriptions and notifications)</li>
                <li>Payment information (processed by Stripe)</li>
                <li>Support inquiries and feedback</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">2. How We Use Your Information</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use the collected information to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Provide website scanning and analysis services</li>
                <li>Improve our AI models and scanning accuracy</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send service updates and notifications (opt-in only)</li>
                <li>Provide customer support</li>
                <li>Prevent abuse and maintain security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">3. Data Storage and Security</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Your data is stored securely using industry-standard practices:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Data encrypted in transit and at rest</li>
                <li>Hosted on secure cloud infrastructure (Supabase/AWS)</li>
                <li>Regular security audits and monitoring</li>
                <li>Access limited to authorized personnel only</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">4. Data Sharing and Third Parties</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li><strong>Service providers:</strong> Stripe (payments), Supabase (database), Vercel (hosting)</li>
                <li><strong>Analytics:</strong> Aggregated, anonymized usage data for service improvements</li>
                <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">5. Cookies and Tracking</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use minimal cookies for:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Essential functionality (scan history, preferences)</li>
                <li>Analytics (anonymous usage patterns)</li>
                <li>No advertising or cross-site tracking</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">6. Data Retention</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We retain data as follows:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Scan results: 12 months for free users, indefinitely for subscribers</li>
                <li>Account information: Until account deletion</li>
                <li>Payment data: As required for tax and legal purposes</li>
                <li>Analytics data: Aggregated and anonymized indefinitely</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">7. Your Rights</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your scan data</li>
                <li>Opt out of marketing communications</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                Contact us at <a href="mailto:privacy@agentvisible.ai" className="text-teal-400 hover:text-teal-300">privacy@agentvisible.ai</a> to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">8. International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our services are hosted in the United States. By using AgentVisible, you consent to the transfer of your information to the US, which may have different data protection laws than your country.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">9. Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">10. Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We may update this privacy policy from time to time. We will notify users of significant changes via email or service notifications.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-white">11. Contact Us</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                For privacy-related questions or concerns, contact us at:
              </p>
              <div className="text-gray-300">
                <p>Email: <a href="mailto:privacy@agentvisible.ai" className="text-teal-400 hover:text-teal-300">privacy@agentvisible.ai</a></p>
                <p className="mt-2">
                  AgentVisible<br />
                  Privacy Officer<br />
                  [Address to be updated]
                </p>
              </div>
            </section>

          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-16 pt-8 border-t border-dark-5">
          <div className="flex justify-between items-center">
            <Link
              href="/terms"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              ← Terms of Service
            </Link>
            <Link
              href="/refunds"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Refund Policy →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}