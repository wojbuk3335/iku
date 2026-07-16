-- Google Places metadata for precise event locations
alter table public.events
  add column if not exists place_id text,
  add column if not exists location_name text;

create index if not exists events_place_id_idx on public.events (place_id)
  where place_id is not null;
