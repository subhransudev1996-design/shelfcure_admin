-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS desktop_licenses (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  license_key   text UNIQUE NOT NULL,        -- e.g. SHELF-XXXX-XXXX-XXXX
  pharmacy_name text NOT NULL,
  owner_email   text,
  status        text DEFAULT 'active',       -- active | suspended | expired
  plan          text DEFAULT 'standard',     -- standard | pro | enterprise  
  max_machines  int  DEFAULT 1,
  activated_machines jsonb DEFAULT '[]',     -- [{machine_id, activated_at}]
  expiry_date   date,                        -- NULL = lifetime
  ai_credits    integer DEFAULT 50,          -- Track remaining AI scan quota
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Example RLS policies for admin access (if needed)
-- ALTER TABLE desktop_licenses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow admins full access" ON desktop_licenses FOR ALL USING (true);
