-- Enable realtime for notifications (live updates without refresh)
do $$
begin
  alter publication supabase_realtime add table notifications;
exception
  when duplicate_object then null;
end $$;
