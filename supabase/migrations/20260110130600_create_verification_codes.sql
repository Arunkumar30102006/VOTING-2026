-- Create a table for temporary verification codes
create table if not exists public.verification_codes (
  email text primary key,
  code text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Enable RLS (though mostly accessed via functions)
alter table public.verification_codes enable row level security;

-- Policy: Allow anyone to insert/update? No, we will strictly use Edge Functions.
-- But for development transparency, we might want to allow reading? 
-- SAFEST: Only service_role (Edge Functions) can access.

-- Clean up cron (optional, but good practice for real DBs)
-- For now, we rely on the implementation to check validility or overwrite old codes.
