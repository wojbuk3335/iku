"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { checkAndAwardBadges } from "@/lib/profile/badges";
import type { ParticipationStatus, UserParticipation } from "@/types/participation";
import { INTEREST_CATEGORIES } from "@/types/interests";
import type { CreateEventInput, EventCategory } from "@/types/event";

const VALID_CATEGORIES = new Set<EventCategory>(
  INTEREST_CATEGORIES.map((item) => item.id),
);

export async function createEvent(input: CreateEventInput): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  if (input.categories.length === 0) {
    throw new Error("Wybierz co najmniej jedną kategorię.");
  }

  if (input.categories.length > 2) {
    throw new Error("Możesz wybrać maksymalnie 2 kategorie.");
  }

  const invalidCat = input.categories.find((c) => !VALID_CATEGORIES.has(c));
  if (invalidCat) {
    throw new Error(`Nieprawidłowa kategoria: ${invalidCat}`);
  }

  if (!input.starts_at || !input.ends_at) {
    throw new Error("Podaj datę i godzinę rozpoczęcia oraz zakończenia.");
  }

  const startsAt = new Date(input.starts_at);
  const endsAt = new Date(input.ends_at);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Nieprawidłowa data lub godzina.");
  }
  if (endsAt <= startsAt) {
    throw new Error("Zakończenie musi być późniejsze niż rozpoczęcie.");
  }

  if (
    typeof input.latitude !== "number" ||
    typeof input.longitude !== "number" ||
    Number.isNaN(input.latitude) ||
    Number.isNaN(input.longitude)
  ) {
    throw new Error("Wybierz lokalizację z listy podpowiedzi Google.");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title:       input.title,
      description: input.description ?? null,
      category:    input.categories[0],
      categories:  input.categories,
      recurrence:  input.recurrence ?? "one_time",
      starts_at:   input.starts_at,
      ends_at:     input.ends_at,
      location:    input.location.trim(),
      location_name: input.location_name?.trim() ?? null,
      place_id:    input.place_id ?? null,
      latitude:    input.latitude,
      longitude:   input.longitude,
      cover_url:   input.cover_url ?? null,
      status:      "published",
      created_by:  user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/events");
  revalidatePath("/profile");
  return data.id;
}

export async function toggleParticipation(
  eventId: string,
  status: ParticipationStatus,
): Promise<UserParticipation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Musisz być zalogowany.");
  }

  const { data: existing } = await supabase
    .from("event_participants")
    .select("status")
    .eq("user_id", user.id)
    .eq("event_id", eventId)
    .eq("status", status)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("event_participants")
      .delete()
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .eq("status", status);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await supabase.from("event_participants").insert({
      user_id: user.id,
      event_id: eventId,
      status,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/admin/stats");

  // Sprawdź i przyznaj odznaki (w tle — nie blokuje odpowiedzi)
  checkAndAwardBadges(user.id).catch(console.error);

  return getUserParticipation(eventId);
}

export async function getUserParticipation(
  eventId: string,
): Promise<UserParticipation> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { going: false, saved: false };
  }

  const { data } = await supabase
    .from("event_participants")
    .select("status")
    .eq("user_id", user.id)
    .eq("event_id", eventId);

  const statuses = (data ?? []).map((row) => row.status);

  return {
    going: statuses.includes("going"),
    saved: statuses.includes("saved"),
  };
}

/** Każde otwarcie strony wydarzenia = +1 wyświetlenie (bez własnych od twórcy). */
export async function recordEventView(eventId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: event } = await supabase
    .from("events")
    .select("id, created_by, status")
    .eq("id", eventId)
    .eq("status", "published")
    .maybeSingle();

  if (!event || event.created_by === user.id) return;

  const { error } = await supabase.from("event_views").insert({
    event_id: eventId,
    viewer_id: user.id,
  });

  if (error) {
    console.error("recordEventView:", error.message);
  }
}
