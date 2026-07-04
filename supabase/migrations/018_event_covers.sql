-- Storage bucket for event cover images
insert into storage.buckets (id, name, public)
values ('event-covers', 'event-covers', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view event covers"       on storage.objects;
drop policy if exists "Auth users can upload event covers" on storage.objects;
drop policy if exists "Users can delete own event covers"  on storage.objects;

create policy "Anyone can view event covers"
  on storage.objects for select
  using (bucket_id = 'event-covers');

create policy "Auth users can upload event covers"
  on storage.objects for insert
  with check (bucket_id = 'event-covers' and auth.role() = 'authenticated');

create policy "Users can delete own event covers"
  on storage.objects for delete
  using (bucket_id = 'event-covers' and auth.uid()::text = (storage.foldername(name))[1]);
