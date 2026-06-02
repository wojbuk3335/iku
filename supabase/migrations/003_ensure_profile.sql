-- Krok 3: profil tworzy się automatycznie przy rejestracji (backup)
-- Uruchom w Supabase: SQL Editor → New query → wklej → Run

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- Upewnij się, że trigger istnieje
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Brakujące profile dla istniejących kont (np. w.bukowski.98@gmail.com)
insert into public.profiles (id, email, role)
select u.id, u.email, 'user'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
