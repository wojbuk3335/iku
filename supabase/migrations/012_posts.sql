create table if not exists posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  event_id    uuid references events(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists posts_user_idx  on posts(user_id);
create index if not exists posts_event_idx on posts(event_id);
create index if not exists posts_created_idx on posts(created_at desc);

alter table posts enable row level security;

drop policy if exists "Anyone can read posts" on posts;
drop policy if exists "Users can create posts" on posts;
drop policy if exists "Users can delete own posts" on posts;

create policy "Anyone can read posts"
  on posts for select using (true);

create policy "Users can create posts"
  on posts for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can delete own posts"
  on posts for delete to authenticated
  using (user_id = auth.uid());

-- Reakcje (lajki)
create table if not exists post_reactions (
  post_id    uuid not null references posts(id) on delete cascade,
  user_id    uuid not null references profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

alter table post_reactions enable row level security;

drop policy if exists "Anyone can read reactions" on post_reactions;
drop policy if exists "Users can react" on post_reactions;
drop policy if exists "Users can unreact" on post_reactions;

create policy "Anyone can read reactions"
  on post_reactions for select using (true);

create policy "Users can react"
  on post_reactions for insert to authenticated
  with check (user_id = auth.uid());

create policy "Users can unreact"
  on post_reactions for delete to authenticated
  using (user_id = auth.uid());
