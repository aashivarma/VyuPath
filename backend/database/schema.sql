CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE labs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL
);

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id UUID REFERENCES labs(id),
  name TEXT NOT NULL,
  age INT,
  gender TEXT
);

CREATE TABLE samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode VARCHAR(50) UNIQUE NOT NULL,
  patient_id UUID REFERENCES patients(id),
  lab_id UUID REFERENCES labs(id),
  sample_type VARCHAR(50),
  status VARCHAR(30),
  collected_at TIMESTAMP DEFAULT now()
);

CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_id UUID REFERENCES samples(id),
  diagnosis TEXT,
  recommendations TEXT,
  report_generated BOOLEAN DEFAULT false
);

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

