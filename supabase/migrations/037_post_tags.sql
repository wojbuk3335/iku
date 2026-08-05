-- Oznaczenia użytkowników na postach (jak tag na Instagramie)
create table if not exists public.post_tags (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_tags_user_idx on public.post_tags(user_id);
create index if not exists post_tags_post_idx on public.post_tags(post_id);

alter table public.post_tags enable row level security;

drop policy if exists "Anyone can read post tags" on public.post_tags;
drop policy if exists "Authors can tag on own posts" on public.post_tags;
drop policy if exists "Authors can untag on own posts" on public.post_tags;

create policy "Anyone can read post tags"
  on public.post_tags for select using (true);

-- Tylko autor posta może dodać oznaczenia
create policy "Authors can tag on own posts"
  on public.post_tags for insert to authenticated
  with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
    and user_id <> auth.uid()
  );

create policy "Authors can untag on own posts"
  on public.post_tags for delete to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.user_id = auth.uid()
    )
  );

comment on table public.post_tags is
  'Użytkownicy oznaczeni na poście; widoczni w zakładce Oznaczone na profilu.';
