-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('company_admin', 'shareholder');

-- Create companies table
CREATE TABLE public.companies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    cin_number TEXT UNIQUE NOT NULL,
    registered_address TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create company_admins table (links auth users to companies)
CREATE TABLE public.company_admins (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Create shareholders table
CREATE TABLE public.shareholders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    shareholder_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    shares_held INTEGER NOT NULL DEFAULT 0,
    login_id TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    is_credential_used BOOLEAN NOT NULL DEFAULT false,
    credential_created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create voting_sessions table
CREATE TABLE public.voting_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create resolutions table
CREATE TABLE public.resolutions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voting_session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    resolution_type TEXT NOT NULL DEFAULT 'ordinary',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create votes table with audit trail
CREATE TABLE public.votes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    shareholder_id UUID NOT NULL REFERENCES public.shareholders(id) ON DELETE CASCADE,
    resolution_id UUID NOT NULL REFERENCES public.resolutions(id) ON DELETE CASCADE,
    vote_value TEXT NOT NULL CHECK (vote_value IN ('for', 'against', 'abstain')),
    voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    vote_hash TEXT NOT NULL,
    UNIQUE(shareholder_id, resolution_id)
);

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voting_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Function to get user's company_id
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id
    FROM public.company_admins
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- RLS Policies for companies
CREATE POLICY "Company admins can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (
    id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Company admins can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
    id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

-- RLS Policies for company_admins
CREATE POLICY "Users can view their own admin record"
ON public.company_admins
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS Policies for shareholders
CREATE POLICY "Company admins can view their shareholders"
ON public.shareholders
FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Company admins can insert shareholders"
ON public.shareholders
FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Company admins can update shareholders"
ON public.shareholders
FOR UPDATE
TO authenticated
USING (
    company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

CREATE POLICY "Company admins can delete shareholders"
ON public.shareholders
FOR DELETE
TO authenticated
USING (
    company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

-- RLS Policies for voting_sessions
CREATE POLICY "Company admins can manage voting sessions"
ON public.voting_sessions
FOR ALL
TO authenticated
USING (
    company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
);

-- RLS Policies for resolutions
CREATE POLICY "Company admins can manage resolutions"
ON public.resolutions
FOR ALL
TO authenticated
USING (
    voting_session_id IN (
        SELECT vs.id FROM public.voting_sessions vs
        WHERE vs.company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
    )
);

-- RLS Policies for votes
CREATE POLICY "Company admins can view votes for their sessions"
ON public.votes
FOR SELECT
TO authenticated
USING (
    shareholder_id IN (
        SELECT s.id FROM public.shareholders s
        WHERE s.company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
    )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shareholders_updated_at
    BEFORE UPDATE ON public.shareholders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_voting_sessions_updated_at
    BEFORE UPDATE ON public.voting_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();