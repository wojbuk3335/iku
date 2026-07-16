-- Event recurrence: one-time or recurring
alter table public.events
  add column if not exists recurrence text not null default 'one_time'
  check (recurrence in ('one_time', 'recurring'));
