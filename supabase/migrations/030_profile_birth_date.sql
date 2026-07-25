-- Data urodzenia w profilu (demografika / edycja profilu)

alter table public.profiles
  add column if not exists birth_date date;

comment on column public.profiles.birth_date is 'Data urodzenia użytkownika (do demografiki i edycji profilu)';
