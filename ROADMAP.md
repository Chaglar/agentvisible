# AgentVisible Launch Roadmap

**Last updated:** April 17, 2026 (end of build session with Cate)
**Status:** Site functional on localhost, ready for launch-blocking work
**Decision date:** Tonight — FG committed to "whatever it takes" timeline

---

## Build workflow: Routines + Remote Control (the game-changer)

Original timeline assumed sequential human+AI work. That estimate collapses now that Claude Code's Q1/Q2 2026 features change what's possible.

### The new tooling stack

**Claude Code Routines** (launched April 14, 2026) — Saved Claude Code configurations (prompt, repositories, connectors packaged once and run automatically on Anthropic's cloud infrastructure, so they keep running even when the laptop is off. Available on Pro, Max, Team, Enterprise. Daily usage limits apply.

**Remote Control** (shipped Q1 2026, now on Pro) — Synchronization layer that bridges the local CLI environment with the Claude mobile app and web interface. Allows initiating a complex task in the terminal and maintaining full control from a phone or tablet. Auto-reconnects if laptop sleeps or network drops.

**Dispatch** — Allows Claude to use the computer autonomously while users step away, effectively creating an AI coworker that keeps working while you take a lunch break.

### Workflow pattern for this build

- **Evening (FG, 1-2h):** Review what Claude built that day, test branches locally, write next task spec, queue it as a Routine
- **Morning before work (FG, 15min):** Kick off the day's queued Routine before leaving for Optus
- **During work (FG, passive):** Monitor from phone via Remote Control, course-correct if Claude Code asks a question
- **Repeat daily**

### Why this compresses the timeline

The original 12-15 day estimate assumed sequential work with human at keyboard. With Routines running in Anthropic's cloud during the 8+ hours FG is at Optus, tasks execute in parallel with day job. Practical estimate: ~4 weeks elapsed, ~25h FG input, rest is Routine execution in Anthropic cloud.

### Caveats to plan around

1. **Routines count against daily usage limits** — pace the queue, don't fire 10 tasks at once
2. **Routines need the model to be web-enabled** — confirm access on Pro tier
3. **Tasks requiring human input (Stripe setup, Supabase dashboard config, env vars)** cannot be Routines. Those stay on evening sessions.
4. **Review branches before merging** — just because a Routine finished doesn't mean it shipped correctly. Always eyeball the diff and run locally.

### Mapping roadmap tasks to workflow

| Task | Autonomous-safe? | Runs via |
|------|-----------------|----------|
| 021 Auth | No (Supabase dashboard config) | Evening session |
| 022 Legal pages | Yes | Routine |
| 023 Stripe checkout | No (Stripe dashboard config, keys) | Evening session |
| 024 Stripe webhooks | Partial (code autonomous, webhook secret manual) | Hybrid |
| 025 Tier rate limits | Yes | Routine |
| 026 Pro unlock logic | Yes | Routine |
| 027 PDF generation | Yes | Routine |
| 028 User dashboard | Yes | Routine |
| 029 Pro monitoring + competitor tracking | Yes | Routine |
| 030 Email templates | Partial (templates autonomous, Resend domain verify manual) | Hybrid |
| 031 PostHog analytics | No (PostHog project setup) | Evening session |
| 032 Pricing page rebuild | Yes | Routine |
| 033 E2E testing | Partial (test execution autonomous, real-card payment test manual) | Hybrid |
| 034 Scan UX polish | Yes | Routine |

**Autonomous-safe tasks: 7 of 14 (50%)** — these are the Routines that run in parallel with day job.

---

## Current state (what's working)

- ✅ Hero demo animation (zero-to-final, rotating 4 brands)
- ✅ Dark tonal palette (no white sections)
- ✅ URL normalization (accepts ooow.com.au without https)
- ✅ Scan page uses ScanResultPanel (same as hero — visual consistency)
- ✅ 429 error state with upgrade CTA (messaging works, button wiring pending)
- ✅ Infinite retry loop fixed (useRef guard)
- ✅ Real scanner works end-to-end for free tier

## Current state (what's broken / missing)

- ❌ "$99/mo Upgrade to Pro" button goes nowhere — no Stripe integration
- ❌ No user accounts / login
- ❌ No Pro tier unlock logic (paid users still hit rate limits)
- ❌ No legal pages (Terms, Privacy, Refunds)
- ❌ No receipt or report emails
- ❌ No database schema for users/subscriptions/purchases
- ❌ No monitoring/competitor feature (the thing that justifies $99/mo)

---

## Launch tiers (FG decision, April 16 2026)

| Tier | Price | What's included | Launch status |
|------|-------|-----------------|----------------|
| **Free (anonymous)** | $0 | 3 scans/hour by IP | Day 1 |
| **Free (logged in)** | $0 | 10 scans/hour, scan history saved | Day 1 |
| **$29 PDF Report** | $29 one-time | Detailed PDF report of one scan | Day 1 |
| **Pro** | $99/mo | Unlimited scans + monitoring + competitor tracking (3 sites) | Day 1 |
| **Agency** | TBD | White-label + bulk + API | Post-launch (deferred) |

**Pro's value proposition:** Monitoring + competitor tracking. User adds their site + up to 2 competitors, weekly auto-rescans, email alert if score drops >5 points. Creates content loop ("we beat X competitor in AI readiness" shareable).

---

## Build order (13 tasks, sequential)

### Phase 1: Foundations (4 days)

**Task 021 — Supabase Auth + magic link** (2-3h) ← START HERE
- /login and /signup routes (same UI, magic link)
- /auth/callback handler
- Middleware for session refresh
- AuthNav component in header
- Backend JWT validation
- Add user_id to scans table
- File: `tasks/021-supabase-auth.md` (already written)

**Task 022 — Legal pages** (1-2h)
- /terms, /privacy, /refunds
- Cookie consent banner for EU
- Use standard templates (Cate will provide)

**Task 023 — Stripe setup + checkout** (3-4h)
- Install Stripe SDK
- Create products in Stripe dashboard ($29 one-time, $99/mo)
- /api/checkout/{tier} endpoints
- Success + cancel URL pages
- Use Stripe Checkout (hosted page) not Elements

**Task 024 — Stripe webhooks** (2-3h)
- /api/webhooks/stripe endpoint
- Handle checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted
- Create subscription record in DB
- Mark users as Pro when subscription active
- Add subscriptions and purchases tables

### Phase 2: Pro tier logic (2 days)

**Task 025 — Tier-based rate limiting** (1-2h)
- Anonymous: 3/hour
- Free logged-in: 10/hour
- Pro: unlimited
- Check JWT, look up tier, apply limit

**Task 026 — Pro unlock in scan flow** (1-2h)
- Tier-specific error messages
- Anonymous 429 → "Sign up free for 10 scans/hour"
- Free 429 → "Upgrade to Pro for unlimited"
- Pro → never sees rate limit UI

**Task 027 — $29 PDF report generation** (3-4h)
- PDF generation from scan data (use /mnt/skills/public/pdf/ patterns)
- Triggered after successful $29 Stripe webhook
- Delivered via email (Resend attachment)
- Also available as download link in email
- One PDF per purchase

### Phase 2.5: Scan UX polish — deferred from Task 018 (1 day)

These features were specced in Task 018 but deferred during the tight-scope refactor. They're not launch-blocking but significantly improve perceived value and conversion. Tackle after Task 027 because Task 027 creates the $29 PDF which the email capture (below) can offer users mid-scan.

**Task 034 — Staged scan narration + email capture mid-scan** (4-5h)

**Sub-task A: Per-module narration staging (2h)**
Current: scan panel animates once when data arrives.
Target: each module gets a dedicated 4-second narration moment that feels like real analysis.

For each of the 5 modules, sequence:
1. Terminal log line appears: `→ Checking structured data (JSON-LD, OpenGraph)...`
2. That module's row highlights (teal-400 left border, subtle bg tint `bg-dark-4/30`)
3. "Analyzing..." state for 1.5s (no bar fill yet)
4. Bar fills 0 → final value over 1.5s with count-up number
5. Status icon (✓ ⚠ ✗) appears based on threshold
6. 1s settle before next module

Timeline per module:
- Module 1 (Structured data): 3-7s
- Module 2 (AI crawlability): 7-11s
- Module 3 (Content parseability): 11-15s
- Module 4 (Commerce protocols): 15-19s
- Module 5 (Agent discovery): 19-23s
- Score calculation: 23-26s (gauge draws with ceremony)
- Verdict: 26-28s (status label + top fix fade in)
- Hold: 28-30s (user absorbs)
- 30s+: rest of results page fades in below

**Sub-task B: Terminal log accumulation (1h)**
At the top of the scan panel, show a growing log of narration lines as stages progress:

```
$ agentvisible scan ooow.com.au_
→ Initializing scanner...
→ Fetching HTML, robots.txt, headers...
→ Checking structured data (JSON-LD, OpenGraph, Twitter meta)...
→ Testing AI crawlability (/robots.txt, /llms.txt, /sitemap.xml)...
→ Analyzing content parseability (semantic HTML, SSR detection)...
→ Checking commerce protocols (MCP, /.well-known/, cart APIs)...
→ Testing agent discovery (ai-plugin.json, semantic endpoints)...
→ Calculating composite score...
→ Scan complete.
```

Lines stack up, never replace. Creates sense of real work happening.

**Sub-task C: Email capture at 15-second mark (1h)**
At the 15-second mark of the scan (user is 50% through, peak anticipation), show a subtle email capture inside or below the panel:

```
📧 Get this report as a PDF — $29
[email input]               [Buy report →]
```

Dismissible with small ×. Does NOT interrupt animation. Converts 3-5x better than post-result prompts (behavioral science: labor illusion + peak engagement window).

On submit: captures email + triggers $29 Stripe Checkout. Ties into Task 023 checkout flow and Task 027 PDF generation.

**Sub-task D: prefers-reduced-motion support (30min)**
If user has reduced-motion preference, skip the 30s animation entirely. Show final state immediately. Required for accessibility (WCAG AA).

```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
if (prefersReducedMotion) {
  setStage('complete');
  return;
}
```

**Sub-task E: Full results reveal timing (30min)**
Currently the bottom sections (Top 3 fixes, full breakdown) render simultaneously with the panel. Should fade in AFTER the 30-second animation completes, so user focuses on the scan drama first, then absorbs recommendations.

```tsx
{stage === 'complete' && (
  <div className="animate-fade-in">
    <TopThreeFixes />
    <FullBreakdown />
  </div>
)}
```

**Why this is Phase 2.5 not launch-blocking:**
- Current scan UX works (data shown correctly)
- Missing features improve perceived value, not core function
- Worth doing before real users arrive, but not before Stripe/auth/legal
- Email capture mid-scan becomes meaningful only once Task 023 (Stripe) is live

**Acceptance criteria:**
- [ ] Each module narrates for 4s before next starts (visible staging, not instant reveal)
- [ ] Terminal log accumulates 9 lines over 28s
- [ ] Email capture appears at exactly 15s, dismissible
- [ ] Email capture on submit triggers /api/checkout/pdf with email pre-filled
- [ ] prefers-reduced-motion users skip animation, see final state instantly
- [ ] Results sections below panel fade in only after stage='complete'
- [ ] Hero demo panel on landing page unchanged (staging is scan-page-only)

### Phase 3: Pro value feature (2 days)

**Task 028 — User dashboard** (3-4h)
- /dashboard route for logged-in users
- List of their scans with scores
- Subscription status card
- Stripe billing portal link (self-serve management)
- "Your plan: Free / Pro" badge

**Task 029 — Pro monitoring + competitor tracking** (4-5h)
- watchlist table (user_id, url, type='self'|'competitor', active, last_scan_at)
- Add/remove URLs UI (max 3 for Pro: 1 own + 2 competitors)
- Cron job (Vercel cron or Supabase edge function) scanning watchlist weekly
- score_history table for tracking over time
- Email alert logic when score drops >5 points
- Comparison view: "You: 78, Competitor A: 64, Competitor B: 82"

### Phase 4: Transactional emails (1 day)

**Task 030 — Email templates via Resend** (2-3h)
- Welcome email (on first signup)
- $29 receipt + PDF attached
- $99/mo subscription receipt
- Score drop alert (Pro monitoring)
- Weekly Pro summary (monitoring digest)
- All responsive HTML + plain text versions

### Phase 5: Polish + launch (2-3 days)

**Task 031 — PostHog analytics** (1h)
- Track: signup, checkout_started, checkout_completed, scan_completed, competitor_added
- Funnel: landing → scan → signup → upgrade
- Identify logged-in users by email

**Task 032 — Pricing page rebuild** (1-2h)
- 3 tier comparison: Free / $29 PDF / $99 Pro
- "Agency coming soon — join waitlist" section
- FAQ for common objections (refunds, cancellations, what counts as "competitor")

**Task 033 — E2E testing + polish** (half day)
- Real credit card test on both $29 and $99 flows (use Stripe test cards)
- Test email delivery to real inbox
- Test rate limits per tier (anonymous, free, Pro)
- Mobile responsive check on every new page
- Lighthouse audit on all critical routes
- Deploy to production

---

## Database schema (what to build across tasks)

```sql
-- Exists already
scans (id, url, modules jsonb, score int, created_at, ...)

-- Task 021: add user_id column
ALTER TABLE scans ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Task 024: subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'agency')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task 024: one-time purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product TEXT NOT NULL,  -- 'pdf_report_29'
  amount_cents INT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  scan_id UUID REFERENCES scans(id),  -- which scan the PDF is for
  pdf_url TEXT,  -- link to generated PDF in Supabase Storage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task 029: Pro monitoring
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  type TEXT CHECK (type IN ('self', 'competitor')),
  active BOOLEAN DEFAULT TRUE,
  last_scan_at TIMESTAMPTZ,
  last_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- Task 029: score history for trending
CREATE TABLE score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID REFERENCES watchlist(id) NOT NULL,
  score INT NOT NULL,
  modules JSONB NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_score_history_watchlist ON score_history(watchlist_id, scanned_at DESC);
```

---

## External services to set up

Before coding starts, these accounts/configs need to exist:

### Supabase (already set up for scans)
- Enable Email auth provider (magic link)
- Disable "Confirm email" setting
- Set redirect URLs: localhost:3000/auth/callback, agentvisible.ai/auth/callback
- Get: Project URL, anon key, JWT secret → env vars

### Stripe (Task 023)
- Create Stripe account (or use existing)
- Create products:
  - "AgentVisible PDF Report" — $29 one-time
  - "AgentVisible Pro" — $99/month recurring
- Get: API keys (test + live), webhook signing secret
- Enable customer portal feature

### Resend (likely already set up from Task 010)
- Verify domain (send from @agentvisible.ai)
- Get API key
- Set up email templates

### PostHog (Task 031)
- Create project
- Get: project API key
- Install SDK in Next.js frontend

### Vercel Cron (Task 029)
- Use Vercel's built-in cron for weekly monitoring scans
- Or use Supabase Edge Function with pg_cron
- Decision to be made at Task 029

---

## Environment variables needed

```bash
# web/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID_PDF=
STRIPE_PRICE_ID_PRO_MONTHLY=
RESEND_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# api/.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

---

## Claude Code task rules (from memory #30)

Every task file in this roadmap follows these rules:

1. **ONE concern per task** — never bundle fixes
2. **Ask "what is the user journey?"** before specifying features
3. **Hard verification gates** — grep + build commands that must pass
4. **"Do not return until checks pass"** + **"No refactoring"** stated negatively
5. **`feat/` or `fix/` branch prefix** for narrow scope
6. **Grep for JSX usage not just imports** — catches hallucinated completion

---

## Session resumption prompt (paste into new Claude session)

When opening a new session with Cate, paste this:

> Cate, continuing the AgentVisible build. Please read `/Users/simon/projects/agentvisible/ROADMAP.md` for current state and plan. We finished the working MVP (hero demo, scan page, rate limit UI) and committed to building real auth + Stripe + Pro monitoring before launch. No deadline, quality over speed.
> 
> Last completed: Fix branches merged, scan flow works end-to-end with 429 rate limit UI showing proper upgrade messaging.
> 
> Next up: Task 021 (Supabase magic link auth). Task file at `tasks/021-supabase-auth.md`.
> 
> Use tight prompt pattern from memory: ONE file scope, explicit problem, hard verification gates, fix/ branch prefix, no refactoring. Verify Supabase env vars exist before Claude Code starts coding.

---

## Where to save this file

Save at: `~/projects/agentvisible/ROADMAP.md`

Commit to main so it's version-controlled:
```bash
cd ~/projects/agentvisible
# Save the roadmap there
git add ROADMAP.md
git commit -m "docs: launch roadmap for Phase 1-5 build plan"
git push
```

Cate can read this at the start of every new session by asking you to `cat ROADMAP.md`.
