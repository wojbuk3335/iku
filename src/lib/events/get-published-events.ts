import { createClient } from "@/lib/supabase/server";

import type { Event, EventCategory } from "@/types/event";



function normalizeEvent(row: Record<string, unknown>): Event {

  const category = row.category as EventCategory;

  let categories = row.categories;



  if (!Array.isArray(categories) || categories.length === 0) {

    categories = category ? [category] : [];

  }



  return {
    ...(row as Event),
    categories: categories as EventCategory[],
    recurrence: (row.recurrence as Event["recurrence"]) ?? "one_time",
    ends_at:
      (row.ends_at as string | undefined) ??
      new Date(new Date(row.starts_at as string).getTime() + 2 * 60 * 60 * 1000).toISOString(),
  };

}



export async function getPublishedEvents(): Promise<Event[]> {

  const supabase = await createClient();



  const { data, error } = await supabase

    .from("events")

    .select(

      "id, title, description, category, categories, recurrence, starts_at, ends_at, location, location_name, place_id, latitude, longitude, cover_url, status, created_by, created_at, updated_at",

    )

    .eq("status", "published");



  if (error) {

    console.error("getPublishedEvents:", error.message);

    return [];

  }



  return (data ?? []).map((row) => normalizeEvent(row as Record<string, unknown>));

}

