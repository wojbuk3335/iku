-- Współrzędne lokalizacji profilu (z Google Places, jak przy wydarzeniach)
alter table public.profiles
  add column if not exists location_name text;

alter table public.profiles
  add column if not exists latitude double precision;

alter table public.profiles
  add column if not exists longitude double precision;

alter table public.profiles
  add column if not exists place_id text;
