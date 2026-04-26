-- ============================================================
--  RedlineAI – Supabase Schema
--  Run this in Supabase SQL Editor
-- ============================================================

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id             uuid references auth.users(id) on delete cascade primary key,
  email          text not null,
  plan           text not null default 'free',   -- free | pro | business
  scans_used     integer not null default 0,
  scan_month     text not null default to_char(current_date, 'YYYY-MM'),
  created_at     timestamptz not null default now()
);

-- 2. Scans history
create table public.scans (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  filename       text,
  high_count     integer not null default 0,
  medium_count   integer not null default 0,
  low_count      integer not null default 0,
  summary        text,
  result         jsonb not null,
  created_at     timestamptz not null default now()
);

-- 3. Row Level Security
alter table public.profiles enable row level security;
alter table public.scans    enable row level security;

create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

create policy "own scans select" on public.scans for select using (auth.uid() = user_id);
create policy "own scans insert" on public.scans for insert with check (auth.uid() = user_id);

-- 4. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
