"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  coverMediaUrl,
  normalizePostMedia,
  type PostMediaItem,
  MAX_POST_IMAGES,
} from "@/lib/profile/post-media";

export type Post = {
  id: string;
  content: string;
  image_url: string | null;
  media_urls: PostMediaItem[];
  created_at: string;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  author_email: string;
  author_username: string | null;
  event_id: string | null;
  event_title: string | null;
  event_location: string | null;
  reaction_count: number;
  user_reacted: boolean;
  comment_count: number;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  author_email: string;
};

export async function createPost(
  content: string,
  imageUrl?: string | null,
  eventId?: string,
  taggedUserIds: string[] = [],
  mediaItems: PostMediaItem[] = [],
): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const media = normalizePostMedia(imageUrl, mediaItems).slice(0, MAX_POST_IMAGES);
  const cover = coverMediaUrl(media) ?? imageUrl ?? null;

  const trimmed = content.trim();
  if (!trimmed && media.length === 0 && !cover) {
    throw new Error("Post nie może być pusty.");
  }
  if (trimmed.length > 500) throw new Error("Post może mieć max 500 znaków.");

  // DB wymaga content length >= 1 — przy samym zdjęciu zapisujemy spację
  const contentToSave = trimmed || " ";

  const { data, error } = await supabase.from("posts").insert({
    user_id: user.id,
    content: contentToSave,
    image_url: cover,
    media_urls: media,
    event_id: eventId ?? null,
  }).select("id").single();

  if (error) {
    // Fallback gdy brak kolumny media_urls (migracja jeszcze nie zastosowana)
    if (error.message.toLowerCase().includes("media_urls")) {
      const fallback = await supabase.from("posts").insert({
        user_id: user.id,
        content: contentToSave,
        image_url: cover,
        event_id: eventId ?? null,
      }).select("id").single();
      if (fallback.error) throw new Error(fallback.error.message);
      const uniqueTagsFb = [...new Set(taggedUserIds)]
        .filter((id) => id && id !== user.id)
        .slice(0, 10);
      if (uniqueTagsFb.length > 0) {
        await supabase.from("post_tags").insert(
          uniqueTagsFb.map((taggedId) => ({
            post_id: fallback.data.id,
            user_id: taggedId,
          })),
        );
      }
      revalidatePath("/profile", "layout");
      revalidatePath("/post", "layout");
      return fallback.data.id;
    }
    throw new Error(error.message);
  }

  const uniqueTags = [...new Set(taggedUserIds)]
    .filter((id) => id && id !== user.id)
    .slice(0, 10);

  if (uniqueTags.length > 0) {
    const { error: tagError } = await supabase.from("post_tags").insert(
      uniqueTags.map((taggedId) => ({
        post_id: data.id,
        user_id: taggedId,
      })),
    );
    if (tagError) {
      console.error("createPost tags:", tagError.message);
    }
  }

  revalidatePath("/profile", "layout");
  revalidatePath("/post", "layout");
  return data.id;
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

  revalidatePath("/profile", "layout");
  revalidatePath(`/post/${postId}`);
}

type ProfileJoin = {
  full_name: string | null;
  avatar_url: string | null;
  email: string;
  username: string | null;
};

type EventJoin = {
  title: string;
  location: string | null;
  location_name: string | null;
};

function mapPostRow(
  row: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    event_id: string | null;
    image_url?: string | null;
    media_urls?: unknown;
    profiles: unknown;
    events: unknown;
    post_reactions?: { user_id: string }[] | null;
    post_comments?: { id: string }[] | null;
  },
  currentUserId: string | undefined,
  imageUrlFallback?: string | null,
): Post {
  const profile = row.profiles as ProfileJoin | null;
  const event = row.events as EventJoin | null;
  const reactions = (row.post_reactions ?? []) as { user_id: string }[];
  const comments = (row.post_comments ?? []) as { id: string }[];
  const locationLabel =
    event?.location_name?.trim() ||
    event?.location?.trim() ||
    null;
  const image_url = row.image_url ?? imageUrlFallback ?? null;
  const media_urls = normalizePostMedia(image_url, row.media_urls);

  return {
    id: row.id,
    content: row.content,
    image_url: coverMediaUrl(media_urls) ?? image_url,
    media_urls,
    created_at: row.created_at,
    user_id: row.user_id,
    author_name: profile?.full_name ?? null,
    author_avatar: profile?.avatar_url ?? null,
    author_email: profile?.email ?? "",
    author_username: profile?.username ?? null,
    event_id: row.event_id,
    event_title: event?.title ?? null,
    event_location: locationLabel,
    reaction_count: reactions.length,
    user_reacted: reactions.some((r) => r.user_id === currentUserId),
    comment_count: comments.length,
  };
}

export async function getUserPosts(userId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id, content, created_at, user_id, event_id, image_url, media_urls,
      profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
      events(title, location, location_name),
      post_reactions(user_id),
      post_comments(id)
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    // Fallback bez media_urls / username / location (starszy schemat)
    const fallback = await supabase
      .from("posts")
      .select(`
        id, content, created_at, user_id, event_id, image_url,
        profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
        events(title, location, location_name),
        post_reactions(user_id),
        post_comments(id)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fallback.error) {
      console.error("getUserPosts:", fallback.error.message);
      return [];
    }

    return (fallback.data ?? []).map((row) => mapPostRow(row, user?.id));
  }

  return (data ?? []).map((row) => mapPostRow(row, user?.id));
}

export async function getPostById(postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id, content, created_at, user_id, event_id, image_url, media_urls,
      profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
      events(title, location, location_name),
      post_reactions(user_id),
      post_comments(id)
    `)
    .eq("id", postId)
    .maybeSingle();

  if (error && error.message.toLowerCase().includes("media_urls")) {
    const fallback = await supabase
      .from("posts")
      .select(`
        id, content, created_at, user_id, event_id, image_url,
        profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
        events(title, location, location_name),
        post_reactions(user_id),
        post_comments(id)
      `)
      .eq("id", postId)
      .maybeSingle();
    if (fallback.error || !fallback.data) {
      if (fallback.error) console.error("getPostById:", fallback.error.message);
      return null;
    }
    return mapPostRow(fallback.data, user?.id);
  }

  if (error || !data) {
    if (error) console.error("getPostById:", error.message);
    return null;
  }

  return mapPostRow(data, user?.id);
}

export type PostTaggedUser = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export async function getPostTaggedUsers(postId: string): Promise<PostTaggedUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("post_tags")
    .select(`
      user_id,
      profiles!post_tags_user_id_fkey(username, full_name, avatar_url)
    `)
    .eq("post_id", postId);

  if (error) {
    console.error("getPostTaggedUsers:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as {
      username: string | null;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
    return {
      id: row.user_id,
      username: profile?.username ?? null,
      full_name: profile?.full_name ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });
}

/** Posty, na których oznaczono danego użytkownika (zakładka Oznaczone). */
export async function getTaggedPosts(taggedUserId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tagRows, error: tagError } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("user_id", taggedUserId);

  if (tagError) {
    console.error("getTaggedPosts tags:", tagError.message);
    return [];
  }

  const postIds = [...new Set((tagRows ?? []).map((r) => r.post_id))];
  if (postIds.length === 0) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id, content, created_at, user_id, event_id, image_url, media_urls,
      profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
      events(title, location, location_name),
      post_reactions(user_id),
      post_comments(id)
    `)
    .in("id", postIds)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message.toLowerCase().includes("media_urls")) {
      const fallback = await supabase
        .from("posts")
        .select(`
          id, content, created_at, user_id, event_id, image_url,
          profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
          events(title, location, location_name),
          post_reactions(user_id),
          post_comments(id)
        `)
        .in("id", postIds)
        .order("created_at", { ascending: false });
      if (fallback.error) {
        console.error("getTaggedPosts posts:", fallback.error.message);
        return [];
      }
      return (fallback.data ?? []).map((row) => mapPostRow(row, user?.id));
    }
    console.error("getTaggedPosts posts:", error.message);
    return [];
  }

  return (data ?? []).map((row) => mapPostRow(row, user?.id));
}

export async function getPostComments(postId: string): Promise<Comment[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("post_comments")
    .select(`
      id, post_id, user_id, content, created_at,
      profiles!post_comments_user_id_fkey(full_name, avatar_url, email)
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPostComments:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { full_name: string | null; avatar_url: string | null; email: string } | null;
    return {
      id: row.id,
      post_id: row.post_id,
      user_id: row.user_id,
      content: row.content,
      created_at: row.created_at,
      author_name: profile?.full_name ?? null,
      author_avatar: profile?.avatar_url ?? null,
      author_email: profile?.email ?? "",
    };
  });
}

export async function createComment(postId: string, content: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Komentarz nie może być pusty.");
  if (trimmed.length > 300) throw new Error("Komentarz max 300 znaków.");

  const { error } = await supabase.from("post_comments").insert({
    post_id: postId,
    user_id: user.id,
    content: trimmed,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/profile", "layout");
  revalidatePath(`/post/${postId}`);
}

export async function isPostSaved(postId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("isPostSaved:", error.message);
    return false;
  }
  return Boolean(data);
}

/** Zwraca true jeśli post jest teraz zapisany. */
export async function toggleSavedPost(postId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Musisz być zalogowany.");

  const { data: existing } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) throw new Error(error.message);
    revalidatePath("/profile", "layout");
    revalidatePath(`/post/${postId}`);
    return false;
  }

  const { error } = await supabase.from("saved_posts").insert({
    post_id: postId,
    user_id: user.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/profile", "layout");
  revalidatePath(`/post/${postId}`);
  return true;
}

export async function getSavedPosts(userId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Tylko własne zapisane (RLS)
  if (!user || user.id !== userId) return [];

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (savedError) {
    console.error("getSavedPosts:", savedError.message);
    return [];
  }

  const postIds = (savedRows ?? []).map((r) => r.post_id);
  if (postIds.length === 0) return [];

  const { data, error } = await supabase
    .from("posts")
    .select(`
      id, content, created_at, user_id, event_id, image_url, media_urls,
      profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
      events(title, location, location_name),
      post_reactions(user_id),
      post_comments(id)
    `)
    .in("id", postIds);

  if (error) {
    if (error.message.toLowerCase().includes("media_urls")) {
      const fallback = await supabase
        .from("posts")
        .select(`
          id, content, created_at, user_id, event_id, image_url,
          profiles!posts_user_id_fkey(full_name, avatar_url, email, username),
          events(title, location, location_name),
          post_reactions(user_id),
          post_comments(id)
        `)
        .in("id", postIds);
      if (fallback.error) {
        console.error("getSavedPosts posts:", fallback.error.message);
        return [];
      }
      const order = new Map(postIds.map((id, i) => [id, i]));
      return (fallback.data ?? [])
        .map((row) => mapPostRow(row, user.id))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    }
    console.error("getSavedPosts posts:", error.message);
    return [];
  }

  const order = new Map(postIds.map((id, i) => [id, i]));
  return (data ?? [])
    .map((row) => mapPostRow(row, user.id))
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
