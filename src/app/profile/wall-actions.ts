"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type Post = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_email: string;
  event_id: string | null;
  event_title: string | null;
  reaction_count: number;
  user_reacted: boolean;
};

export async function createPost(content: string, eventId?: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Post nie może być pusty.");
  if (trimmed.length > 500) throw new Error("Post może mieć max 500 znaków.");

  const { error } = await supabase.from("posts").insert({
    user_id: user.id,
    content: trimmed,
    event_id: eventId ?? null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/profile");
}

export async function toggleReaction(postId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_reactions").delete()
      .eq("post_id", postId).eq("user_id", user.id);
  } else {
    await supabase.from("post_reactions").insert({ post_id: postId, user_id: user.id });
  }

  revalidatePath("/profile");
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id, content, created_at, user_id, event_id,
      profiles!posts_user_id_fkey(full_name, avatar_url, email),
      events(title),
      post_reactions(user_id)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getUserPosts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = row.profiles as { full_name: string | null; avatar_url: string | null; email: string } | null;
    const event = row.events as { title: string } | null;
    const reactions = (row.post_reactions ?? []) as { user_id: string }[];

    return {
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      user_id: row.user_id,
      author_name: profile?.full_name ?? null,
      author_avatar: profile?.avatar_url ?? null,
      author_email: profile?.email ?? "",
      event_id: row.event_id,
      event_title: event?.title ?? null,
      reaction_count: reactions.length,
      user_reacted: reactions.some((r) => r.user_id === user?.id),
    };
  });
}
