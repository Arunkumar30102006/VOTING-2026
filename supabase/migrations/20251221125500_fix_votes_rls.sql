-- Fix RLS policies to allow voting by shareholders (who use custom auth, so are 'anon' to Supabase)

-- 1. Allow inserting votes
CREATE POLICY "Enable insert for all users" ON public.votes FOR INSERT WITH CHECK (true);

-- 2. Allow reading votes (so dashboard shows 'Voted' status)
CREATE POLICY "Enable select for all users" ON public.votes FOR SELECT USING (true);
