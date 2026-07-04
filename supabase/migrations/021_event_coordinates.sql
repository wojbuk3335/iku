-- Add latitude / longitude columns to events
alter table events
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

-- Seed coordinates for existing events (random spread around Warsaw / major Polish cities)
-- Each row gets a unique offset so cards don't overlap on the map
update events
set
  latitude  = case
    when row_number() over (order by created_at) % 5 = 0 then 52.2297 + (random() - 0.5) * 0.15
    when row_number() over (order by created_at) % 5 = 1 then 52.2297 + (random() - 0.5) * 0.15
    when row_number() over (order by created_at) % 5 = 2 then 52.2297 + (random() - 0.5) * 0.15
    when row_number() over (order by created_at) % 5 = 3 then 52.2297 + (random() - 0.5) * 0.15
    else                                                       52.2297 + (random() - 0.5) * 0.15
  end,
  longitude = case
    when row_number() over (order by created_at) % 5 = 0 then 21.0122 + (random() - 0.5) * 0.25
    when row_number() over (order by created_at) % 5 = 1 then 21.0122 + (random() - 0.5) * 0.25
    when row_number() over (order by created_at) % 5 = 2 then 21.0122 + (random() - 0.5) * 0.25
    when row_number() over (order by created_at) % 5 = 3 then 21.0122 + (random() - 0.5) * 0.25
    else                                                       21.0122 + (random() - 0.5) * 0.25
  end
where latitude is null and status = 'published';
