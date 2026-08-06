-- Zapisane posty użytkowników
create table if not exists public.saved_posts (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists saved_posts_user_idx on public.saved_posts(user_id, created_at desc);
create index if not exists saved_posts_post_idx on public.saved_posts(post_id);

alter table public.saved_posts enable row level security;

drop policy if exists "Users can read own saved posts" on public.saved_posts;
drop policy if exists "Users can save posts" on public.saved_posts;
drop policy if exists "Users can unsave posts" on public.saved_posts;

create policy "Users can read own saved posts"
  on public.saved_posts for select to authenticated
  using (user_id = auth.uid());

create policy "Users can save posts"
  on public.saved_posts for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can unsave posts"
  on public.saved_posts for delete to authenticated
  using (user_id = auth.uid());
