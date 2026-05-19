-- ============================================================
-- CreatorPost — Supabase Database Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================


-- ============================================================
-- SECTION 1: EXTENSIONS
-- ============================================================
-- Enable UUID generation (needed for primary keys)
create extension if not exists "uuid-ossp";


-- ============================================================
-- SECTION 2: TABLES
-- ============================================================

-- ------------------------------------------------------------
-- TABLE: users
-- Stores public profile info for each signed-up user.
-- Linked to Supabase's built-in auth.users table.
-- ------------------------------------------------------------
create table if not exists public.users (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  full_name         text,
  avatar_url        text,
  plan              text not null default 'free' check (plan in ('free', 'pro', 'agency')),
  stripe_customer_id text,
  posts_this_month  integer not null default 0,
  ai_gens_this_month integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.users is 'Public user profiles. Linked 1-to-1 with auth.users.';

-- ------------------------------------------------------------
-- TABLE: connected_accounts
-- Stores OAuth tokens for each connected social media platform.
-- ------------------------------------------------------------
create table if not exists public.connected_accounts (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  platform          text not null check (platform in ('instagram','tiktok','youtube','linkedin','facebook','pinterest')),
  account_name      text,
  account_avatar    text,
  access_token      text not null,
  refresh_token     text,
  token_expires_at  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, platform)   -- one account per platform per user
);

comment on table public.connected_accounts is 'OAuth tokens for connected social media accounts.';

-- ------------------------------------------------------------
-- TABLE: posts
-- Every post a user creates, whether draft/scheduled/published.
-- ------------------------------------------------------------
create table if not exists public.posts (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.users(id) on delete cascade,
  content       text not null,
  image_url     text,
  platforms     text[] not null default '{}',   -- e.g. {"instagram","linkedin"}
  status        text not null default 'draft' check (status in ('draft','scheduled','published','failed')),
  scheduled_at  timestamptz,
  published_at  timestamptz,
  error_message text,
  qstash_message_id text,                        -- ID returned by QStash for tracking
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.posts is 'All posts created by users — draft, scheduled, published, or failed.';

-- ------------------------------------------------------------
-- TABLE: post_analytics
-- Performance metrics fetched from each platform after publishing.
-- ------------------------------------------------------------
create table if not exists public.post_analytics (
  id          uuid primary key default uuid_generate_v4(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  platform    text not null,
  likes       integer not null default 0,
  comments    integer not null default 0,
  shares      integer not null default 0,
  reach       integer not null default 0,
  impressions integer not null default 0,
  fetched_at  timestamptz not null default now()
);

comment on table public.post_analytics is 'Platform-level performance metrics per post.';

-- ------------------------------------------------------------
-- TABLE: waitlist
-- Email waitlist from the landing page.
-- ------------------------------------------------------------
create table if not exists public.waitlist (
  id         uuid primary key default uuid_generate_v4(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.waitlist is 'Landing page email waitlist signups.';


-- ============================================================
-- SECTION 3: INDEXES (speed up common queries)
-- ============================================================
create index if not exists idx_posts_user_id         on public.posts(user_id);
create index if not exists idx_posts_status          on public.posts(status);
create index if not exists idx_posts_scheduled_at    on public.posts(scheduled_at);
create index if not exists idx_posts_user_status     on public.posts(user_id, status);
create index if not exists idx_connected_user_id     on public.connected_accounts(user_id);
create index if not exists idx_analytics_post_id     on public.post_analytics(post_id);


-- ============================================================
-- SECTION 4: UPDATED_AT TRIGGER
-- Automatically updates the updated_at column on every row change.
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger set_updated_at_users
  before update on public.users
  for each row execute function public.handle_updated_at();

create or replace trigger set_updated_at_connected_accounts
  before update on public.connected_accounts
  for each row execute function public.handle_updated_at();

create or replace trigger set_updated_at_posts
  before update on public.posts
  for each row execute function public.handle_updated_at();


-- ============================================================
-- SECTION 5: AUTO-CREATE USER PROFILE ON SIGNUP
-- When someone signs up via Supabase Auth, automatically create
-- their row in the public.users table.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- Ensures users can ONLY see and edit their own data.
-- This is critical for security!
-- ============================================================

-- Enable RLS on all tables
alter table public.users               enable row level security;
alter table public.connected_accounts  enable row level security;
alter table public.posts               enable row level security;
alter table public.post_analytics      enable row level security;
alter table public.waitlist            enable row level security;

-- ---- USERS policies ----
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- ---- CONNECTED ACCOUNTS policies ----
create policy "Users can view own connected accounts"
  on public.connected_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert own connected accounts"
  on public.connected_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own connected accounts"
  on public.connected_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete own connected accounts"
  on public.connected_accounts for delete
  using (auth.uid() = user_id);

-- ---- POSTS policies ----
create policy "Users can view own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can insert own posts"
  on public.posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on public.posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

-- ---- POST ANALYTICS policies ----
create policy "Users can view analytics for own posts"
  on public.post_analytics for select
  using (
    auth.uid() = (
      select user_id from public.posts where id = post_analytics.post_id
    )
  );

-- ---- WAITLIST policies ----
create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  with check (true);


-- ============================================================
-- SECTION 7: STORAGE BUCKET FOR POST IMAGES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload images
create policy "Authenticated users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

-- Allow public read of all post images
create policy "Post images are publicly viewable"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- Allow users to delete their own images
create policy "Users can delete own post images"
  on storage.objects for delete
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- Done! Your database is ready.
-- ============================================================

-- ============================================================
-- SECTION 8: UTILITY FUNCTIONS
-- ============================================================

-- Increment the posts_this_month counter for a user.
-- Called from /api/posts after a new post is created.
create or replace function public.increment_posts_count(user_id uuid)
returns void as $$
begin
  update public.users
  set posts_this_month = posts_this_month + 1
  where id = user_id;
end;
$$ language plpgsql security definer;

-- Reset monthly counters (call this via a cron job on the 1st of each month).
-- Example: select reset_monthly_counters();
create or replace function public.reset_monthly_counters()
returns void as $$
begin
  update public.users
  set posts_this_month = 0,
      ai_gens_this_month = 0;
end;
$$ language plpgsql security definer;
