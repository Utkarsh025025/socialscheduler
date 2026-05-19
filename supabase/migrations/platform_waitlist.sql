-- ============================================================
-- platform_waitlist table
-- Stores early-access requests for platform integrations and billing.
-- Run this in Supabase → SQL Editor
-- ============================================================

create table if not exists public.platform_waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  platform      text not null,       -- e.g. 'instagram', 'linkedin', 'billing_pro'
  user_id       uuid references auth.users(id) on delete set null,
  requested_at  timestamptz not null default now(),

  -- Prevent duplicate (email, platform) combos
  unique (email, platform)
);

-- Index for quick lookup by platform
create index if not exists platform_waitlist_platform_idx
  on public.platform_waitlist (platform);

-- Allow authenticated and anonymous users to insert (public sign-ups)
alter table public.platform_waitlist enable row level security;

create policy "Anyone can join waitlist"
  on public.platform_waitlist for insert
  with check (true);

create policy "Users can view their own entries"
  on public.platform_waitlist for select
  using (auth.uid() = user_id);
