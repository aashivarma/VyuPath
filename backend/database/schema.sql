
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_name TEXT NOT NULL UNIQUE,
  lbc_price DECIMAL(10,2) NOT NULL,
  hpv_price DECIMAL(10,2) NOT NULL,
  co_test_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO pricing_tiers (tier_name, lbc_price, hpv_price, co_test_price)
VALUES
('Silver', 1000, 1200, 2000),
('Gold', 800, 1000, 1700),
('Platinum', 600, 800, 1400)
ON CONFLICT (tier_name) DO NOTHING;

