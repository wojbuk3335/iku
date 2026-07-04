create table if not exists post_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references posts(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 300),
  created_at  timestamptz not null default now()
);

create index if not exists post_comments_post_idx on post_comments(post_id);
create index if not exists post_comments_user_idx on post_comments(user_id);

alter table post_comments enable row level security;

create policy "Anyone can read comments"
  on post_comments for select using (true);

create policy "Auth users can insert comments"
  on post_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on post_comments for delete
  using (auth.uid() = user_id);
