-- ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('company_admin', 'shareholder');
    END IF;
END $$;

-- TABLES
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    cin_number TEXT UNIQUE NOT NULL,
    registered_address TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, company_id)
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.shareholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    shareholder_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    shares_held INTEGER DEFAULT 0,
    login_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_credential_used BOOLEAN DEFAULT false,
    credential_created_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.voting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.resolutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voting_session_id UUID REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resolution_type TEXT DEFAULT 'ordinary',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shareholder_id UUID REFERENCES public.shareholders(id) ON DELETE CASCADE,
    resolution_id UUID REFERENCES public.resolutions(id) ON DELETE CASCADE,
    vote_value TEXT CHECK (vote_value IN ('for','against','abstain')),
    voted_at TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    vote_hash TEXT NOT NULL,
    UNIQUE(shareholder_id, resolution_id)
);

-- ENABLE RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- FUNCTIONS
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role); $$;

CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT company_id FROM public.company_admins WHERE user_id=_user_id LIMIT 1; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- TRIGGERS
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_companies_updated_at') THEN
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_shareholders_updated_at') THEN
CREATE TRIGGER update_shareholders_updated_at BEFORE UPDATE ON public.shareholders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='update_voting_sessions_updated_at') THEN
CREATE TRIGGER update_voting_sessions_updated_at BEFORE UPDATE ON public.voting_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
END IF; END $$;

-- POLICIES

-- Companies
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='company_view') THEN
CREATE POLICY company_view ON public.companies
FOR SELECT TO authenticated
USING (id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='company_update') THEN
CREATE POLICY company_update ON public.companies
FOR UPDATE TO authenticated
USING (id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

-- Company admins
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='admin_view') THEN
CREATE POLICY admin_view ON public.company_admins
FOR SELECT TO authenticated USING (user_id=auth.uid());
END IF; END $$;

-- User roles
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='role_view') THEN
CREATE POLICY role_view ON public.user_roles
FOR SELECT TO authenticated USING (user_id=auth.uid());
END IF; END $$;

-- Shareholders
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='shareholder_view') THEN
CREATE POLICY shareholder_view ON public.shareholders
FOR SELECT TO authenticated
USING (company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='shareholder_insert') THEN
CREATE POLICY shareholder_insert ON public.shareholders
FOR INSERT TO authenticated
WITH CHECK (company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='shareholder_update') THEN
CREATE POLICY shareholder_update ON public.shareholders
FOR UPDATE TO authenticated
USING (company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='shareholder_delete') THEN
CREATE POLICY shareholder_delete ON public.shareholders
FOR DELETE TO authenticated
USING (company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

-- Voting sessions
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='voting_manage') THEN
CREATE POLICY voting_manage ON public.voting_sessions
FOR ALL TO authenticated
USING (company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()));
END IF; END $$;

-- Resolutions
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='resolution_manage') THEN
CREATE POLICY resolution_manage ON public.resolutions
FOR ALL TO authenticated
USING (
  voting_session_id IN (
    SELECT id FROM public.voting_sessions
    WHERE company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid())
  )
)
WITH CHECK (
  voting_session_id IN (
    SELECT id FROM public.voting_sessions
    WHERE company_id IN (SELECT company_id FROM public.company_admins WHERE user_id=auth.uid())
  )
);
END IF; END $$;

-- Votes
DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='vote_view') THEN
CREATE POLICY vote_view ON public.votes
FOR SELECT TO authenticated
USING (
  shareholder_id IN (
    SELECT id FROM public.shareholders
    WHERE company_id IN (
      SELECT company_id FROM public.company_admins WHERE user_id=auth.uid()
    )
  )
);
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='vote_insert') THEN
CREATE POLICY vote_insert ON public.votes
FOR INSERT TO authenticated
WITH CHECK (
  shareholder_id IN (
    SELECT id FROM public.shareholders WHERE email = auth.email()
  )
);
END IF; END $$;

DO $$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='vote_self_view') THEN
CREATE POLICY vote_self_view ON public.votes
FOR SELECT TO authenticated
USING (
  shareholder_id IN (
    SELECT id FROM public.shareholders WHERE email = auth.email()
  )
);
END IF; END $$;
