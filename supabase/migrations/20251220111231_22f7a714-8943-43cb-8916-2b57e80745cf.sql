-- Allow authenticated users to insert into companies during registration
CREATE POLICY "Authenticated users can create a company"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to insert into company_admins during registration
CREATE POLICY "Authenticated users can create company admin record"
ON public.company_admins
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to insert into user_roles during registration
CREATE POLICY "Authenticated users can create their role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());