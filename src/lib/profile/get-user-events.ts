import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/event";

export async function getUserEventsByStatus(
  userId: string,
  status: "going" | "saved",
): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("event_participants")
    .select(
      "events(id, title, description, category, starts_at, location, cover_url, status, created_by, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .eq("status", status);

  if (error) {
    console.error("getUserEventsByStatus:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => row.events)
    .filter((e): e is Event => e !== null);
}
