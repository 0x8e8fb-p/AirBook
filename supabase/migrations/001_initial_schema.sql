-- ============================================
-- FareCracker — Initial Database Schema
-- Supabase/PostgreSQL Migration
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ──────────────────────────────────────────────
-- Extends Supabase's auth.users with app-specific profile data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  display_name TEXT NOT NULL DEFAULT '',
  home_airport TEXT NOT NULL DEFAULT 'DEL',
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'hi')),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-create profile on auth signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── User Credit Cards ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_credit_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_name TEXT NOT NULL,
  card_bank TEXT NOT NULL,
  card_network TEXT NOT NULL CHECK (card_network IN ('Visa', 'Mastercard', 'Amex', 'RuPay', 'Diners')),
  current_points_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Flights Cache ──────────────────────────────────────
-- Temporary cache of search results (TTL enforced by app, not DB)
CREATE TABLE IF NOT EXISTS public.flights_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_hash TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_stats JSONB DEFAULT '[]'::jsonb,
  total_results INTEGER NOT NULL DEFAULT 0,
  cheapest_price INTEGER,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes')
);

CREATE INDEX IF NOT EXISTS idx_flights_cache_hash ON public.flights_cache(search_hash);
CREATE INDEX IF NOT EXISTS idx_flights_cache_expires ON public.flights_cache(expires_at);

-- ─── Price History ──────────────────────────────────────
-- Tracks price changes over time for ML and price prediction
CREATE TABLE IF NOT EXISTS public.price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  airline TEXT NOT NULL,
  flight_number TEXT,
  price INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  source TEXT NOT NULL,
  cabin_class TEXT NOT NULL DEFAULT 'economy',
  departure_date DATE NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_history_route ON public.price_history(origin, destination);
CREATE INDEX IF NOT EXISTS idx_price_history_route_date ON public.price_history(origin, destination, departure_date);
CREATE INDEX IF NOT EXISTS idx_price_history_recorded ON public.price_history(recorded_at);

-- ─── User Searches ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  passengers JSONB NOT NULL DEFAULT '{"adults":1,"children":0,"infants":0}'::jsonb,
  cabin_class TEXT NOT NULL DEFAULT 'economy',
  cheapest_found INTEGER,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_searches_user ON public.user_searches(user_id, searched_at DESC);

-- ─── User Alerts ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('price_drop', 'target_price', 'error_fare', 'flash_sale')),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_date DATE,
  target_price INTEGER,
  channels JSONB NOT NULL DEFAULT '["email"]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  triggered_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON public.user_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_alerts_route ON public.user_alerts(origin, destination, is_active);

-- ─── Coupons ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL,
  platform TEXT NOT NULL,
  airline_restriction JSONB DEFAULT '[]'::jsonb,
  route_restriction TEXT DEFAULT 'all',
  min_booking_amount INTEGER DEFAULT 0,
  max_discount INTEGER,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC NOT NULL,
  valid_from DATE,
  valid_to DATE,
  card_restriction JSONB DEFAULT NULL,
  payment_method TEXT DEFAULT 'all',
  user_type TEXT DEFAULT 'all',
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  last_verified_at TIMESTAMPTZ,
  success_rate NUMERIC DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  community_submitted BOOLEAN DEFAULT FALSE,
  submitted_by UUID REFERENCES public.users(id),
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_platform ON public.coupons(platform, verified);
CREATE INDEX IF NOT EXISTS idx_coupons_valid ON public.coupons(valid_to) WHERE valid_to IS NOT NULL;

-- ─── Deals Feed ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.deals_feed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deal_type TEXT NOT NULL CHECK (deal_type IN ('error_fare', 'flash_sale', 'price_drop', 'coupon_deal', 'community', 'credit_card_deal')),
  title TEXT NOT NULL,
  description TEXT,
  origin TEXT,
  destination TEXT,
  price INTEGER,
  normal_price INTEGER,
  savings_amount INTEGER,
  savings_pct NUMERIC,
  airline TEXT,
  source_url TEXT,
  booking_url TEXT,
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  submitted_by UUID REFERENCES public.users(id),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_deals_feed_active ON public.deals_feed(is_active, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_deals_feed_type ON public.deals_feed(deal_type, is_active);

-- ─── User Savings Log ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_savings_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  original_price INTEGER NOT NULL,
  effective_price INTEGER NOT NULL,
  savings_amount INTEGER NOT NULL,
  strategies_used JSONB DEFAULT '[]'::jsonb,
  booked_via TEXT,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_savings_user ON public.user_savings_log(user_id, booked_at DESC);

-- ─── Row Level Security ─────────────────────────────────
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_savings_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals_feed ENABLE ROW LEVEL SECURITY;

-- Users: can read/update own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Credit cards: own data only
CREATE POLICY "Users own credit cards" ON public.user_credit_cards
  FOR ALL USING (auth.uid() = user_id);

-- Searches: own data only
CREATE POLICY "Users own searches" ON public.user_searches
  FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Alerts: own data only
CREATE POLICY "Users own alerts" ON public.user_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Savings: own data only
CREATE POLICY "Users own savings" ON public.user_savings_log
  FOR ALL USING (auth.uid() = user_id);

-- Flights cache: readable by all (it's search results)
CREATE POLICY "Cache readable by all" ON public.flights_cache
  FOR SELECT USING (true);
CREATE POLICY "Cache writable by service" ON public.flights_cache
  FOR INSERT WITH CHECK (true);

-- Price history: readable by all, writable by service
CREATE POLICY "History readable by all" ON public.price_history
  FOR SELECT USING (true);
CREATE POLICY "History writable by service" ON public.price_history
  FOR INSERT WITH CHECK (true);

-- Coupons: readable by all
CREATE POLICY "Coupons readable by all" ON public.coupons
  FOR SELECT USING (true);
CREATE POLICY "Users can submit coupons" ON public.coupons
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Deals: readable by all
CREATE POLICY "Deals readable by all" ON public.deals_feed
  FOR SELECT USING (true);
CREATE POLICY "Users can submit deals" ON public.deals_feed
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─── Updated At Trigger ─────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
