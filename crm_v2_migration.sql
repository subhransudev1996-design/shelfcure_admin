-- ==============================================================================
-- ShelfCure CRM v2 — Product Sales Pipeline Migration
-- ==============================================================================
-- Run this in your Supabase SQL Editor.
-- This migrates from the service-agency model to a product sales pipeline.

-- 1. Add new columns to 'leads' table
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS pipeline_stage text DEFAULT 'new',
ADD COLUMN IF NOT EXISTS lost_reason text,
ADD COLUMN IF NOT EXISTS demo_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS demo_notes text,
ADD COLUMN IF NOT EXISTS trial_start_date date,
ADD COLUMN IF NOT EXISTS trial_end_date date,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS pincode text;

-- 2. Migrate existing status values to new pipeline_stage
UPDATE public.leads SET pipeline_stage = 'new' WHERE status = 'new';
UPDATE public.leads SET pipeline_stage = 'contacted' WHERE status = 'contacted';
UPDATE public.leads SET pipeline_stage = 'follow_up' WHERE status = 'interested';
UPDATE public.leads SET pipeline_stage = 'demo_scheduled' WHERE status = 'negotiation';
UPDATE public.leads SET pipeline_stage = 'trial' WHERE status = 'onboarding';
UPDATE public.leads SET pipeline_stage = 'won' WHERE status = 'closed';

-- 3. Update source values — ensure the column has clean data
-- (source column already exists, just ensure valid values)

-- 4. Add check constraint for pipeline_stage (optional, enforces valid values)
-- We drop if exists first to make this idempotent
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'leads_pipeline_stage_check' AND table_name = 'leads') THEN
        ALTER TABLE public.leads DROP CONSTRAINT leads_pipeline_stage_check;
    END IF;
END$$;

ALTER TABLE public.leads
ADD CONSTRAINT leads_pipeline_stage_check
CHECK (pipeline_stage IN ('new', 'contacted', 'follow_up', 'demo_scheduled', 'demo_done', 'trial', 'won', 'lost'));

-- 5. Update lead_activities type constraint to include new types
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'lead_activities_type_check' AND table_name = 'lead_activities') THEN
        ALTER TABLE public.lead_activities DROP CONSTRAINT lead_activities_type_check;
    END IF;
END$$;

ALTER TABLE public.lead_activities
ADD CONSTRAINT lead_activities_type_check
CHECK (type IN ('call', 'email', 'meeting', 'note', 'whatsapp', 'system', 'demo', 'trial_issued', 'purchase', 'lost'));

-- 6. Create index for pipeline_stage queries
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage ON public.leads(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_leads_demo_date ON public.leads(demo_date);
CREATE INDEX IF NOT EXISTS idx_leads_trial_end_date ON public.leads(trial_end_date);

-- 7. Ensure RLS policies exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to leads' AND tablename = 'leads') THEN
        CREATE POLICY "Allow all access to leads" ON public.leads FOR ALL USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all access to lead_activities' AND tablename = 'lead_activities') THEN
        CREATE POLICY "Allow all access to lead_activities" ON public.lead_activities FOR ALL USING (true) WITH CHECK (true);
    END IF;
END$$;

-- Done! Your database is now ready for the Product Sales Pipeline.
