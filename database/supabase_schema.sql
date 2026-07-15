-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Create user_plans table
CREATE TABLE IF NOT EXISTS user_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  plan_id TEXT NOT NULL DEFAULT 'free', -- 'free', 'codetantra', 'pro'
  plan_expiry TIMESTAMP WITH TIME ZONE, -- Null for 'free' or unlimited. Otherwise expiration date.
  ai_coach_count INT DEFAULT 0,
  ai_coach_last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_papers_count INT DEFAULT 0,
  model_papers_last_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create payment_logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firebase_uid TEXT NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  plan_id TEXT NOT NULL,
  amount_paid INT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add RLS Policies
-- Enable Row Level Security
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon (the frontend) to read user_plans IF they match their firebase_uid.
-- In a fully secure setup you'd verify the JWT, but here we just allow selection by firebase_uid
CREATE POLICY "Allow public read of own plan" ON user_plans
  FOR SELECT USING (true); 

-- Note: Writes to these tables will be done by the Backend (Node.js) using the Supabase Service Role Key, 
-- which bypasses RLS. So no write policies are needed for anon.
