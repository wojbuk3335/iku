"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isValidBirthDate } from "@/lib/profile/birth-date";
import { MAX_INTERESTS, MIN_INTERESTS } from "@/types/interests";
import { INTEREST_CATEGORIES } from "@/types/interests";

const VALID_INTEREST_IDS = new Set(INTEREST_CATEGORIES.map((c) => c.id));

export async function updateInterests(interests: string[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  if (interests.length < MIN_INTERESTS || interests.length > MAX_INTERESTS) {
    throw new Error(`Wybierz dokładnie ${MAX_INTERESTS} zainteresowania.`);
  }

  const invalid = interests.find((id) => !VALID_INTEREST_IDS.has(id));
  if (invalid) throw new Error("Nieprawidłowa kategoria zainteresowań.");

  const { error } = await supabase
    .from("profiles")
    .update({ interests })
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/settings/profil");
  revalidatePath("/profile");
  revalidatePath("/events");
}

export async function updateUserProfile(input: {
  fullName: string;
  birthDate: string;
  isPrivate: boolean;
  username: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Podaj imię i nazwisko.");
  if (fullName.length > 80) {
    throw new Error("Imię i nazwisko może mieć maksymalnie 80 znaków.");
  }
  if (!isValidBirthDate(input.birthDate)) {
    throw new Error("Podaj poprawną datę urodzenia (min. 13 lat).");
  }

  const { normalizeUsername, isValidUsername } = await import("@/lib/profile/username");
  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) {
    throw new Error(
      "Nazwa użytkownika: 3–30 znaków, litery, cyfry, kropka lub podkreślenie.",
    );
  }

  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (taken) {
    throw new Error("Ta nazwa użytkownika jest już zajęta.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      birth_date: input.birthDate,
      is_private: input.isPrivate,
      username,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("Ta nazwa użytkownika jest już zajęta.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/settings");
  revalidatePath("/settings/profil");
  revalidatePath("/profile");
  revalidatePath(`/profile/${username}`);
  revalidatePath("/admin/stats");
}
