-- Krok 5: okładki wydarzeń (Supabase Storage)
-- Uruchom w Supabase: SQL Editor → New query → wklej → Run

insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read event covers" on storage.objects;
drop policy if exists "Admins and creators can upload event covers" on storage.objects;
drop policy if exists "Users can update own event covers" on storage.objects;
drop policy if exists "Users can delete own event covers" on storage.objects;

create policy "Public read event covers"
  on storage.objects
  for select
  using (bucket_id = 'event-covers');

create policy "Admins and creators can upload event covers"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-covers'
    and exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role in ('admin', 'creator')
    )
  );

create policy "Users can update own event covers"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own event covers"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-covers'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
