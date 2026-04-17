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