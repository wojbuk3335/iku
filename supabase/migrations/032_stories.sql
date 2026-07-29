-- Relacje (Stories) — wygasają po 24h
create table if not exists public.stories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references public.profiles(id) on delete cascade,
  media_url  text        not null,
  caption    text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create index if not exists stories_user_id_idx on public.stories(user_id);
create index if not exists stories_expires_at_idx on public.stories(expires_at);

create table if not exists public.story_views (
  story_id   uuid        not null references public.stories(id) on delete cascade,
  viewer_id  uuid        not null references public.profiles(id) on delete cascade,
  viewed_at  timestamptz not null default now(),
  primary key (story_id, viewer_id)
);

create index if not exists story_views_viewer_idx on public.story_views(viewer_id);

alter table public.stories enable row level security;
alter table public.story_views enable row level security;

-- Własne + osób, które obserwuję
drop policy if exists "Users can view own and following stories" on public.stories;
create policy "Users can view own and following stories"
  on public.stories for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.follows f
      where f.follower_id = auth.uid()
        and f.following_id = stories.user_id
    )
  );

drop policy if exists "Users can create own stories" on public.stories;
create policy "Users can create own stories"
  on public.stories for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own stories" on public.stories;
create policy "Users can delete own stories"
  on public.stories for delete
  to authenticated
  using (user_id = auth.uid());

-- Views: każdy może dodawać swoje, właściciel relacji i viewer widzą
drop policy if exists "Users can view relevant story views" on public.story_views;
create policy "Users can view relevant story views"
  on public.story_views for select
  to authenticated
  using (
    viewer_id = auth.uid()
    or exists (
      select 1 from public.stories s
      where s.id = story_views.story_id and s.user_id = auth.uid()
    )
  );

drop policy if exists "Users can mark stories viewed" on public.story_views;
create policy "Users can mark stories viewed"
  on public.story_views for insert
  to authenticated
  with check (viewer_id = auth.uid());

-- Storage bucket na media relacji
insert into storage.buckets (id, name, public)
values ('stories', 'stories', true)
on conflict (id) do update set public = true;

drop policy if exists "Public read stories media" on storage.objects;
drop policy if exists "Users can upload own stories" on storage.objects;
drop policy if exists "Users can update own stories" on storage.objects;
drop policy if exists "Users can delete own stories media" on storage.objects;

create policy "Public read stories media"
  on storage.objects for select
  using (bucket_id = 'stories');

create policy "Users can upload own stories"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update own stories"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own stories media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stories'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
