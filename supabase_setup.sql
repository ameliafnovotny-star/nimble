-- Run this entire file in the Supabase SQL Editor
-- (supabase.com → your project → SQL Editor → New query → paste → Run)

create table if not exists public.app_state (
  user_id uuid references auth.users(id) on delete cascade primary key,
  categories jsonb not null default '[]',
  workouts jsonb not null default '[]',
  scheduled_workouts jsonb not null default '[]',
  completed_sessions jsonb not null default '[]',
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

create policy "Users can read own state"
  on public.app_state for select
  using (auth.uid() = user_id);

create policy "Users can insert own state"
  on public.app_state for insert
  with check (auth.uid() = user_id);

create policy "Users can update own state"
  on public.app_state for update
  using (auth.uid() = user_id);

create policy "Users can delete own state"
  on public.app_state for delete
  using (auth.uid() = user_id);
