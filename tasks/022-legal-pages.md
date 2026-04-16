# Task 022: Legal Pages + Cookie Consent

## Status: TODO | Priority: P0 | Est: 1-2h | AUTONOMOUS-SAFE

## Goal
Create Terms of Service, Privacy Policy, Refund Policy pages, and a cookie consent banner. Launch-required for accepting payments legally (GDPR, Australian Consumer Law).

## Why this can run overnight
Pure frontend work. No external services, no API keys, no credentials needed. Content is templated and provided below.

## Files to CREATE

- `web/app/terms/page.tsx`
- `web/app/privacy/page.tsx`
- `web/app/refunds/page.tsx`
- `web/components/CookieConsent.tsx`
- `web/app/layout.tsx` — inject CookieConsent component

## Files OFF LIMITS

- Do NOT modify the hero page
- Do NOT modify scan pages
- Do NOT modify ScanResultPanel
- Do NOT touch tailwind.config.ts
- Do NOT modify backend code

## Content for each page

### /terms/page.tsx

```
# Terms of Service

Last updated: April 17, 2026

## 1. Acceptance of Terms
By accessing or using AgentVisible ("Service"), you agree to be bound by these Terms.

## 2. Description of Service
AgentVisible is a website analysis tool that evaluates how well websites can be found and understood by AI agents including but not limited to ChatGPT, Claude, Perplexity, and Gemini. We provide:
- Free website scanning (rate-limited)
- Paid detailed PDF reports ($29 one-time)
- Paid Pro subscription with monitoring and competitor tracking ($99/month)

## 3. User Accounts
You may create an account using your email address. You are responsible for maintaining the security of your account. We use passwordless authentication via magic links.

## 4. Acceptable Use
You agree not to:
- Scan websites you do not have permission to analyze
- Use the service to harm, harass, or violate others' rights
- Attempt to reverse engineer or abuse our rate limits
- Resell our service without explicit written permission

## 5. Payments
- All prices are in USD
- Subscriptions auto-renew monthly until cancelled
- You may cancel anytime via your account dashboard
- One-time PDF report purchases are non-refundable after delivery
- See Refund Policy for subscription refunds

## 6. Intellectual Property
Scan results belong to you. The scanning methodology, algorithms, and software belong to AgentVisible. You may share your scan reports publicly or privately.

## 7. Service Availability
We aim for 99% uptime but do not guarantee uninterrupted service. We may perform maintenance or modify the service at any time.

## 8. Limitation of Liability
AgentVisible is provided "as is." We are not liable for business decisions made based on scan results. Our total liability is limited to the amount you paid us in the last 12 months.

## 9. Termination
We reserve the right to terminate accounts that violate these Terms. You may close your account at any time.

## 10. Governing Law
These Terms are governed by the laws of New South Wales, Australia.

## 11. Changes to Terms
We may update these Terms. Continued use after changes constitutes acceptance.

## 12. Contact
Questions? Email: legal@agentvisible.ai
```

### /privacy/page.tsx

```
# Privacy Policy

Last updated: April 17, 2026

## 1. Information We Collect

### You provide directly:
- Email address (for account creation and magic link authentication)
- Payment information (processed by Stripe; we never see card details)
- Website URLs you choose to scan

### We collect automatically:
- Scan results (which URLs you scan, scores, timestamps)
- Usage analytics (pages visited, features used) via PostHog
- IP address (for rate limiting and abuse prevention)
- Browser type and device information

## 2. How We Use Information

- To deliver the scan service
- To process payments
- To send transactional emails (receipts, reports, alerts)
- To improve the product
- To prevent abuse and enforce rate limits

## 3. How We Share Information

We share with:
- **Stripe** (payment processing)
- **Supabase** (database and authentication)
- **Resend** (transactional email delivery)
- **PostHog** (product analytics)
- **Vercel** (hosting and deployment)

We do NOT sell your data to third parties.

## 4. Your Rights (GDPR / Privacy Act 1988)

You may:
- Access your personal data
- Request deletion of your account and data
- Export your scan history
- Opt out of marketing emails (transactional emails required for service)
- Lodge a complaint with your data protection authority

Email data@agentvisible.ai to exercise these rights.

## 5. Data Retention

- Active accounts: data retained while account is active
- Cancelled accounts: data deleted within 30 days of cancellation request
- Scan results: retained 12 months for logged-in users, 24 hours for anonymous
- Payment records: retained 7 years (legal requirement)

## 6. Cookies

We use cookies for:
- Authentication (session cookies, essential)
- Analytics (PostHog, can be declined via cookie banner)
- Rate limiting (anonymous session tracking)

You can control cookie preferences via our cookie banner or browser settings.

## 7. Children

AgentVisible is not intended for users under 16. We do not knowingly collect data from minors.

## 8. International Transfers

Data may be processed in the United States (Vercel, Stripe) and European Union (Supabase). We ensure appropriate safeguards (SCCs) are in place.

## 9. Security

We use industry-standard encryption (HTTPS, encrypted databases). No system is 100% secure; we cannot guarantee absolute security.

## 10. Changes to Policy

We will notify you of material changes via email. Continued use after changes constitutes acceptance.

## 11. Contact

Data Protection inquiries: data@agentvisible.ai
General inquiries: hello@agentvisible.ai
```

### /refunds/page.tsx

```
# Refund Policy

Last updated: April 17, 2026

## Pro Subscription ($99/month)

**Monthly subscriptions are non-refundable once the billing period starts.**

You may cancel anytime via your account dashboard. Cancellation takes effect at the end of the current billing period — you retain Pro access until then but are not charged again.

## One-Time Products ($29 PDF Report)

**PDF reports are non-refundable once delivered.**

Exceptions (full refund within 7 days):
- Scanner technical failure prevented report generation
- PDF was never delivered despite successful payment
- Duplicate charge on your card

Email refunds@agentvisible.ai with your order number to request a refund in these cases.

## Chargebacks

Please contact us before initiating a chargeback. We respond to all refund requests within 48 hours. Unjustified chargebacks may result in account termination.

## Annual Plans

We do not currently offer annual plans. If introduced later, annual plans will have a 14-day full refund window.

## EU Consumers

EU customers have a 14-day cooling-off period for digital services. By beginning the scan service (running a scan after payment), you acknowledge and waive this right, allowing immediate service delivery.

## Contact

Refund requests: refunds@agentvisible.ai
General billing: billing@agentvisible.ai
```

## Layout and styling

All three pages use the same layout pattern. Create a shared component if helpful, otherwise inline styling is fine.

Design requirements:
- Dark theme matching site (`bg-dark-1`)
- Max width: 800px, centered
- Readable body text: `text-slate-300`, line-height 1.6
- Headings: `text-white`, proper hierarchy (h1, h2, h3)
- Links: `text-teal-400` with hover state
- Padding: `py-16 px-6` desktop, `py-12 px-4` mobile
- Back link at top: `← Back to home` linking to `/`
- Contact section at bottom in a subtle card

Use Markdown-to-JSX approach OR write as plain JSX with proper semantic HTML tags. No external markdown library needed.

## CookieConsent component

### `web/components/CookieConsent.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookie_consent');
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('cookie_consent', 'rejected');
    setIsVisible(false);
    // Signal to analytics to opt out (used by PostHog integration later)
    if (typeof window !== 'undefined') {
      (window as any).__posthog_opted_out__ = true;
    }
  };

  if (!isVisible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-consent-title"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-dark-3 border border-dark-5 rounded-xl p-5 shadow-xl z-50"
    >
      <h3 id="cookie-consent-title" className="text-white font-medium mb-2">
        Cookies and your privacy
      </h3>
      <p className="text-sm text-slate-400 mb-4">
        We use essential cookies to run this site and optional analytics to improve the product.
        You can decline analytics.
        <a href="/privacy" className="text-teal-400 hover:underline ml-1">
          Learn more
        </a>
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="bg-teal-400 text-dark-1 px-4 py-2 rounded-md text-sm font-medium hover:bg-teal-300 transition flex-1"
        >
          Accept all
        </button>
        <button
          onClick={handleReject}
          className="bg-transparent text-slate-300 border border-dark-5 px-4 py-2 rounded-md text-sm hover:border-dark-6 transition flex-1"
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
```

### Inject into layout

In `web/app/layout.tsx`, add at the end of the body (inside the root element):

```tsx
import { CookieConsent } from '@/components/CookieConsent';

// ... rest of layout ...

return (
  <html lang="en">
    <body className={inter.className}>
      {children}
      <CookieConsent />
    </body>
  </html>
);
```

## Footer update (bonus)

In the footer component (wherever it lives), add links to all three legal pages:

```tsx
<div className="text-sm text-slate-500 flex gap-4">
  <Link href="/terms" className="hover:text-slate-300">Terms</Link>
  <Link href="/privacy" className="hover:text-slate-300">Privacy</Link>
  <Link href="/refunds" className="hover:text-slate-300">Refunds</Link>
</div>
```

Don't create a new footer if one doesn't exist — just add these links to the existing footer.

## Acceptance Criteria

- [ ] `/terms` route loads and shows Terms of Service content
- [ ] `/privacy` route loads and shows Privacy Policy content
- [ ] `/refunds` route loads and shows Refund Policy content
- [ ] All three pages are dark-themed, readable, mobile-responsive
- [ ] Cookie banner appears on first visit
- [ ] Accept button dismisses banner, stores `cookie_consent=accepted`
- [ ] Reject button dismisses banner, stores `cookie_consent=rejected`
- [ ] Refreshing the page after accepting does NOT re-show the banner
- [ ] Links to legal pages appear in footer
- [ ] No hero/scan page regressions
- [ ] `npm run build` passes with no errors or warnings

## Verification commands (must pass before commit)

```bash
cd web

# Build must succeed
npm run build

# Pages exist
test -f app/terms/page.tsx && echo "terms ok" || echo "MISSING terms"
test -f app/privacy/page.tsx && echo "privacy ok" || echo "MISSING privacy"
test -f app/refunds/page.tsx && echo "refunds ok" || echo "MISSING refunds"
test -f components/CookieConsent.tsx && echo "banner ok" || echo "MISSING banner"

# Layout injects banner
grep -n "CookieConsent" app/layout.tsx

# Footer has legal links
grep -n "terms\|privacy\|refunds" app/layout.tsx app/page.tsx 2>/dev/null
```

## Commit
```
git add web/app/terms web/app/privacy web/app/refunds web/components/CookieConsent.tsx web/app/layout.tsx
git commit -m "feat: legal pages (terms/privacy/refunds) + cookie consent banner (Task 022)"
```

## Out of scope

- No actual cookie-by-cookie granular control UI
- No admin editor for legal text
- No multi-language versions
- No version history of legal pages
- Email addresses in contact sections are placeholders — FG will set up email forwarding separately
