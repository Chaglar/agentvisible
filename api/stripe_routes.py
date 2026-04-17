import os
import stripe
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional

# Import the auth dependency from auth.py
from auth import verify_jwt
from database import get_supabase_client

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
    user: dict = Depends(verify_jwt),
):
    """Create a Stripe Checkout session for PDF report or Pro subscription."""

    print(f"Create checkout session request: price_id={req.price_id}, user_id={user.get('sub') if user else 'None'}")

    if not user:
        raise HTTPException(status_code=401, detail='Must be logged in to purchase')

    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid user token')

    # Check if user already has an active Pro subscription
    supabase = get_supabase_client()
    existing_sub = supabase.table('subscriptions').select('tier, status').eq('user_id', user_id).eq('status', 'active').execute()

    if existing_sub.data:
        subscription = existing_sub.data[0]
        if subscription.get('tier') in ['pro', 'agency']:
            raise HTTPException(status_code=400, detail='You already have an active Pro subscription!')

    # Determine if this is a one-time or subscription purchase
    pdf_price_id = os.environ.get('STRIPE_PRICE_ID_PDF')
    pro_price_id = os.environ.get('STRIPE_PRICE_ID_PRO_MONTHLY')

    print(f"Price ID validation: req={req.price_id}, pdf={pdf_price_id}, pro={pro_price_id}")

    if req.price_id not in [pdf_price_id, pro_price_id]:
        print(f"Price ID validation failed: {req.price_id} not in [{pdf_price_id}, {pro_price_id}]")
        raise HTTPException(status_code=400, detail='Invalid price ID')

    is_subscription = req.price_id == pro_price_id

    # Build frontend URL from environment
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3001')

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
        print(f"Stripe error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        print(f"Unexpected error in create_checkout_session: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Checkout failed: {str(e)}")


@router.get('/billing-portal')
async def create_billing_portal(
    request: Request,
    user: dict = Depends(verify_jwt),
):
    """Create a Stripe billing portal session for subscription management."""

    if not user:
        raise HTTPException(status_code=401, detail='Must be logged in')

    user_id = user.get('sub')
    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid user token')

    # Look up stripe_customer_id from subscriptions table
    supabase = get_supabase_client()

    result = supabase.table('subscriptions').select('stripe_customer_id').eq('user_id', user_id).single().execute()

    if not result.data or not result.data.get('stripe_customer_id'):
        raise HTTPException(status_code=404, detail='No subscription found')

    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3001')

    try:
        portal_session = stripe.billing_portal.Session.create(
            customer=result.data['stripe_customer_id'],
            return_url=f'{frontend_url}/dashboard',
        )
        return {'portal_url': portal_session.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))