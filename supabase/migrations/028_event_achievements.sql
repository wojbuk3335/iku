-- Event-scoped achievements (Odznaki przypisane do wydarzenia)
create table if not exists public.event_achievements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  created_by uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 100),
  description text not null check (char_length(description) between 1 and 500),
  icon text not null default 'trophy',
  color text not null default '#8b5cf6',
  background text not null default '#151022',
  style text not null default 'solid' check (style in ('solid', 'gradient', 'outline')),
  custom_image_url text,
  unlock_type text not null default 'event_attendance'
    check (unlock_type in (
      'event_attendance',
      'first_attendance',
      'event_count',
      'recurring_count',
      'complete_cycle',
      'regular_attendance',
      'manual',
      'winner',
      'podium',
      'mvp',
      'event_record'
    )),
  unlock_threshold integer,
  has_reward boolean not null default false,
  reward_label text,
  visibility text not null default 'visible'
    check (visibility in ('visible', 'hidden', 'after_unlock')),
  status text not null default 'active'
    check (status in ('active', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists event_achievements_event_id_idx
  on public.event_achievements (event_id);

create index if not exists event_achievements_created_by_idx
  on public.event_achievements (created_by);

create table if not exists public.event_achievement_awards (
  id uuid primary key default gen_random_uuid(),
  achievement_id uuid not null references public.event_achievements (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  awarded_at timestamptz not null default now(),
  awarded_by uuid references public.profiles (id) on delete set null,
  unique (achievement_id, user_id)
);

create index if not exists event_achievement_awards_user_idx
  on public.event_achievement_awards (user_id);

create index if not exists event_achievement_awards_achievement_idx
  on public.event_achievement_awards (achievement_id);

alter table public.event_achievements enable row level security;
alter table public.event_achievement_awards enable row level security;

-- Achievements: public can see active+visible ones; creators see all own event achievements
drop policy if exists "Anyone can view visible event achievements" on public.event_achievements;
create policy "Anyone can view visible event achievements"
  on public.event_achievements for select
  using (
    (status = 'active' and visibility = 'visible')
    or created_by = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "Creators can insert event achievements" on public.event_achievements;
create policy "Creators can insert event achievements"
  on public.event_achievements for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from public.events e
      where e.id = event_id
        and e.created_by = auth.uid()
    )
  );

drop policy if exists "Creators can update event achievements" on public.event_achievements;
create policy "Creators can update event achievements"
  on public.event_achievements for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "Creators can delete event achievements" on public.event_achievements;
create policy "Creators can delete event achievements"
  on public.event_achievements for delete
  to authenticated
  using (created_by = auth.uid());

-- Awards: anyone can read; insert by self or event creator
drop policy if exists "Anyone can view achievement awards" on public.event_achievement_awards;
create policy "Anyone can view achievement awards"
  on public.event_achievement_awards for select
  using (true);

drop policy if exists "Creators can award achievements" on public.event_achievement_awards;
create policy "Creators can award achievements"
  on public.event_achievement_awards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.event_achievements a
      where a.id = achievement_id
        and a.created_by = auth.uid()
    )
    or user_id = auth.uid()
  );

create or replace function public.set_event_achievements_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists event_achievements_updated_at on public.event_achievements;
create trigger event_achievements_updated_at
  before update on public.event_achievements
  for each row
  execute function public.set_event_achievements_updated_at();
