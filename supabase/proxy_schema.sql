-- Proxy Delegations Table
CREATE TABLE IF NOT EXISTS public.proxy_delegations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    delegator_id UUID REFERENCES public.shareholders(id) ON DELETE CASCADE,
    proxy_id UUID REFERENCES public.shareholders(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(delegator_id, session_id)
);

-- Enable RLS
ALTER TABLE public.proxy_delegations ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Delegators can view their own delegations
CREATE POLICY delegator_view ON public.proxy_delegations
FOR SELECT TO authenticated
USING (delegator_id IN (SELECT id FROM public.shareholders WHERE email = auth.email()));

-- 2. Proxies can view delegations assigned to them
CREATE POLICY proxy_view ON public.proxy_delegations
FOR SELECT TO authenticated
USING (proxy_id IN (SELECT id FROM public.shareholders WHERE email = auth.email()));

-- 3. Delegators can insert their own delegations
CREATE POLICY delegator_insert ON public.proxy_delegations
FOR INSERT TO authenticated
WITH CHECK (delegator_id IN (SELECT id FROM public.shareholders WHERE email = auth.email()));

-- 4. Delegators can update/revoke their own delegations
CREATE POLICY delegator_update ON public.proxy_delegations
FOR UPDATE TO authenticated
USING (delegator_id IN (SELECT id FROM public.shareholders WHERE email = auth.email()));

-- 5. Company Admins can view all delegations in their company
CREATE POLICY admin_proxy_view ON public.proxy_delegations
FOR SELECT TO authenticated
USING (
  session_id IN (
    SELECT id FROM public.voting_sessions
    WHERE company_id IN (SELECT company_id FROM public.company_admins WHERE user_id = auth.uid())
  )
);
