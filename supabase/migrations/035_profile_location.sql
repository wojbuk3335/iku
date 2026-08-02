-- Lokalizacja / miasto na profilu użytkownika
alter table public.profiles
  add column if not exists location text;

comment on column public.profiles.location is
  'Miasto / lokalizacja wyświetlana na profilu';
