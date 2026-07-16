-- Event end datetime (duration range: starts_at → ends_at)
alter table public.events
  add column if not exists ends_at timestamptz;

update public.events
set ends_at = starts_at + interval '2 hours'
where ends_at is null;

alter table public.events
  alter column ends_at set not null;

create index if not exists events_ends_at_idx on public.events (ends_at);
