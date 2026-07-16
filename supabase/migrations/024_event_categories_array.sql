-- Add categories array column to events table
alter table events
  add column if not exists categories text[] not null default '{}';

-- Populate categories from existing category column
update events
  set categories = array[category]
  where array_length(categories, 1) is null or array_length(categories, 1) = 0;
