-- Krok 2: zainteresowania użytkownika (onboarding)
-- Uruchom w Supabase: SQL Editor → New query → wklej → Run

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists interests text[] not null default '{}';

drop policy if exists "Users can update own profile" on public.profiles;

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
