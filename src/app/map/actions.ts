"use server";

import { createClient } from "@/lib/supabase/server";

export type MapEvent = {
  id: string;
  title: string;
  location: string;
  cover_url: string | null;
  category: string;
  starts_at: string;
  latitude: number;
  longitude: number;
};

export async function getEventsForMap(): Promise<MapEvent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("events")
    .select("id, title, location, cover_url, category, starts_at, latitude, longitude")
    .eq("status", "published")
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("starts_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("getEventsForMap:", error.message);
    return [];
  }

  return (data ?? []) as MapEvent[];
}
