# Task 023: Stripe Checkout Integration

## Status: TODO | Priority: P0 | Est: 3-4h

## Goal
Wire up Stripe Checkout so users can actually pay for:
1. $29 one-time PDF report
2. $99/month Pro subscription

Uses Stripe Checkout (hosted page) — user clicks button, redirects to Stripe, completes payment, returns to success page. No embedded card forms.

## Prerequisites (already done)
- ✅ Stripe account created (Test Mode)
- ✅ Two products created ($29 PDF, $99/mo Pro)
- ✅ Env vars set:
  - `web/.env.local`: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  - `api/.env`: STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PDF, STRIPE_PRICE_ID_PRO_MONTHLY
- ✅ Supabase Auth working (user_id available from JWT)

## Files to CREATE

### Backend (FastAPI)
- `api/stripe_routes.py` — Stripe checkout session creation endpoints
- `api/stripe_webhooks.py` — Webhook handler for payment events

### Frontend (Next.js)
- `web/app/checkout/success/page.tsx` — Success page after payment
- `web/app/checkout/cancel/page.tsx` — Cancel/back page

### Database
- `api/migrations/003_subscriptions_purchases.sql` — New tables

## Files to MODIFY
- `api/main.py` — Import and mount stripe routes
- `web/app/pricing/page.tsx` — Wire CTA buttons to checkout endpoints
- `web/app/scan/page.tsx` — Wire the 429 error "Upgrade to Pro" button to checkout

## Files OFF LIMITS
- Do NOT modify ScanResultPanel
- Do NOT modify hero demo animation
- Do NOT modify scan animation logic
- Do NOT modify legal pages
- Do NOT modify auth flow (Task 021)

---

## Database migration

Create `api/migrations/003_subscriptions_purchases.sql`:

```sql
-- Subscriptions table for Pro users
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'agency')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_sub ON subscriptions(stripe_subscription_id);

-- One-time purchases table for PDF reports
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product TEXT NOT NULL DEFAULT 'pdf_report',
  amount_cents INT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  scan_url TEXT,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchases_user_id ON purchases(user_id);
```

Apply this migration in Supabase SQL editor before running the task. If that's not possible, the task should document the SQL and skip the migration step.

---

## Backend: Stripe routes

### `api/stripe_routes.py`

```python
import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

# Import the auth dependency from main.py
# from main import get_optional_user_id

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

router = APIRouter(prefix='/api/v1/stripe', tags=['stripe'])

class CheckoutRequest(BaseModel):
    price_id: str
    scan_url: Optional[str] = None  # For PDF reports, which scan it's for
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None

@router.post('/create-checkout-session')
async def create_checkout_session(
    req: CheckoutRequest,
    request: Request,
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    """Create a Stripe Checkout session for PDF report or Pro subscription."""
    
    if not user_id:
        raise HTTPException(status_code=401, detail='Must be logged in to purchase')
    
    # Determine if this is a one-time or subscription purchase
    pdf_price_id = os.environ.get('STRIPE_PRICE_ID_PDF')
    pro_price_id = os.environ.get('STRIPE_PRICE_ID_PRO_MONTHLY')
    
    if req.price_id not in [pdf_price_id, pro_price_id]:
        raise HTTPException(status_code=400, detail='Invalid price ID')
    
    is_subscription = req.price_id == pro_price_id
    
    # Build base URL from request
    base_url = str(request.base_url).rstrip('/')
    # For local dev, frontend is on different port
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    success_url = req.success_url or f'{frontend_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}'
    cancel_url = req.cancel_url or f'{frontend_url}/checkout/cancel'
    
    try:
        session_params = {
            'payment_method_types': ['card'],
            'line_items': [{
                'price': req.price_id,
                'quantity': 1,
            }],
            'mode': 'subscription' if is_subscription else 'payment',
            'success_url': success_url,
            'cancel_url': cancel_url,
            'client_reference_id': user_id,
            'metadata': {
                'user_id': user_id,
                'product': 'pro_monthly' if is_subscription else 'pdf_report',
            },
        }
        
        # Add scan_url to metadata for PDF reports
        if req.scan_url and not is_subscription:
            session_params['metadata']['scan_url'] = req.scan_url
        
        # For subscriptions, allow promotion codes
        if is_subscription:
            session_params['allow_promotion_codes'] = True
        
        session = stripe.checkout.Session.create(**session_params)
        
        return {'checkout_url': session.url, 'session_id': session.id}
    
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/billing-portal')
async def create_billing_portal(
    request: Request,
    user_id: Optional[str] = Depends(get_optional_user_id),
):
    """Create a Stripe billing portal session for subscription management."""
    
    if not user_id:
        raise HTTPException(status_code=401, detail='Must be logged in')
    
    # Look up stripe_customer_id from subscriptions table
    # For now, use the Supabase client to query
    from database import get_supabase_client
    supabase = get_supabase_client()
    
    result = supabase.table('subscriptions').select('stripe_customer_id').eq('user_id', user_id).single().execute()
    
    if not result.data or not result.data.get('stripe_customer_id'):
        raise HTTPException(status_code=404, detail='No subscription found')
    
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    
    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=result.data['stripe_customer_id'],
            return_url=f'{frontend_url}/dashboard',
        )
        return {'portal_url': portal_session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### `api/stripe_webhooks.py`

```python
import os
import stripe
from fastapi import APIRouter, Request, HTTPException
from datetime import datetime

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')

router = APIRouter(tags=['stripe-webhooks'])

@router.post('/api/v1/webhooks/stripe')
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')
    
    if not sig_header:
        raise HTTPException(status_code=400, detail='Missing stripe-signature header')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail='Invalid payload')
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail='Invalid signature')
    
    # Handle the event
    event_type = event['type']
    data = event['data']['object']
    
    from database import get_supabase_client
    supabase = get_supabase_client()
    
    if event_type == 'checkout.session.completed':
        await handle_checkout_completed(supabase, data)
    
    elif event_type == 'invoice.payment_succeeded':
        await handle_invoice_paid(supabase, data)
    
    elif event_type == 'customer.subscription.deleted':
        await handle_subscription_cancelled(supabase, data)
    
    elif event_type == 'customer.subscription.updated':
        await handle_subscription_updated(supabase, data)
    
    return {'status': 'ok'}


async def handle_checkout_completed(supabase, session):
    """Handle successful checkout — create subscription or purchase record."""
    
    user_id = session.get('client_reference_id') or session.get('metadata', {}).get('user_id')
    product = session.get('metadata', {}).get('product', '')
    
    if not user_id:
        print(f'Warning: checkout.session.completed without user_id: {session["id"]}')
        return
    
    if product == 'pro_monthly':
        # Subscription checkout
        subscription_id = session.get('subscription')
        customer_id = session.get('customer')
        
        if subscription_id:
            # Fetch subscription details from Stripe
            sub = stripe.Subscription.retrieve(subscription_id)
            
            supabase.table('subscriptions').upsert({
                'user_id': user_id,
                'tier': 'pro',
                'status': 'active',
                'stripe_customer_id': customer_id,
                'stripe_subscription_id': subscription_id,
                'current_period_start': datetime.fromtimestamp(sub['current_period_start']).isoformat(),
                'current_period_end': datetime.fromtimestamp(sub['current_period_end']).isoformat(),
                'updated_at': datetime.utcnow().isoformat(),
            }, on_conflict='stripe_subscription_id').execute()
    
    elif product == 'pdf_report':
        # One-time PDF purchase
        payment_intent = session.get('payment_intent')
        scan_url = session.get('metadata', {}).get('scan_url', '')
        
        supabase.table('purchases').insert({
            'user_id': user_id,
            'product': 'pdf_report',
            'amount_cents': session.get('amount_total', 2900),
            'currency': session.get('currency', 'usd'),
            'stripe_payment_intent_id': payment_intent,
            'stripe_checkout_session_id': session['id'],
            'scan_url': scan_url,
            'status': 'completed',
        }).execute()
        
        # TODO: Trigger PDF generation + email delivery (Task 027)


async def handle_invoice_paid(supabase, invoice):
    """Handle recurring subscription payment — update period dates."""
    
    subscription_id = invoice.get('subscription')
    if not subscription_id:
        return
    
    sub = stripe.Subscription.retrieve(subscription_id)
    
    supabase.table('subscriptions').update({
        'status': 'active',
        'current_period_start': datetime.fromtimestamp(sub['current_period_start']).isoformat(),
        'current_period_end': datetime.fromtimestamp(sub['current_period_end']).isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
    }).eq('stripe_subscription_id', subscription_id).execute()


async def handle_subscription_cancelled(supabase, subscription):
    """Handle subscription cancellation."""
    
    supabase.table('subscriptions').update({
        'status': 'cancelled',
        'updated_at': datetime.utcnow().isoformat(),
    }).eq('stripe_subscription_id', subscription['id']).execute()


async def handle_subscription_updated(supabase, subscription):
    """Handle subscription status changes (past_due, etc)."""
    
    status_map = {
        'active': 'active',
        'past_due': 'past_due',
        'canceled': 'cancelled',
        'unpaid': 'past_due',
        'trialing': 'trialing',
    }
    
    new_status = status_map.get(subscription.get('status'), 'active')
    
    supabase.table('subscriptions').update({
        'status': new_status,
        'current_period_start': datetime.fromtimestamp(subscription['current_period_start']).isoformat(),
        'current_period_end': datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
        'updated_at': datetime.utcnow().isoformat(),
    }).eq('stripe_subscription_id', subscription['id']).execute()
```

### Mount routes in `api/main.py`

Add these imports and include the routers:

```python
from stripe_routes import router as stripe_router
from stripe_webhooks import router as stripe_webhook_router

app.include_router(stripe_router)
app.include_router(stripe_webhook_router)
```

---

## Frontend: Checkout flow

### Success page (`web/app/checkout/success/page.tsx`)

```tsx
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
        <p className="text-slate-400 mb-8">
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
            className="block w-full border border-dark-5 text-slate-300 py-3 rounded-lg hover:border-dark-6 transition"
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
```

### Cancel page (`web/app/checkout/cancel/page.tsx`)

```tsx
import Link from 'next/link'

export default function CheckoutCancel() {
  return (
    <div className="min-h-screen bg-dark-1 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-dark-3 border border-dark-5 rounded-xl p-8 text-center">
        <h1 className="text-2xl font-semibold text-white mb-3">Payment cancelled</h1>
        <p className="text-slate-400 mb-8">
          No charges were made. You can try again anytime.
        </p>
        <div className="space-y-3">
          <Link
            href="/pricing"
            className="block w-full bg-teal-400 text-dark-1 py-3 rounded-lg font-medium hover:bg-teal-300 transition"
          >
            View pricing
          </Link>
          <Link
            href="/"
            className="block w-full border border-dark-5 text-slate-300 py-3 rounded-lg hover:border-dark-6 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
```

### Wire pricing page buttons

In `web/app/pricing/page.tsx`, the CTA buttons need to call the checkout API:

```tsx
// Helper function used by pricing page buttons
async function handleCheckout(priceId: string, scanUrl?: string) {
  const response = await fetch('/api/v1/stripe/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Auth header added by middleware or manually
    },
    body: JSON.stringify({
      price_id: priceId,
      scan_url: scanUrl,
    }),
  })

  if (response.status === 401) {
    // User not logged in — redirect to signup
    window.location.href = '/auth/sign-in?redirect=/pricing'
    return
  }

  const data = await response.json()
  if (data.checkout_url) {
    window.location.href = data.checkout_url
  }
}
```

For the Pro button: `onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO!)}`
For the PDF button: `onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PDF!)}`

Note: Price IDs need to be exposed to frontend. Add to `web/.env.local`:
```
NEXT_PUBLIC_STRIPE_PRICE_ID_PDF=price_xxx
NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
```

### Wire 429 error "Upgrade to Pro" button

In `web/app/scan/page.tsx`, the rate limit error state has an "Upgrade to Pro — $99/mo" button. Wire it:

```tsx
<button
  onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY!)}
  className="bg-teal-400 text-dark-1 px-6 py-3 rounded-lg font-medium"
>
  Upgrade to Pro — $99/mo
</button>
```

If user is not logged in, redirect to signup first.

---

## Install dependencies

### Backend
```bash
cd api
pip install stripe --break-system-packages
```

### Frontend
No additional Stripe SDK needed — we're using Stripe Checkout (redirect), not Stripe Elements (embedded). All frontend does is call our API to get a checkout URL and redirect.

---

## Webhook setup for local testing

For local dev, use Stripe CLI to forward webhooks:

```bash
# Install Stripe CLI (if not installed)
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local backend
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
```

This prints a webhook signing secret (`whsec_...`). Add it to `api/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

NOTE: Claude Code cannot run `stripe listen` (needs interactive auth). This step is documented for the user to do manually. The webhook handler code should still be written and committed.

---

## Acceptance Criteria

### Checkout flow
- [ ] Pricing page Pro button → creates Stripe Checkout session → redirects to Stripe
- [ ] Pricing page PDF button → creates Stripe Checkout session → redirects to Stripe
- [ ] 429 error "Upgrade to Pro" button → same checkout flow
- [ ] If user not logged in, redirect to /auth/sign-in first
- [ ] Success page renders after payment with correct messaging
- [ ] Cancel page renders when user clicks back on Stripe

### Backend
- [ ] POST /api/v1/stripe/create-checkout-session works for both price IDs
- [ ] POST /api/v1/webhooks/stripe endpoint exists and returns 200
- [ ] GET /api/v1/stripe/billing-portal endpoint exists
- [ ] 401 returned if no auth token provided to checkout endpoint
- [ ] stripe package installed in requirements

### Database
- [ ] subscriptions table exists with correct schema
- [ ] purchases table exists with correct schema
- [ ] Both tables have proper indexes

### Webhook handling
- [ ] checkout.session.completed creates subscription or purchase record
- [ ] invoice.payment_succeeded updates subscription period
- [ ] customer.subscription.deleted marks subscription cancelled
- [ ] customer.subscription.updated handles status changes

### No regressions
- [ ] Hero demo still animates
- [ ] Scan flow still works
- [ ] Auth flow still works (login, logout)
- [ ] Legal pages still render
- [ ] Pricing page still renders (now with working buttons)

## Verification commands (must pass before commit)

```bash
cd ~/projects/agentvisible

# Backend
grep -n "stripe" api/main.py
grep -n "stripe_routes\|stripe_webhooks" api/main.py
test -f api/stripe_routes.py && echo "routes ok" || echo "MISSING"
test -f api/stripe_webhooks.py && echo "webhooks ok" || echo "MISSING"

# Frontend
test -f web/app/checkout/success/page.tsx && echo "success ok" || echo "MISSING"
test -f web/app/checkout/cancel/page.tsx && echo "cancel ok" || echo "MISSING"

# Price IDs exposed to frontend
grep "STRIPE_PRICE_ID" web/.env.local

# Build
cd web && npm run build

# Check pricing buttons are wired
grep -n "create-checkout-session\|handleCheckout\|checkout_url" web/app/pricing/page.tsx

# Check 429 error button is wired
grep -n "create-checkout-session\|handleCheckout\|STRIPE_PRICE_ID" web/app/scan/page.tsx
```

All must pass. Do not commit until they do.

## Commit
```
git add api/stripe_routes.py api/stripe_webhooks.py api/migrations/ web/app/checkout/ web/app/pricing/ web/app/scan/page.tsx api/main.py
git commit -m "feat: Stripe Checkout for $29 PDF + $99/mo Pro subscription (Task 023)"
```

## Out of scope
- No PDF generation yet (Task 027)
- No tier-based rate limiting yet (Task 025)
- No user dashboard yet (Task 028)
- No receipt emails yet (Task 030)
- No Stripe Elements or embedded card forms
- No annual billing option yet
- No coupon/discount management
- No refund processing automation
