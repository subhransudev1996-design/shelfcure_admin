-- ==============================================================================
-- Shelfcure CRM Upgrade Script
-- ==============================================================================
-- This script contains queries to upgrade the existing schema to support the
-- advanced Lead Pipeline and Pharmacy 360 CRM features.
-- Run this script in your Supabase SQL Editor.

-- 1. Update existing 'leads' table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS next_followup_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS lead_temperature text DEFAULT 'warm' CHECK (lead_temperature IN ('cold', 'warm', 'hot')),
ADD COLUMN IF NOT EXISTS expected_close_date date,
ADD COLUMN IF NOT EXISTS value_estimate numeric(10, 2);

-- 2. Update existing 'pharmacies' table
ALTER TABLE public.pharmacies
ADD COLUMN IF NOT EXISTS onboarding_status text DEFAULT 'pending' CHECK (onboarding_status IN ('pending', 'in_progress', 'completed')),
ADD COLUMN IF NOT EXISTS health_score integer DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
ADD COLUMN IF NOT EXISTS account_manager text;

-- 3. Create 'lead_activities' table for detailed timelines
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'whatsapp', 'system')),
    description text NOT NULL,
    performed_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    created_by text -- store staff ID or 'system'
);

-- Index for querying activities by lead efficiently
CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_performed_at ON public.lead_activities(performed_at DESC);

-- Fix Row Level Security (RLS) for Leads
CREATE POLICY "Allow all access to leads" ON "public"."leads"
FOR ALL USING (true) WITH CHECK (true);


CREATE POLICY "Allow all access to pharmacies" ON "public"."pharmacies"
FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to lead_activities" ON "public"."lead_activities"
FOR ALL USING (true) WITH CHECK (true);

