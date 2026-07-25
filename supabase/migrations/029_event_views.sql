-- Wyświetlenia wydarzeń (na razie każde otwarcie strony = 1 view)

create table if not exists public.event_views (
  id         uuid        primary key default gen_random_uuid(),
  event_id   uuid        not null references public.events (id) on delete cascade,
  viewer_id  uuid        references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists event_views_event_id_idx
  on public.event_views (event_id);

create index if not exists event_views_created_at_idx
  on public.event_views (created_at desc);

create index if not exists event_views_event_created_idx
  on public.event_views (event_id, created_at desc);

alter table public.event_views enable row level security;

-- Zalogowany użytkownik zapisuje własne wyświetlenie
create policy "Users can insert own event views"
  on public.event_views
  for insert
  to authenticated
  with check (auth.uid() = viewer_id);

-- Twórca wydarzenia widzi wyświetlenia swoich eventów
create policy "Creators can read views on own events"
  on public.event_views
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events e
      where e.id = event_views.event_id
        and e.created_by = auth.uid()
    )
  );
