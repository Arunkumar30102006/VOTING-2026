-- Create nominees table for director/candidate nominations
CREATE TABLE public.nominees (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    voting_session_id UUID NOT NULL REFERENCES public.voting_sessions(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    nominee_name TEXT NOT NULL,
    nominee_email TEXT NOT NULL,
    designation TEXT,
    qualification TEXT,
    experience_years INTEGER,
    bio TEXT,
    photo_url TEXT,
    is_email_sent BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on nominees table
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

-- RLS policies for nominees
CREATE POLICY "Company admins can manage nominees"
ON public.nominees
FOR ALL
USING (
    company_id IN (
        SELECT company_admins.company_id
        FROM company_admins
        WHERE company_admins.user_id = auth.uid()
    )
);

-- Add meeting-related columns to voting_sessions
ALTER TABLE public.voting_sessions 
ADD COLUMN IF NOT EXISTS meeting_link TEXT,
ADD COLUMN IF NOT EXISTS meeting_password TEXT,
ADD COLUMN IF NOT EXISTS meeting_platform TEXT DEFAULT 'zoom',
ADD COLUMN IF NOT EXISTS voting_instructions TEXT,
ADD COLUMN IF NOT EXISTS is_meeting_emails_sent BOOLEAN NOT NULL DEFAULT false;

-- Create trigger for nominees updated_at
CREATE TRIGGER update_nominees_updated_at
BEFORE UPDATE ON public.nominees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for nominees
ALTER PUBLICATION supabase_realtime ADD TABLE public.nominees;