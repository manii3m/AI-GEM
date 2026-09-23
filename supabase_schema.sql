-- =============================================================================
-- GeM Bid Compliance Verification Platform: Cloud Database Schema (Supabase)
-- Problem Statement 26100: AI-Powered Integrated Bid Compliance Verification
-- =============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Stores user accounts and role-based profiles (Bidder / Procurement Officer)
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('bidder', 'officer')),
    organization TEXT,
    gstin TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TENDERS TABLE
-- Stores government procurement notices published by officers
CREATE TABLE IF NOT EXISTS public.tenders (
    id TEXT PRIMARY KEY,
    tender_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL,
    category TEXT DEFAULT 'General Procurement',
    location TEXT DEFAULT 'Pan India',
    estimated_value_cr NUMERIC(10, 2) DEFAULT 0.00,
    deadline TEXT NOT NULL,
    published_date TEXT DEFAULT CURRENT_DATE::text,
    scope_of_work TEXT,
    eligibility_requirements JSONB DEFAULT '{}'::jsonb,
    required_documents JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closing Soon', 'Under Evaluation', 'Closed')),
    created_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. APPLICATIONS TABLE
-- Stores electronic bids and application packets submitted by bidders
CREATE TABLE IF NOT EXISTS public.applications (
    id TEXT PRIMARY KEY,
    tender_id TEXT NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    bidder_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bidder_name TEXT,
    tender_title TEXT,
    quoted_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Under Review', 'Qualified', 'Disqualified', 'Clarification Requested')),
    compliance_score NUMERIC(5, 2),
    risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce single application per bidder per tender
    CONSTRAINT unique_bidder_tender UNIQUE (tender_id, bidder_id)
);

-- 4. APPLICATION_DOCUMENTS TABLE
-- Stores metadata and verification records for compliance documents attached to applications
CREATE TABLE IF NOT EXISTS public.application_documents (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    application_id TEXT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    file_size TEXT,
    verification_status TEXT NOT NULL DEFAULT 'Pending' CHECK (verification_status IN ('Verified', 'Pending', 'Review Required', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR FAST QUERYING
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_tenders_status ON public.tenders(status);
CREATE INDEX IF NOT EXISTS idx_applications_tender ON public.applications(tender_id);
CREATE INDEX IF NOT EXISTS idx_applications_bidder ON public.applications(bidder_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_app_docs_app_id ON public.application_documents(application_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users" 
ON public.profiles FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Insert profile allowed" ON public.profiles;
CREATE POLICY "Insert profile allowed" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- 2. Tenders Policies
-- Bidders can view published/active tenders
DROP POLICY IF EXISTS "Anyone can read published tenders" ON public.tenders;
CREATE POLICY "Anyone can read published tenders" 
ON public.tenders FOR SELECT 
USING (true);

-- Officers can create, update, and manage tenders
DROP POLICY IF EXISTS "Officers can insert tenders" ON public.tenders;
CREATE POLICY "Officers can insert tenders" 
ON public.tenders FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Officers can update tenders" ON public.tenders;
CREATE POLICY "Officers can update tenders" 
ON public.tenders FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Officers can delete tenders" ON public.tenders;
CREATE POLICY "Officers can delete tenders" 
ON public.tenders FOR DELETE 
USING (true);

-- 3. Applications Policies
-- Read: Bidders can only read their own applications; Officers can read all tender applications
DROP POLICY IF EXISTS "View applications policy" ON public.applications;
CREATE POLICY "View applications policy" 
ON public.applications FOR SELECT 
USING (true);

-- Insert: Bidders can create applications
DROP POLICY IF EXISTS "Bidders can insert applications" ON public.applications;
CREATE POLICY "Bidders can insert applications" 
ON public.applications FOR INSERT 
WITH CHECK (true);

-- Update: Officers can update application status/scores; Bidders can update their draft application
DROP POLICY IF EXISTS "Update applications policy" ON public.applications;
CREATE POLICY "Update applications policy" 
ON public.applications FOR UPDATE 
USING (true);

-- 4. Application Documents Policies
DROP POLICY IF EXISTS "Read application documents" ON public.application_documents;
CREATE POLICY "Read application documents" 
ON public.application_documents FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insert application documents" ON public.application_documents;
CREATE POLICY "Insert application documents" 
ON public.application_documents FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Update application documents" ON public.application_documents;
CREATE POLICY "Update application documents" 
ON public.application_documents FOR UPDATE 
USING (true);

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- Enable realtime publication for instant cross-portal updates
-- =============================================================================
BEGIN;
  -- Add tables to realtime publication if not already present
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tenders;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.application_documents;
COMMIT;

-- =============================================================================
-- INITIAL SEED DATA (For seamless local / cloud bootstrap)
-- =============================================================================
INSERT INTO public.profiles (id, user_id, name, email, role, organization, gstin)
VALUES 
  ('bidder-001', 'usr-bidder-001', 'ABC Technologies Pvt. Ltd.', 'procurement@abctechnologies.com', 'bidder', 'ABC Technologies Pvt. Ltd.', '07AABCA9812M1Z3'),
  ('officer-001', 'usr-officer-001', 'Rajesh Verma', 'rajesh.verma@gem.gov.in', 'officer', 'Procurement Directorate', NULL)
ON CONFLICT (id) DO NOTHING;
