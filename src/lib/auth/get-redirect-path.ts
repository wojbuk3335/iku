"use server";

import { getProfileAuthContext } from "@/lib/auth/get-profile-auth";
import { getPostLoginPath } from "@/lib/auth/paths";
import { createClient } from "@/lib/supabase/server";

export async function getRedirectPathAfterLogin(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/";
  }

  const { role, onboardingCompleted } = await getProfileAuthContext(
    supabase,
    user.id,
  );

  return getPostLoginPath(role, onboardingCompleted);
}
