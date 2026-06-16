import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/event";

export async function getPublishedEvents(): Promise<Event[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select(
      "id, title, description, category, starts_at, location, cover_url, status, created_by, created_at, updated_at",
    )
    .eq("status", "published")
    .order("starts_at", { ascending: true });

  if (error) {
    console.error("getPublishedEvents:", error.message);
    return [];
  }

  return (data ?? []) as Event[];
}
