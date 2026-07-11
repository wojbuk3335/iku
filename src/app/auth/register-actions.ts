"use server";

import { createClient } from "@/lib/supabase/server";

export async function setNewUserProfile(
  role: "user" | "creator",
  fullName: string,
  orgName?: string,
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Brak sesji użytkownika." };

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id:                   user.id,
        full_name:            fullName.trim() || null,
        role,
        onboarding_completed: true,
        ...(orgName?.trim() ? { bio: orgName.trim() } : {}),
      });

    if (error) return { error: error.message };
    return {};
  } catch (e: unknown) {
    return { error: e instanceof Error ? e.message : "Nieznany błąd." };
  }
}
