-- Definicje odznak
create table if not exists badges (
  id          text primary key,
  label       text not null,
  emoji       text not null,
  description text not null
);

insert into badges (id, label, emoji, description) values
  ('first_event',  'Pierwsze wydarzenie', '🎟️', 'Poszedłeś na swoje pierwsze wydarzenie'),
  ('early_bird',   'Wczesny ptak',        '🌅', 'Jeden z pierwszych 100 użytkowników aplikacji'),
  ('collector',    'Kolekcjoner',         '🔖', 'Zapisałeś 3 lub więcej wydarzeń'),
  ('active',       'Aktywny',             '🎯', 'Idziesz na 3 lub więcej wydarzeń')
on conflict (id) do update
  set label = excluded.label,
      emoji = excluded.emoji,
      description = excluded.description;

-- Odznaki przyznane użytkownikom
create table if not exists user_badges (
  user_id    uuid not null references profiles(id) on delete cascade,
  badge_id   text not null references badges(id)   on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create index if not exists user_badges_user_idx on user_badges(user_id);

alter table user_badges enable row level security;

drop policy if exists "Users can see own badges" on user_badges;
drop policy if exists "Anyone can see badges" on user_badges;

create policy "Anyone can see badges"
  on user_badges for select
  using (true);
