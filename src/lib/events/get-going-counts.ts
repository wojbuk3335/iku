import { createClient } from "@/lib/supabase/server";

export async function getGoingCountsByEventIds(
  eventIds: string[],
): Promise<Record<string, number>> {
  if (eventIds.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_participants")
    .select("event_id")
    .in("event_id", eventIds)
    .eq("status", "going");

  if (error) {
    console.error("getGoingCountsByEventIds:", error.message);
    return {};
  }

  const counts: Record<string, number> = {};

  for (const row of data ?? []) {
    counts[row.event_id] = (counts[row.event_id] ?? 0) + 1;
  }

  return counts;
}

export async function getGoingCount(eventId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("event_participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "going");

  if (error) {
    console.error("getGoingCount:", error.message);
    return 0;
  }

  return count ?? 0;
}
