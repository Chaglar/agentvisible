import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Refund Policy - AgentVisible',
  description: 'Refund and cancellation policy for AgentVisible AI readiness scanner subscriptions.'
}

export default function RefundsPage() {
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
          <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
          <p className="text-gray-dark-400">Last updated: April 17, 2026</p>
        </div>

        {/* Content */}
        <div className="prose prose-invert prose-lg max-w-none">
          <div className="space-y-8">

            <section>
              <h2 className="text-2xl font-bold mb-4">1. General Refund Policy</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                AgentVisible operates on a subscription basis with the following refund terms:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li><strong>No refunds</strong> for partial subscription periods</li>
                <li><strong>7-day trial period</strong> available for first-time Pro and Agency subscribers</li>
                <li><strong>Cancellation anytime</strong> with access until the end of the current billing period</li>
                <li><strong>Exception-based refunds</strong> may be considered for technical issues on our end</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Trial Period</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                New users can try Pro and Agency plans with a 7-day trial:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Full access to all features during trial</li>
                <li>Cancel anytime during trial with no charge</li>
                <li>Automatic billing starts after trial ends</li>
                <li>One trial per customer</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Subscription Cancellation</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                You can cancel your subscription at any time:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Cancel through your account dashboard</li>
                <li>Contact support at <a href="mailto:support@agentvisible.ai" className="text-accent hover:text-secondary">support@agentvisible.ai</a></li>
                <li>Cancellation takes effect at the end of the current billing cycle</li>
                <li>No partial refunds for remaining time in the billing period</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Service Issues and Credits</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                If our service experiences significant downtime or technical issues:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>We may provide service credits for affected periods</li>
                <li>Credits are applied to future billing cycles</li>
                <li>Credits cannot be exchanged for cash</li>
                <li>Downtime must exceed 4 hours to qualify for credits</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Exceptional Circumstances</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                Refunds may be considered in exceptional cases:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Major service functionality failures</li>
                <li>Billing errors on our end</li>
                <li>Duplicate charges</li>
                <li>Unauthorized transactions</li>
              </ul>
              <p className="text-gray-dark-300 leading-relaxed mt-4">
                Each case is reviewed individually. Contact support with documentation of the issue.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Free Plan</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                The free plan includes:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>20 scans per hour</li>
                <li>Basic scan reports</li>
                <li>No payment required</li>
                <li>No refund issues as no payment is collected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Payment Processing</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                All payments are processed by Stripe:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Secure, PCI-compliant payment processing</li>
                <li>AgentVisible does not store your payment information</li>
                <li>Refunds (when approved) are processed through Stripe</li>
                <li>Refunds typically appear within 5-10 business days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Upgrade and Downgrade Policy</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                Plan changes work as follows:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li><strong>Upgrades:</strong> Take effect immediately with prorated billing</li>
                <li><strong>Downgrades:</strong> Take effect at the next billing cycle</li>
                <li>No refunds for unused premium features when downgrading</li>
                <li>Data retention policies apply when downgrading to free plan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Dispute Resolution</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                For billing disputes:
              </p>
              <ul className="list-disc list-inside text-gray-dark-300 space-y-2 ml-4">
                <li>Contact support within 60 days of the charge</li>
                <li>Provide detailed information about the dispute</li>
                <li>We'll investigate and respond within 5 business days</li>
                <li>Chargebacks may result in account suspension</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact for Refund Requests</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                For refund requests or billing questions:
              </p>
              <div className="text-gray-dark-300">
                <p>Email: <a href="mailto:billing@agentvisible.ai" className="text-accent hover:text-secondary">billing@agentvisible.ai</a></p>
                <p className="mt-4">
                  Please include:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                  <li>Your account email address</li>
                  <li>Reason for refund request</li>
                  <li>Any relevant documentation or screenshots</li>
                  <li>Preferred resolution</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Policy Changes</h2>
              <p className="text-gray-dark-300 leading-relaxed mb-4">
                This refund policy may be updated from time to time. Changes will be communicated via email to active subscribers and posted on this page with an updated effective date.
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
              ← Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-accent hover:text-secondary transition-colors"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}