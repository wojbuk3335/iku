-- Add bio field to profiles
alter table profiles
  add column if not exists bio text;
