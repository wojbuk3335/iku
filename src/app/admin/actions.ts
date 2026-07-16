"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { INTEREST_CATEGORIES } from "@/types/interests";
import type { CreateEventInput, Event, EventCategory, EventRecurrence } from "@/types/event";

const VALID_CATEGORIES = new Set<EventCategory>(
  INTEREST_CATEGORIES.map((item) => item.id),
);

const VALID_RECURRENCE = new Set<EventRecurrence>(["one_time", "recurring"]);

export type UpdateEventInput = Omit<CreateEventInput, "cover_url"> & {
  id: string;
  cover_url?: string | null;
};

async function requireEventManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "creator") {
    throw new Error("Brak uprawnień.");
  }

  return { supabase, userId: user.id, role: profile?.role as string };
}

const EVENT_COLUMNS =
  "id, title, description, category, categories, recurrence, starts_at, ends_at, location, location_name, place_id, latitude, longitude, cover_url, status, created_by, created_at, updated_at";

function validateEventInput(input: Omit<CreateEventInput, "cover_url">) {
  const title = input.title.trim();
  const location = input.location.trim();

  if (!title) throw new Error("Podaj tytuł wydarzenia.");
  if (!location) throw new Error("Podaj lokalizację.");

  if (
    typeof input.latitude !== "number" ||
    typeof input.longitude !== "number" ||
    Number.isNaN(input.latitude) ||
    Number.isNaN(input.longitude)
  ) {
    throw new Error("Wybierz lokalizację z listy podpowiedzi Google.");
  }

  if (input.categories.length === 0) {
    throw new Error("Wybierz co najmniej jedną kategorię.");
  }
  if (input.categories.length > 2) {
    throw new Error("Możesz wybrać maksymalnie 2 kategorie.");
  }

  const invalidCat = input.categories.find((c) => !VALID_CATEGORIES.has(c));
  if (invalidCat) throw new Error(`Nieprawidłowa kategoria: ${invalidCat}`);

  if (!input.starts_at) throw new Error("Podaj datę i godzinę rozpoczęcia.");
  if (!input.ends_at) throw new Error("Podaj datę i godzinę zakończenia.");

  const startsAt = new Date(input.starts_at);
  const endsAt = new Date(input.ends_at);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Nieprawidłowa data lub godzina.");
  }
  if (endsAt <= startsAt) {
    throw new Error("Zakończenie musi być późniejsze niż rozpoczęcie.");
  }

  const recurrence = input.recurrence ?? "one_time";
  if (!VALID_RECURRENCE.has(recurrence)) {
    throw new Error("Nieprawidłowy typ wydarzenia.");
  }

  return {
    title,
    location,
    description: input.description?.trim() ?? null,
    primaryCategory: input.categories[0],
    startsAt,
    endsAt,
    recurrence,
    location_name: input.location_name?.trim() ?? null,
    place_id: input.place_id ?? null,
    latitude: input.latitude,
    longitude: input.longitude,
  };
}

export async function getCreatorEvents(): Promise<Event[]> {
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("created_by", userId)
    .order("starts_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Event[];
}

export async function getCreatorEvent(id: string): Promise<Event | null> {
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("id", id)
    .eq("created_by", userId)
    .single();

  if (error) return null;
  return data as Event;
}

export async function createEvent(
  input: CreateEventInput,
): Promise<{ id: string }> {
  const validated = validateEventInput(input);
  const { supabase, userId } = await requireEventManager();

  const { data, error } = await supabase
    .from("events")
    .insert({
      title:       validated.title,
      description: validated.description,
      category:    validated.primaryCategory,
      categories:  input.categories,
      recurrence:  validated.recurrence,
      starts_at:   validated.startsAt.toISOString(),
      ends_at:     validated.endsAt.toISOString(),
      location:    validated.location,
      location_name: validated.location_name,
      place_id:    validated.place_id,
      latitude:    validated.latitude,
      longitude:   validated.longitude,
      cover_url:   input.cover_url ?? null,
      status:      input.status ?? "published",
      created_by:  userId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

export async function updateEvent(input: UpdateEventInput): Promise<void> {
  const validated = validateEventInput(input);
  const { supabase, userId } = await requireEventManager();

  const payload: Record<string, unknown> = {
    title:       validated.title,
    description: validated.description,
    category:    validated.primaryCategory,
    categories:  input.categories,
    recurrence:  validated.recurrence,
    starts_at:   validated.startsAt.toISOString(),
    ends_at:     validated.endsAt.toISOString(),
    location:    validated.location,
    location_name: validated.location_name,
    place_id:    validated.place_id,
    latitude:    validated.latitude,
    longitude:   validated.longitude,
  };

  if (input.cover_url !== undefined) {
    payload.cover_url = input.cover_url;
  }

  if (!input.id) {
    throw new Error("Brak ID wydarzenia.");
  }

  const { error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", input.id)
    .eq("created_by", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${input.id}`);
  revalidatePath("/events");
  revalidatePath(`/events/${input.id}`);
}
