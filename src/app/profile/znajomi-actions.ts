"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FollowingUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  username: string | null;
};

export type SuggestedUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  username: string | null;
  mutual_count: number;
};

export async function getFollowingUsers(userId: string): Promise<FollowingUser[]> {
  const supabase = await createClient();

  const { data: followData, error: followError } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  if (followError) {
    console.error("getFollowingUsers [follows]:", followError.message);
    return [];
  }

  const ids = (followData ?? []).map((f) => f.following_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, email, username")
    .in("id", ids);

  if (profilesError) {
    console.error("getFollowingUsers [profiles]:", profilesError.message);
    return [];
  }

  return (profiles ?? []) as FollowingUser[];
}

export async function getFollowerUsers(userId: string): Promise<FollowingUser[]> {
  const supabase = await createClient();

  const { data: followData, error: followError } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);

  if (followError) {
    console.error("getFollowerUsers [follows]:", followError.message);
    return [];
  }

  const ids = (followData ?? []).map((f) => f.follower_id);
  if (ids.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, bio, email, username")
    .in("id", ids);

  if (profilesError) {
    console.error("getFollowerUsers [profiles]:", profilesError.message);
    return [];
  }

  return (profiles ?? []) as FollowingUser[];
}

export async function getSuggestedUsers(userId: string): Promise<SuggestedUser[]> {
  const supabase = await createClient();

  // IDs already followed + self — exclude from suggestions
  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);

  const excludeIds = [(followData ?? []).map((f) => f.following_id), userId].flat();

  // Current user's followers — used to compute mutual count
  const { data: followersData } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("following_id", userId);

  const myFollowerIds = (followersData ?? []).map((f) => f.follower_id);

  // Fetch candidate profiles (regular users only — no admins/creators)
  let profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, username")
    .eq("role", "user")
    .eq("is_private", false)
    .neq("id", userId)
    .limit(20);

  if (excludeIds.length > 0) {
    profilesQuery = profilesQuery.not("id", "in", `(${excludeIds.join(",")})`);
  }

  const { data: candidates } = await profilesQuery;
  if (!candidates || candidates.length === 0) return [];

  // For each candidate count how many of current user's followers also follow them
  const withMutual = await Promise.all(
    candidates.map(async (profile) => {
      let mutual = 0;
      if (myFollowerIds.length > 0) {
        const { count } = await supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profile.id)
          .in("follower_id", myFollowerIds);
        mutual = count ?? 0;
      }
      return { ...profile, mutual_count: mutual } as SuggestedUser;
    })
  );

  // Sort by most mutual connections first
  return withMutual.sort((a, b) => b.mutual_count - a.mutual_count).slice(0, 10);
}

export async function searchUsers(query: string): Promise<SuggestedUser[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const excludeIds = new Set([
    user.id,
    ...(followData ?? []).map((f) => f.following_id),
  ]);

  const { data: byName, error: nameError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, username")
    .eq("role", "user")
    .eq("is_private", false)
    .ilike("full_name", `%${q}%`)
    .limit(20);

  const { data: byUsername, error: usernameError } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, email, username")
    .eq("role", "user")
    .eq("is_private", false)
    .ilike("username", `%${q}%`)
    .limit(20);

  if (nameError) console.error("searchUsers name:", nameError.message);
  if (usernameError) console.error("searchUsers username:", usernameError.message);

  const merged = new Map<string, SuggestedUser>();
  for (const p of [...(byName ?? []), ...(byUsername ?? [])]) {
    if (excludeIds.has(p.id)) continue;
    merged.set(p.id, { ...p, mutual_count: 0 });
  }

  return Array.from(merged.values()).slice(0, 20);
}

async function searchProfilesByRole(
  query: string,
  role: "user" | "creator",
): Promise<SuggestedUser[]> {
  const q = query.trim();
  if (q.length < 1) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const selectCols = "id, full_name, avatar_url, email, username";

  async function runSearch(withUsername: boolean) {
    const cols = withUsername ? selectCols : "id, full_name, avatar_url, email";
    const byName = await supabase
      .from("profiles")
      .select(cols)
      .eq("role", role)
      .neq("id", user!.id)
      .ilike("full_name", `%${q}%`)
      .limit(20);

    const byUsername = withUsername
      ? await supabase
          .from("profiles")
          .select(cols)
          .eq("role", role)
          .neq("id", user!.id)
          .ilike("username", `%${q}%`)
          .limit(20)
      : { data: null as null, error: null };

    const byEmail = await supabase
      .from("profiles")
      .select(cols)
      .eq("role", role)
      .neq("id", user!.id)
      .ilike("email", `%${q}%`)
      .limit(20);

    return { byName, byUsername, byEmail };
  }

  let { byName, byUsername, byEmail } = await runSearch(true);

  if (byName.error || byUsername.error || byEmail.error) {
    const fallback = await runSearch(false);
    byName = fallback.byName;
    byUsername = fallback.byUsername;
    byEmail = fallback.byEmail;
  }

  if (byName.error) console.error(`searchProfiles(${role}) name:`, byName.error.message);
  if (byUsername.error) console.error(`searchProfiles(${role}) username:`, byUsername.error.message);
  if (byEmail.error) console.error(`searchProfiles(${role}) email:`, byEmail.error.message);

  const merged = new Map<string, SuggestedUser>();
  for (const p of [...(byName.data ?? []), ...(byUsername.data ?? []), ...(byEmail.data ?? [])]) {
    const row = p as {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string | null;
      username?: string | null;
    };
    merged.set(row.id, {
      id: row.id,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      email: row.email,
      username: row.username ?? null,
      mutual_count: 0,
    });
  }

  return Array.from(merged.values()).slice(0, 20);
}

/** Główna wyszukiwarka — użytkownicy (role=user). */
export async function searchAllUsers(query: string): Promise<SuggestedUser[]> {
  return searchProfilesByRole(query, "user");
}

/** Wyszukiwanie precyzyjne — organizatorzy (role=creator). */
export async function searchOrganizers(query: string): Promise<SuggestedUser[]> {
  return searchProfilesByRole(query, "creator");
}

export async function followUser(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");
  if (user.id === targetUserId) throw new Error("Nie możesz obserwować siebie.");

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetUserId });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  // Powiadomienie dla obserwowanego (tylko przy nowym follow)
  if (!error) {
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const name =
      me?.full_name?.trim() ||
      me?.email?.split("@")[0] ||
      "Użytkownik";

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "new_follower",
      title: `${name} zaczął Cię obserwować`,
      body: "Masz nowego obserwującego na IKU",
      metadata: { follower_id: user.id },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/notifications");
  revalidatePath("/admin/stats");
  revalidatePath("/events");
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data: deleted, error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .select("following_id");

  if (error) throw new Error(error.message);

  if (deleted && deleted.length > 0) {
    const { data: me } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single();

    const name =
      me?.full_name?.trim() ||
      me?.email?.split("@")[0] ||
      "Użytkownik";

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "unfollowed",
      title: `${name} przestał Cię obserwować`,
      body: "Ktoś przestał obserwować Twój profil na IKU",
      metadata: { follower_id: user.id },
    });
  }

  revalidatePath("/profile");
  revalidatePath("/notifications");
  revalidatePath("/admin/stats");
  revalidatePath("/events");
}
