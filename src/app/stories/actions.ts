"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StoryItem = {
  id: string;
  mediaUrl: string;
  caption: string | null;
  createdAt: string;
};

export type StoryAuthorGroup = {
  userId: string;
  fullName: string | null;
  avatarUrl: string | null;
  email: string | null;
  isSelf: boolean;
  hasUnseen: boolean;
  stories: StoryItem[];
};

export async function getStoriesFeed(): Promise<StoryAuthorGroup[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: followData } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (followData ?? []).map((f) => f.following_id);
  const authorIds = [user.id, ...followingIds];

  const { data: stories, error } = await supabase
    .from("stories")
    .select("id, user_id, media_url, caption, created_at")
    .in("user_id", authorIds)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getStoriesFeed:", error.message);
    return [];
  }

  if (!stories || stories.length === 0) {
    // Własne kółko „Dodaj relację” nawet bez aktywnych
    const { data: me } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .eq("id", user.id)
      .single();

    return [{
      userId: user.id,
      fullName: me?.full_name ?? null,
      avatarUrl: me?.avatar_url ?? null,
      email: me?.email ?? null,
      isSelf: true,
      hasUnseen: false,
      stories: [],
    }];
  }

  const storyIds = stories.map((s) => s.id);
  const uniqueAuthorIds = [...new Set(stories.map((s) => s.user_id))];
  if (!uniqueAuthorIds.includes(user.id)) uniqueAuthorIds.unshift(user.id);

  const [{ data: profiles }, { data: views }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, email")
      .in("id", uniqueAuthorIds),
    supabase
      .from("story_views")
      .select("story_id")
      .eq("viewer_id", user.id)
      .in("story_id", storyIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const viewedSet = new Set((views ?? []).map((v) => v.story_id));

  const grouped = new Map<string, StoryAuthorGroup>();

  for (const authorId of uniqueAuthorIds) {
    const profile = profileMap.get(authorId);
    grouped.set(authorId, {
      userId: authorId,
      fullName: profile?.full_name ?? null,
      avatarUrl: profile?.avatar_url ?? null,
      email: profile?.email ?? null,
      isSelf: authorId === user.id,
      hasUnseen: false,
      stories: [],
    });
  }

  for (const story of stories) {
    const group = grouped.get(story.user_id);
    if (!group) continue;
    group.stories.push({
      id: story.id,
      mediaUrl: story.media_url,
      caption: story.caption,
      createdAt: story.created_at,
    });
    if (!viewedSet.has(story.id) && story.user_id !== user.id) {
      group.hasUnseen = true;
    }
  }

  // Własne: „nieobejrzane” = false; ale jeśli masz relacje, ring aktywny
  const self = grouped.get(user.id);
  if (self) {
    self.hasUnseen = self.stories.length > 0;
  }

  const result = [...grouped.values()].filter(
    (g) => g.isSelf || g.stories.length > 0,
  );

  result.sort((a, b) => {
    if (a.isSelf) return -1;
    if (b.isSelf) return 1;
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return 0;
  });

  return result;
}

export async function createStory(
  mediaUrl: string,
  caption?: string | null,
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");
  if (!mediaUrl.trim()) throw new Error("Brak zdjęcia relacji.");

  const { error } = await supabase.from("stories").insert({
    user_id: user.id,
    media_url: mediaUrl.trim(),
    caption: caption?.trim() || null,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/events");
  revalidatePath("/profile");
}

export async function markStoriesViewed(storyIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || storyIds.length === 0) return;

  const rows = storyIds.map((story_id) => ({
    story_id,
    viewer_id: user.id,
  }));

  await supabase.from("story_views").upsert(rows, {
    onConflict: "story_id,viewer_id",
    ignoreDuplicates: true,
  });

  revalidatePath("/events");
}

export async function userHasActiveStory(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("stories")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString());

  return (count ?? 0) > 0;
}
