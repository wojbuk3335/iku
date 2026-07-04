-- Dodaj kolumnę image_url do posts
alter table posts add column if not exists image_url text;

-- Bucket na zdjęcia postów
insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

-- Polityki storage dla post-images
drop policy if exists "Anyone can view post images" on storage.objects;
drop policy if exists "Auth users can upload post images" on storage.objects;
drop policy if exists "Users can delete own post images" on storage.objects;

create policy "Anyone can view post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Auth users can upload post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.role() = 'authenticated');

create policy "Users can delete own post images"
  on storage.objects for delete
  using (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);
