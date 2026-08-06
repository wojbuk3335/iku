-- Wiele mediów w poście (kolaż zdjęć + wideo)
alter table public.posts
  add column if not exists media_urls jsonb not null default '[]'::jsonb;

-- Backfill ze starego image_url
update public.posts
set media_urls = jsonb_build_array(
  jsonb_build_object('url', image_url, 'type', 'image')
)
where image_url is not null
  and image_url <> ''
  and (media_urls is null or media_urls = '[]'::jsonb);

-- Limit pliku w buckecie (wideo do ~50 MB)
update storage.buckets
set file_size_limit = 52428800
where id = 'post-images';
