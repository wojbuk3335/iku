-- Krok 6: uczestnictwo użytkownika (Idę / Zapisz)
-- Uruchom w Supabase: SQL Editor → New query → wklej → Run

create table public.event_participants (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  status text not null check (status in ('going', 'saved')),
  created_at timestamptz not null default now(),
  primary key (user_id, event_id, status)
);

create index event_participants_event_id_idx on public.event_participants (event_id);
create index event_participants_user_id_idx on public.event_participants (user_id);

alter table public.event_participants enable row level security;

-- Wszyscy mogą liczyć uczestników (np. na kartach feedu)
create policy "Anyone can read event participants"
  on public.event_participants
  for select
  using (true);

create policy "Users can add own participation"
  on public.event_participants
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can remove own participation"
  on public.event_participants
  for delete
  to authenticated
  using (auth.uid() = user_id);
