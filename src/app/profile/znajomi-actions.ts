"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type FollowingUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
};

export type SuggestedUser = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
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
    .select("id, full_name, avatar_url, bio")
    .in("id", ids);

  if (profilesError) {
    console.error("getFollowingUsers [profiles]:", profilesError.message);
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

  // Fetch candidate profiles (not yet followed, not self)
  let profilesQuery = supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
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

export async function followUser(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetUserId });

  if (error && error.code !== "23505") {
    throw new Error(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/admin/stats");
  revalidatePath("/events");
}

export async function unfollowUser(targetUserId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId);

  revalidatePath("/profile");
  revalidatePath("/admin/stats");
  revalidatePath("/events");
}
