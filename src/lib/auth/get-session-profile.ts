import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/profile";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  let { data: baseProfile } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .eq("id", user.id)
    .single();

  if (!baseProfile) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      role: "user",
    });

    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .eq("id", user.id)
      .single();

    baseProfile = createdProfile;
  }

  if (!baseProfile) {
    return { user, profile: null };
  }

  const { data: extendedProfile } = await supabase
    .from("profiles")
    .select("onboarding_completed, interests")
    .eq("id", user.id)
    .maybeSingle();

  // bio, avatar_url, full_name — defensywny select (kolumny dodawane stopniowo migracjami)
  const { data: extraProfile } = await supabase
    .from("profiles")
    .select("bio, avatar_url, full_name")
    .eq("id", user.id)
    .maybeSingle()
    .then((res) => (res.error ? { data: null } : res));

  type ExtraProfile = { bio?: string | null; avatar_url?: string | null; full_name?: string | null } | null;

  const profile: Profile = {
    ...baseProfile,
    role: baseProfile.role,
    onboarding_completed: extendedProfile?.onboarding_completed ?? false,
    interests: extendedProfile?.interests ?? [],
    bio: (extraProfile as ExtraProfile)?.bio ?? null,
    avatar_url: (extraProfile as ExtraProfile)?.avatar_url ?? null,
    full_name: (extraProfile as ExtraProfile)?.full_name ?? null,
  };

  return { user, profile };
}
