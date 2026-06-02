"use server";

import { createClient } from "@/lib/supabase/server";
import { getPostLoginPath } from "@/lib/auth/paths";
import { MIN_INTERESTS } from "@/types/interests";
import type { UserRole } from "@/types/profile";

export async function completeOnboarding(interests: string[]): Promise<string> {
  if (interests.length < MIN_INTERESTS) {
    throw new Error(`Wybierz co najmniej ${MIN_INTERESTS} kategorie.`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/";
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      interests,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return getPostLoginPath(
    (profile?.role as UserRole | undefined) ?? "user",
    true,
  );
}
