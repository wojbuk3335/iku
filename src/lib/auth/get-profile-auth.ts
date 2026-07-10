import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/profile";

export async function getProfileAuthContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ role: UserRole; onboardingCompleted: boolean; isBlocked: boolean }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarding_completed, is_blocked")
    .eq("id", userId)
    .single();

  const role      = (profile?.role as UserRole | undefined) ?? "user";
  const isBlocked = profile?.is_blocked ?? false;

  if (role === "admin" || role === "creator") {
    return { role, onboardingCompleted: true, isBlocked };
  }

  return {
    role,
    onboardingCompleted: profile?.onboarding_completed ?? false,
    isBlocked,
  };
}
