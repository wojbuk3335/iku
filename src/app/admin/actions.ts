"use server";

import { createClient } from "@/lib/supabase/server";
import { INTEREST_CATEGORIES } from "@/types/interests";
import type { CreateEventInput, EventCategory } from "@/types/event";

const VALID_CATEGORIES = new Set<EventCategory>(
  INTEREST_CATEGORIES.map((item) => item.id),
);

export async function createEvent(
  input: CreateEventInput,
): Promise<{ id: string }> {
  const title = input.title.trim();
  const location = input.location.trim();
  const description = input.description?.trim() ?? null;

  if (!title) {
    throw new Error("Podaj tytuł wydarzenia.");
  }

  if (!location) {
    throw new Error("Podaj lokalizację.");
  }

  if (!VALID_CATEGORIES.has(input.category)) {
    throw new Error("Wybierz kategorię.");
  }

  if (!input.starts_at) {
    throw new Error("Podaj datę i godzinę.");
  }

  const startsAt = new Date(input.starts_at);
  if (Number.isNaN(startsAt.getTime())) {
    throw new Error("Nieprawidłowa data lub godzina.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Musisz być zalogowany.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "creator") {
    throw new Error("Brak uprawnień do tworzenia wydarzeń.");
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      title,
      description,
      category: input.category,
      starts_at: startsAt.toISOString(),
      location,
      cover_url: input.cover_url ?? null,
      status: input.status ?? "published",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return { id: data.id };
}
