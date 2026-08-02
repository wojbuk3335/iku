-- Unikalna nazwa użytkownika do publicznych linków /profile/[username]
alter table public.profiles
  add column if not exists username text;

-- Backfill z lokalnej części e-maila (tylko litery, cyfry, . _)
update public.profiles p
set username = lower(
  nullif(
    regexp_replace(split_part(coalesce(p.email, p.id::text), '@', 1), '[^a-zA-Z0-9._]', '', 'g'),
    ''
  )
)
where p.username is null;

-- Puste / zbyt krótkie → fallback z id
update public.profiles
set username = 'user_' || replace(left(id::text, 8), '-', '')
where username is null or length(username) < 3;

-- Unikalność przy kolizjach: doklej krótki sufiks z id
with dups as (
  select id, username,
    row_number() over (partition by lower(username) order by created_at, id) as rn
  from public.profiles
  where username is not null
)
update public.profiles p
set username = lower(p.username) || '_' || replace(left(p.id::text, 4), '-', '')
from dups d
where p.id = d.id and d.rn > 1;

-- Normalizacja do lowercase
update public.profiles set username = lower(username) where username <> lower(username);

alter table public.profiles
  alter column username set not null;

create unique index if not exists profiles_username_unique_idx
  on public.profiles (lower(username));

comment on column public.profiles.username is
  'Publiczny, unikalny identyfikator profilu (link /profile/[username])';

-- Trigger: ustaw username przy tworzeniu profilu
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  candidate text;
  suffix int := 0;
begin
  base_username := lower(
    nullif(
      regexp_replace(split_part(coalesce(new.email, new.id::text), '@', 1), '[^a-zA-Z0-9._]', '', 'g'),
      ''
    )
  );
  if base_username is null or length(base_username) < 3 then
    base_username := 'user_' || replace(left(new.id::text, 8), '-', '');
  end if;

  candidate := base_username;
  while exists (
    select 1 from public.profiles where lower(username) = candidate
  ) loop
    suffix := suffix + 1;
    candidate := base_username || suffix::text;
  end loop;

  insert into public.profiles (id, email, role, username)
  values (new.id, new.email, 'user', candidate)
  on conflict (id) do nothing;
  return new;
end;
$$;
