-- Krok 1: tabela profiles (role: user | admin | creator)
-- Uruchom w Supabase: SQL Editor → New query → wklej → Run

create table public.profiles (
  id uuid not null references auth.users on delete cascade primary key,
  email text,
  role text not null default 'user' check (role in ('user', 'admin', 'creator')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Użytkownik może odczytać tylko swój profil
create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- Po rejestracji / pierwszym logowaniu: automatyczny profil z rolą "user"
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Użytkownicy, którzy logowali się PRZED utworzeniem tabeli (np. Ty)
insert into public.profiles (id, email, role)
select id, email, 'user'
from auth.users
on conflict (id) do nothing;
