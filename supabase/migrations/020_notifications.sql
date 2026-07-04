create table if not exists notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  type       text        not null default 'system',
  title      text        not null,
  body       text,
  is_read    boolean     not null default false,
  metadata   jsonb,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx    on notifications(user_id);
create index if not exists notifications_created_at_idx on notifications(created_at desc);

alter table notifications enable row level security;

create policy "Users can view own notifications"
  on notifications for select
  using (user_id = auth.uid());

create policy "Users can update own notifications"
  on notifications for update
  using (user_id = auth.uid());

create policy "Users can delete own notifications"
  on notifications for delete
  using (user_id = auth.uid());

-- System / server can insert notifications for any user
create policy "Service role can insert notifications"
  on notifications for insert
  with check (true);
