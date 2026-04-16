# Task 032: Pricing Page Rebuild

## Status: TODO | Priority: P0 | Est: 1-2h | AUTONOMOUS-SAFE

## Goal
Replace the existing pricing page with a clear 3-tier comparison reflecting the launch plan: Free / $29 PDF / $99/mo Pro. Plus Agency waitlist.

## Why this can run overnight
Pure frontend work. Static content. No payment integration needed yet (buttons just say "Coming soon" or link to /signup — actual Stripe checkout comes in Task 023 later). No external services.

## Files to MODIFY

- `web/app/pricing/page.tsx` — full rebuild
- `web/app/page.tsx` — update any references to pricing from hero or CTA sections

## Files OFF LIMITS

- Do NOT modify the hero demo animation
- Do NOT modify scan pages
- Do NOT touch ScanResultPanel
- Do NOT create new components beyond what the pricing page needs
- Do NOT modify tailwind.config.ts

## Page structure

### Hero (pricing)
Heading: "Simple pricing. Pay only if you need more."
Subhead: "Start free. Upgrade when you want monitoring or detailed reports."

### Three-column comparison

Use same dark palette as rest of site.

**Tier 1: Free (most prominent)**
```
Free
$0
forever

For occasional checks

✓ 3 scans per hour (anonymous)
✓ 10 scans per hour (signed in)
✓ Score out of 100
✓ Top 3 fixes identified
✓ Basic module breakdown

[Scan your site free]  → /
```

Card style: `bg-dark-3`, `border border-dark-5`, standard padding

**Tier 2: PDF Report (center, subtle highlight)**
```
PDF Report
$29
one-time

For sharing with clients

Everything in Free, plus:
✓ Detailed PDF report
✓ Action plan with code snippets
✓ Branded, shareable format
✓ Email delivery
✓ No subscription

[Buy a report]  → /scan (triggers $29 checkout mid-scan)
```

Card style: `bg-dark-3`, `border border-teal-400/30` (subtle teal accent), standard padding

**Tier 3: Pro (primary CTA — featured)**
```
Pro
$99/month
or $990/year (save 2 months)

For owners who care about rankings

Everything in Free, plus:
✓ Unlimited scans
✓ Weekly automated monitoring
✓ Compare 2 competitors
✓ Email alerts on score drops
✓ Scan history + trends
✓ Priority support

[Start Pro — 7 day free trial]  → /signup?plan=pro
```

Card style: `bg-dark-3`, `border-2 border-teal-400` (stronger accent), "Most popular" badge above card, slightly elevated with `translateY(-4px)` on desktop.

**Badge above Pro card:**
```html
<div className="bg-teal-400 text-dark-1 text-xs font-medium px-3 py-1 rounded-full inline-block mb-3">
  Most popular
</div>
```

### Agency waitlist section (below main pricing)

Card that spans full width below the 3-tier grid:

```
Agency tier — coming soon

White-label scanning, bulk reports, API access, and custom SLAs.
For agencies, consultancies, and platforms embedding AI readiness checks.

Get notified when Agency launches:
[email input]  [Join waitlist →]
```

Style: `bg-dark-2`, subtle border, slightly muted. On submit, currently just shows "Thanks!" toast — actual waitlist storage comes later.

### FAQ section (below agency)

Expandable Q&A (use `<details>` HTML element for no-JS accordion):

**How does the free tier compare to tools like GTmetrix?**
AgentVisible specifically measures AI agent readiness — how well ChatGPT, Claude, Perplexity, and Gemini can find and use your site. GTmetrix measures page speed. Different problem, both matter.

**What counts as a "competitor" in Pro?**
Any URL you want to track. Most users add 2 direct competitors in their industry. You can swap competitors at any time.

**Can I cancel Pro anytime?**
Yes. Cancel from your dashboard, access continues until the end of your billing period, no questions asked.

**Is there a refund policy?**
Monthly subscriptions are non-refundable once billing starts, but you can cancel anytime. PDF reports are non-refundable once delivered. See our [Refund Policy](/refunds) for details.

**What if the scanner fails on my site?**
Contact support. If we can't successfully scan your site, we'll refund any PDF purchase. Subscription users get extended trial time as compensation.

**Do you offer annual billing?**
Yes. Pro is $990/year (save 2 months) when billed annually. Cancel anytime, pro-rated refund for remaining months.

**How accurate are the scores?**
Scores reflect our scanning methodology (structured data, crawlability, content parseability, commerce protocols, agent discovery). Real-world AI agent behavior varies. Use scores as directional guidance, not absolute truth.

### Final CTA strip at bottom

```
Ready to see where you stand?
[Scan your site free →]  (links to / )
```

Dark section, centered, big button.

## Styling specifics

- Max content width: `max-w-6xl mx-auto`
- Section spacing: `py-24` desktop, `py-16` mobile
- Heading sizes: h1 = 48px, h2 = 32px, body = 16px
- Colors: use CSS variables / Tailwind `dark-*` classes from existing palette
- Buttons: teal primary (`bg-teal-400 text-dark-1`), transparent secondary (`border border-dark-5`)
- Card grid: `grid md:grid-cols-3 gap-6` with responsive stacking on mobile
- All cards same height using `flex flex-col` and `flex-grow` on feature list

## Acceptance Criteria

- [ ] `/pricing` route loads with three distinct tier cards
- [ ] Free tier is clearly described and has CTA to home / scan
- [ ] $29 PDF tier has clear value prop and CTA to scan page
- [ ] $99/mo Pro is the featured/most-prominent tier with "Most popular" badge
- [ ] Agency waitlist form accepts email (UI only; submission shows success toast)
- [ ] FAQ section has 7 Q&A pairs using native `<details>` expandable
- [ ] Final CTA strip at bottom
- [ ] Mobile responsive (test at 375px, 768px, 1280px widths)
- [ ] All links to /terms, /privacy, /refunds work
- [ ] No regressions to hero or scan pages
- [ ] `npm run build` passes

## Verification commands

```bash
cd web

# Build
npm run build

# Pricing page exists
test -f app/pricing/page.tsx && echo "pricing ok"

# Content check
grep -c "Most popular" app/pricing/page.tsx
grep -c "Agency" app/pricing/page.tsx
grep -c "\$29\|\$99" app/pricing/page.tsx

# FAQ uses native details
grep -c "<details" app/pricing/page.tsx
```

## Commit
```
git add web/app/pricing web/app/page.tsx
git commit -m "feat: pricing page rebuild with 3-tier comparison + FAQ + Agency waitlist UI (Task 032)"
```

## Out of scope

- No Stripe checkout wiring (Task 023)
- No actual agency waitlist email storage (placeholder submission only)
- No internationalization
- No A/B testing variants
- Do not modify hero or scan page messaging
- Do not add new images or illustrations
