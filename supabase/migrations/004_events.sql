-- Krok 4: tabela events (wydarzenia)
-- Uruchom w Supabase: SQL Editor → New query → wklej → Run

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text not null check (
    category in (
      'muzyka',
      'sport',
      'kultura',
      'jedzenie',
      'tech',
      'kluby',
      'dzieci',
      'seniorzy'
    )
  ),
  starts_at timestamptz not null,
  location text not null,
  cover_url text,
  status text not null default 'published' check (status in ('draft', 'published', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index events_starts_at_idx on public.events (starts_at);
create index events_category_idx on public.events (category);
create index events_created_by_idx on public.events (created_by);

alter table public.events enable row level security;

-- Wszyscy mogą przeglądać opublikowane wydarzenia (feed)
create policy "Published events are public"
  on public.events
  for select
  using (status = 'published');

-- Admin i creator widzą też szkice i anulowane (panel twórcy)
create policy "Event managers can view all own events"
  on public.events
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
    or created_by = auth.uid()
  );

create policy "Admins and creators can create events"
  on public.events
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('admin', 'creator')
    )
    and created_by = auth.uid()
  );

create policy "Admins and creators can update events"
  on public.events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
    or created_by = auth.uid()
  )
  with check (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('admin', 'creator')
    )
  );

create policy "Admins and creators can delete events"
  on public.events
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
    )
    or created_by = auth.uid()
  );

create or replace function public.set_events_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at
  before update on public.events
  for each row
  execute function public.set_events_updated_at();
