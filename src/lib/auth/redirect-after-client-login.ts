import type { SupabaseClient } from "@supabase/supabase-js";
import { getPostLoginPath } from "@/lib/auth/paths";
import type { UserRole } from "@/types/profile";

/** Po logowaniu w przeglądarce — sesja jest już w kliencie, bez czekania na cookies serwera. */
export async function redirectAfterClientLogin(
  supabase: SupabaseClient,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  const role = (profile?.role as UserRole | undefined) ?? "user";
  let onboardingCompleted = role === "admin";

  if (role !== "admin") {
    const { data: onboardingProfile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();

    onboardingCompleted = onboardingProfile?.onboarding_completed ?? false;
  }

  window.location.assign(getPostLoginPath(role, onboardingCompleted));
}
