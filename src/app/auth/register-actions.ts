"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidBirthDate } from "@/lib/profile/birth-date";

export async function setNewUserProfile(
  role: "user" | "creator",
  fullName: string,
  orgName?: string,
  birthDate?: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji użytkownika." };

    if (birthDate && !isValidBirthDate(birthDate)) {
      return { error: "Podaj poprawną datę urodzenia (min. 13 lat)." };
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id:                   user.id,
        full_name:            fullName.trim() || null,
        role,
        onboarding_completed: true,
        ...(birthDate ? { birth_date: birthDate } : {}),
        ...(orgName?.trim() ? { bio: orgName.trim() } : {}),
      });

    if (error) return { error: error.message };
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Nieznany błąd." };
  }
}
