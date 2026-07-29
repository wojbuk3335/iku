-- Widoczność profilu: publiczny (false) / prywatny (true)
alter table public.profiles
  add column if not exists is_private boolean not null default false;

comment on column public.profiles.is_private is
  'true = profil prywatny (nie pojawia się w propozycjach/wyszukiwaniu dla obcych)';
