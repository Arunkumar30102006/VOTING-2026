-- Add email tracking column to shareholders
ALTER TABLE public.shareholders 
ADD COLUMN IF NOT EXISTS is_meeting_email_sent BOOLEAN NOT NULL DEFAULT false;

-- Enable realtime for shareholders to track delivery status in UI
ALTER PUBLICATION supabase_realtime ADD TABLE public.shareholders;
