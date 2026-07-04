-- Add rarity column to badges
alter table badges add column if not exists rarity text not null default 'Powszechna';

-- Update existing badges rarity
update badges set rarity = 'Powszechna' where id = 'first_event';
update badges set rarity = 'Rzadka'     where id = 'early_bird';
update badges set rarity = 'Rzadka'     where id = 'collector';
update badges set rarity = 'Rzadka'     where id = 'active';

-- Add new badges (from Figma design)
insert into badges (id, label, emoji, description, rarity) values
  ('regular_participant',   'Stały Uczestnik',       '📅', 'Udział w 5 wydarzeniach',                    'Powszechna'),
  ('event_veteran',         'Weteran Wydarzeń',      '🏆', 'Udział w 20 wydarzeniach',                   'Epicka'),
  ('community_ambassador',  'Ambasador Społeczności', '💎', 'Obserwuj 10 osób na IKU',                   'Legendarna'),
  ('trendsetter',           'Trendsetter',            '⚡', 'Pierwszy zapis na popularne wydarzenie',     'Rzadka'),
  ('night_player',          'Nocny Gracz',            '🌙', 'Udział w 10 wydarzeniach nocnych',           'Rzadka'),
  ('explorer',              'Eksplorator',            '🧭', 'Uczestnik wydarzeń z 5 różnych kategorii',  'Rzadka'),
  ('weekend_explorer',      'Weekendowy Odkrywca',    '🗺️', 'Uczestnik 3 wydarzeń w jeden weekend',      'Powszechna'),
  ('top_participant',       'Top uczestnik',          '🥇', 'Udział w 20 wydarzeniach',                   'Epicka')
on conflict (id) do update
  set label       = excluded.label,
      emoji       = excluded.emoji,
      description = excluded.description,
      rarity      = excluded.rarity;
