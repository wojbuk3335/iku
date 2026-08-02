import { createClient } from "@/lib/supabase/server";
import { usernameFromEmail } from "@/lib/profile/username";
import type { Profile } from "@/types/profile";

type ExtraProfile = {
  bio: string | null;
  avatar_url: string | null;
  full_name: string | null;
  birth_date: string | null;
  username: string | null;
};

async function loadExtraProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<ExtraProfile> {
  const empty: ExtraProfile = {
    bio: null,
    avatar_url: null,
    full_name: null,
    birth_date: null,
    username: null,
  };

  const withUsername = await supabase
    .from("profiles")
    .select("bio, avatar_url, full_name, birth_date, username")
    .eq("id", userId)
    .maybeSingle();

  if (!withUsername.error && withUsername.data) {
    return {
      bio: withUsername.data.bio ?? null,
      avatar_url: withUsername.data.avatar_url ?? null,
      full_name: withUsername.data.full_name ?? null,
      birth_date: withUsername.data.birth_date ?? null,
      username: withUsername.data.username ?? null,
    };
  }

  // Fallback gdy brak kolumny username / birth_date (migracja jeszcze nieodpalona)
  const withBirth = await supabase
    .from("profiles")
    .select("bio, avatar_url, full_name, birth_date")
    .eq("id", userId)
    .maybeSingle();

  if (!withBirth.error && withBirth.data) {
    return {
      bio: withBirth.data.bio ?? null,
      avatar_url: withBirth.data.avatar_url ?? null,
      full_name: withBirth.data.full_name ?? null,
      birth_date: withBirth.data.birth_date ?? null,
      username: null,
    };
  }

  const withoutBirth = await supabase
    .from("profiles")
    .select("bio, avatar_url, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (withoutBirth.error || !withoutBirth.data) {
    if (withUsername.error) {
      console.error("loadExtraProfile:", withUsername.error.message);
    }
    if (withBirth.error) {
      console.error("loadExtraProfile birth:", withBirth.error.message);
    }
    if (withoutBirth.error) {
      console.error("loadExtraProfile fallback:", withoutBirth.error.message);
    }
    return empty;
  }

  return {
    bio: withoutBirth.data.bio ?? null,
    avatar_url: withoutBirth.data.avatar_url ?? null,
    full_name: withoutBirth.data.full_name ?? null,
    birth_date: null,
    username: null,
  };
}

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
    .select("id, email, role, created_at, onboarding_completed, interests")
    .eq("id", user.id)
    .single();

  if (!baseProfile) {
    const seedUsername = usernameFromEmail(user.email, user.id);
    const { error: insertError } = await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      role: "user",
      username: seedUsername,
    });

    if (insertError) {
      // Kolumna username może jeszcze nie istnieć — spróbuj bez niej
      await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        role: "user",
      });
    }

    const { data: createdProfile } = await supabase
      .from("profiles")
      .select("id, email, role, created_at, onboarding_completed, interests")
      .eq("id", user.id)
      .single();

    baseProfile = createdProfile;
  }

  if (!baseProfile) {
    return { user, profile: null };
  }

  const extraProfile = await loadExtraProfile(supabase, user.id);

  let username = extraProfile.username;
  if (!username) {
    const seed = usernameFromEmail(user.email ?? baseProfile.email, user.id);
    const { error: usernameError } = await supabase
      .from("profiles")
      .update({ username: seed })
      .eq("id", user.id)
      .is("username", null);

    if (!usernameError) {
      username = seed;
    }
  }

  const profile: Profile = {
    ...baseProfile,
    role: baseProfile.role,
    onboarding_completed: baseProfile.onboarding_completed ?? false,
    interests: Array.isArray(baseProfile.interests) ? baseProfile.interests : [],
    bio: extraProfile.bio,
    avatar_url: extraProfile.avatar_url,
    full_name: extraProfile.full_name,
    birth_date: extraProfile.birth_date,
    username,
  };

  return { user, profile };
}
