create table if not exists follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_follower_idx  on follows(follower_id);
create index if not exists follows_following_idx on follows(following_id);

alter table follows enable row level security;

drop policy if exists "Users can see all follows" on follows;
drop policy if exists "Users can follow others" on follows;
drop policy if exists "Users can unfollow" on follows;

create policy "Users can see all follows"
  on follows for select
  using (true);

create policy "Users can follow others"
  on follows for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "Users can unfollow"
  on follows for delete
  to authenticated
  using (follower_id = auth.uid());
