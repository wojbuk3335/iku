import type { SupabaseClient } from "@supabase/supabase-js";
import type { UserRole } from "@/types/profile";

/** Odczyt roli i onboardingu — działa też gdy migracja 002 jeszcze nie była uruchomiona. */
export async function getProfileAuthContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ role: UserRole; onboardingCompleted: boolean }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile?.role as UserRole | undefined) ?? "user";

  if (role === "admin") {
    return { role, onboardingCompleted: true };
  }

  const { data: onboardingProfile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  return {
    role,
    onboardingCompleted: onboardingProfile?.onboarding_completed ?? false,
  };
}
