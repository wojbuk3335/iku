create table if not exists custom_badges (
  id               uuid        primary key default gen_random_uuid(),
  created_by       uuid        not null references profiles(id) on delete cascade,
  name             text        not null check (char_length(name) between 1 and 100),
  short_description text       not null check (char_length(short_description) between 1 and 100),
  full_description text,
  icon             text        not null default 'star',
  icon_scale       integer     not null default 100 check (icon_scale between 10 and 100),
  rarity           text        not null default 'Powszechna',
  unlock_condition text        not null default 'event_participation',
  visibility       text        not null default 'public',
  reward_type      text        not null default 'none',
  created_at       timestamptz not null default now()
);

create index if not exists custom_badges_created_by_idx on custom_badges(created_by);

alter table custom_badges enable row level security;

create policy "Users can view public or own custom badges"
  on custom_badges for select
  using (visibility = 'public' or created_by = auth.uid());

create policy "Users can create custom badges"
  on custom_badges for insert
  with check (created_by = auth.uid());

create policy "Users can update own custom badges"
  on custom_badges for update
  using (created_by = auth.uid());

create policy "Users can delete own custom badges"
  on custom_badges for delete
  using (created_by = auth.uid());
