-- Dodaj politykę INSERT do user_badges (brakło jej w 011)
drop policy if exists "Users can insert own badges" on user_badges;

create policy "Users can insert own badges"
  on user_badges for insert
  with check (true);
