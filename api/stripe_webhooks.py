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