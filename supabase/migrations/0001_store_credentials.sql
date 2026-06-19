-- Adds encrypted credential storage + last-sync timestamp to stores.
-- Run in the Supabase SQL editor (or via the CLI) once.
alter table public.stores add column if not exists credentials_enc text;
alter table public.stores add column if not exists last_synced_at timestamptz;
