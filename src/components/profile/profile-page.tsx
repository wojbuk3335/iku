"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/events/bottom-nav";
import { ProfileAccountMenu } from "@/components/profile/profile-account-menu";
import { updateBio, updateAvatarUrl, updateFullName } from "@/app/profile/actions";
import { createPost, toggleReaction, getPostComments, createComment } from "@/app/profile/wall-actions";
import { followUser, unfollowUser } from "@/app/profile/znajomi-actions";
import { getEventCategories } from "@/lib/events/category-style";
import type { Event } from "@/types/event";
import type { BadgeWithProgress } from "@/lib/profile/badges";
import type { Post, Comment } from "@/app/profile/wall-actions";
import type { FollowingUser, SuggestedUser } from "@/app/profile/znajomi-actions";

type ProfilePageProps = {
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  userId: string;
  goingEvents: Event[];
  savedEvents: Event[];
  followers: number;
  following: number;
  badgesWithProgress: BadgeWithProgress[];
  posts: Post[];
  followingUsers: FollowingUser[];
  suggestedUsers: SuggestedUser[];
};

function getInitials(email: string): string {
  const name = email.split("@")[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(email: string): string {
  const colors = [
    "from-violet-500 to-purple-700",
    "from-blue-500 to-indigo-700",
    "from-emerald-500 to-teal-700",
    "from-rose-500 to-pink-700",
    "from-orange-500 to-amber-700",
    "from-cyan-500 to-blue-700",
  ];
  const index =
    email.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    colors.length;
  return colors[index];
}

type Tab = "wall" | "badges" | "znajomi" | "historia";

function rarityColor(rarity: string): string {
  switch (rarity) {
    case "Rzadka":     return "#3b82f6";
    case "Epicka":     return "#a855f7";
    case "Legendarna": return "#f59e0b";
    default:           return "#71717a";
  }
}

function rarityGradient(rarity: string): string {
  switch (rarity) {
    case "Rzadka":     return "linear-gradient(135deg, #0891b2, #1d4ed8)";
    case "Epicka":     return "linear-gradient(135deg, #7c3aed, #db2777)";
    case "Legendarna": return "linear-gradient(135deg, #d97706, #ea580c)";
    default:           return "linear-gradient(135deg, #2563eb, #4f46e5)";
  }
}

function BadgeProgressBar({ current, max, dim = false }: { current: number; max: number; dim?: boolean }) {
  const [width, setWidth] = useState(0);
  const targetWidth = max > 0 ? Math.min(100, (current / max) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setWidth(targetWidth), 80);
    return () => clearTimeout(t);
  }, [targetWidth]);

  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className="h-1 rounded-full transition-[width] duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: dim ? "rgba(59,130,246,0.45)" : "#3b82f6",
        }}
      />
    </div>
  );
}

function BadgeIcon({ id, size = 20, color = "currentColor" }: { id: string; size?: number; color?: string }) {
  const p = { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none" as const, stroke: color, strokeWidth: 1.5, width: size, height: size };
  switch (id) {
    case "first_event":
      return <svg {...p}><path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.52 4.674a1 1 0 00.95.69h4.915c.97 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.95-.69l1.52-4.674z" strokeLinejoin="round"/></svg>;
    case "early_bird":
      return <svg {...p}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="6.34" y2="6.34"/><line x1="17.66" y1="17.66" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="6.34" y2="17.66"/><line x1="17.66" y1="6.34" x2="19.07" y2="4.93"/></svg>;
    case "collector":
      return <svg {...p}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinejoin="round"/></svg>;
    case "active":
      return <svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
    case "regular_participant":
      return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
    case "event_veteran":
      return <svg {...p}><path d="M8 21h8m-4-4v-5"/><path d="M4 7h16v5a8 8 0 0 1-16 0V7z"/><line x1="4" y1="7" x2="4" y2="4"/><line x1="20" y1="7" x2="20" y2="4"/><line x1="4" y1="4" x2="20" y2="4"/></svg>;
    case "community_ambassador":
      return <svg {...p}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinejoin="round"/></svg>;
    case "trendsetter":
      return <svg {...p}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round"/></svg>;
    case "night_player":
      return <svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinejoin="round"/></svg>;
    case "explorer":
      return <svg {...p}><circle cx="12" cy="12" r="10"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" strokeLinejoin="round"/></svg>;
    case "weekend_explorer":
      return <svg {...p}><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" strokeLinejoin="round"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;
    case "top_participant":
      return <svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" strokeLinejoin="round"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export function ProfilePage({ email, bio, avatarUrl, fullName, userId, goingEvents, savedEvents, followers, following, badgesWithProgress, posts, followingUsers, suggestedUsers }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("wall");
  const [signingOut, setSigningOut] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postingContent, setPostingContent] = useState(false);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [loadingCommentsId, setLoadingCommentsId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingCommentId, setSubmittingCommentId] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(fullName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [localFollowing, setLocalFollowing] = useState<FollowingUser[]>(followingUsers);
  const [localSuggestions, setLocalSuggestions] = useState<SuggestedUser[]>(suggestedUsers);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(null);

  const initials = getInitials(email);
  const avatarGradient = getAvatarColor(email);
  const fallbackName = email.split("@")[0].replace(/[._-]/g, " ");
  const displayName = nameValue || fallbackName;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Plik jest za duży. Maksymalnie 2 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      await updateAvatarUrl(publicUrl);
      setCurrentAvatarUrl(publicUrl);
    } catch (err) {
      console.error("Avatar upload error:", err);
      alert("Nie udało się przesłać zdjęcia.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  function handlePostImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Zdjęcie max 5 MB."); return; }
    setPostImageFile(file);
    setPostImagePreview(URL.createObjectURL(file));
  }

  function clearPostImage() {
    setPostImageFile(null);
    setPostImagePreview(null);
  }

  async function handleCreatePost() {
    if (!postContent.trim() && !postImageFile) return;
    setPostingContent(true);
    let imageUrl: string | null = null;
    try {
      if (postImageFile) {
        setUploadingPostImage(true);
        const supabase = createClient();
        const ext = postImageFile.name.split(".").pop();
        const path = `${userId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("post-images")
          .upload(path, postImageFile, { upsert: false });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("post-images").getPublicUrl(path);
        imageUrl = data.publicUrl;
        setUploadingPostImage(false);
      }
      await createPost(postContent, imageUrl);
      const newPost: Post = {
        id: Date.now().toString(),
        content: postContent.trim(),
        image_url: imageUrl,
        created_at: new Date().toISOString(),
        user_id: userId,
        author_name: nameValue || null,
        author_avatar: currentAvatarUrl,
        author_email: email,
        event_id: null,
        event_title: null,
        reaction_count: 0,
        user_reacted: false,
        comment_count: 0,
      };
      setLocalPosts((prev) => [newPost, ...prev]);
      setPostContent("");
      clearPostImage();
    } catch {
      alert("Nie udało się dodać posta.");
    } finally {
      setPostingContent(false);
      setUploadingPostImage(false);
    }
  }

  async function handleReaction(postId: string) {
    setReactingPostId(postId);
    try {
      await toggleReaction(postId);
      setLocalPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                user_reacted: !p.user_reacted,
                reaction_count: p.user_reacted
                  ? p.reaction_count - 1
                  : p.reaction_count + 1,
              }
            : p,
        ),
      );
    } finally {
      setReactingPostId(null);
    }
  }

  async function handleSaveName() {
    setSavingName(true);
    try {
      await updateFullName(nameValue);
      setEditingName(false);
    } catch {
      alert("Nie udało się zapisać imienia.");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      await updateBio(bioValue);
      setEditingBio(false);
    } finally {
      setSavingBio(false);
    }
  }

  async function handleShare(postId: string) {
    const url = `${window.location.origin}/profile?post=${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedPostId(postId);
        setTimeout(() => setCopiedPostId(null), 2000);
      }
    } catch {
      // user cancelled share or clipboard denied
    }
  }

  async function handleToggleComments(postId: string) {
    if (openCommentsPostId === postId) {
      setOpenCommentsPostId(null);
      return;
    }
    setOpenCommentsPostId(postId);
    if (!commentsMap[postId]) {
      setLoadingCommentsId(postId);
      const comments = await getPostComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: comments }));
      setLoadingCommentsId(null);
    }
  }

  async function handleSubmitComment(postId: string) {
    const content = commentInputs[postId] ?? "";
    if (!content.trim()) return;
    setSubmittingCommentId(postId);
    try {
      await createComment(postId, content);
      const newComment: Comment = {
        id: Date.now().toString(),
        post_id: postId,
        user_id: userId,
        content: content.trim(),
        created_at: new Date().toISOString(),
        author_name: nameValue || null,
        author_avatar: currentAvatarUrl,
        author_email: email,
      };
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), newComment],
      }));
      setLocalPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p)
      );
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch {
      alert("Nie udało się dodać komentarza.");
    } finally {
      setSubmittingCommentId(null);
    }
  }

  async function handleFollow(user: SuggestedUser) {
    setAddingUserId(user.id);
    try {
      await followUser(user.id);
      setLocalFollowing((prev) => [...prev, { id: user.id, full_name: user.full_name, avatar_url: user.avatar_url, bio: null }]);
      setLocalSuggestions((prev) => prev.filter((u) => u.id !== user.id));
    } catch {
      alert("Nie udało się dodać znajomego.");
    } finally {
      setAddingUserId(null);
    }
  }

  async function handleUnfollow(userId: string) {
    setUnfollowingUserId(userId);
    try {
      await unfollowUser(userId);
      const removed = localFollowing.find((u) => u.id === userId);
      setLocalFollowing((prev) => prev.filter((u) => u.id !== userId));
      if (removed) {
        setLocalSuggestions((prev) => [{ id: removed.id, full_name: removed.full_name, avatar_url: removed.avatar_url, mutual_count: 0 }, ...prev]);
      }
    } catch {
      alert("Nie udało się usunąć znajomego.");
    } finally {
      setUnfollowingUserId(null);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl bg-[#080810] pb-28 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 pb-2 pt-5">
        <Link href="/events" className="text-zinc-400 hover:text-white">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-6 w-6"
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-zinc-300">
          @{email.split("@")[0]}
        </span>
        <ProfileAccountMenu userEmail={email} />
      </header>

      {/* Avatar + name */}
      <div className="flex flex-col items-center px-4 py-6">
        <label className="group relative cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
          {/* Outer ring - blue border with gap */}
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "linear-gradient(135deg, #a855f7, #7c3aed, #4f46e5)", padding: 3, position: "relative" }}>
            <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#080810", padding: 2 }}>
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden", position: "relative" }}>
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatarGradient} text-2xl font-bold`}>
                    {initials}
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 z-10" style={{ borderRadius: "50%" }}>
                  {uploadingAvatar ? (
                    <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6 text-white">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </label>
        {editingName ? (
          <div className="mt-3 flex w-full max-w-xs flex-col gap-2">
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              maxLength={50}
              placeholder="Twoje imię i nazwisko"
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-center text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-violet-500"
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveName}
                disabled={savingName}
                className="flex-1 rounded-xl bg-violet-600 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingName ? "Zapisywanie…" : "Zapisz"}
              </button>
              <button
                type="button"
                onClick={() => { setEditingName(false); setNameValue(fullName ?? ""); }}
                className="flex-1 rounded-xl bg-white/10 py-1.5 text-sm text-zinc-300"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="group mt-3 flex items-center gap-1.5"
          >
            <h1 className="text-lg font-bold capitalize">{displayName}</h1>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
        <p className="mt-0.5 text-sm text-zinc-500">@{email.split("@")[0]}</p>

        {/* Bio */}
        {editingBio ? (
          <div className="mt-3 w-full max-w-xs">
            <textarea
              value={bioValue}
              onChange={(e) => setBioValue(e.target.value)}
              maxLength={120}
              rows={2}
              placeholder="Napisz coś o sobie…"
              className="w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-violet-500"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSaveBio}
                disabled={savingBio}
                className="flex-1 rounded-xl bg-violet-600 py-1.5 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingBio ? "Zapisywanie…" : "Zapisz"}
              </button>
              <button
                type="button"
                onClick={() => { setEditingBio(false); setBioValue(bio ?? ""); }}
                className="flex-1 rounded-xl bg-white/10 py-1.5 text-sm text-zinc-300"
              >
                Anuluj
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingBio(true)}
            className="mt-2 max-w-xs text-center text-sm text-zinc-400 hover:text-zinc-200"
          >
            {bioValue ? bioValue : (
              <span className="text-zinc-600 underline-offset-2 hover:underline">
                + Dodaj bio
              </span>
            )}
          </button>
        )}
      </div>

      {/* Badges — unlocked chips in profile header */}
      {badgesWithProgress.filter((b) => b.unlocked).length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 px-4">
          {badgesWithProgress.filter((b) => b.unlocked).map((badge) => (
            <div
              key={badge.id}
              title={badge.description}
              className="flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200 shadow-sm"
            >
              <span className="text-sm">{badge.emoji}</span>
              <span>{badge.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="mt-4 flex w-full">
        <div className="flex flex-1 flex-col items-center gap-0.5 py-3">
          <span className="text-xl font-bold leading-none text-white">{followers}</span>
          <span style={{ color: "#71717a", fontSize: "11px" }}>Obserwujący</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5 py-3">
          <span className="text-xl font-bold leading-none text-white">{following}</span>
          <span style={{ color: "#71717a", fontSize: "11px" }}>Obserwujesz</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-0.5 py-3">
          <span className="text-xl font-bold leading-none text-white">{goingEvents.length}</span>
          <span style={{ color: "#71717a", fontSize: "11px" }}>Wydarzeń</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-3 px-4">
        <Link
          href="/events/new"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-500 py-2.5 text-xs font-semibold text-white hover:bg-blue-400 active:scale-95 transition-transform"
        >
          Utwórz wydarzenie
        </Link>
        <Link
          href="/badges/create"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-zinc-300">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
          Odznaka
        </Link>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "14px", marginTop: "20px", marginLeft: "16px", marginRight: "16px", padding: "4px", gap: "4px" }}>
        {(["wall", "badges", "znajomi", "historia"] as Tab[]).map((tab) => {
          const labels: Record<Tab, string> = {
            wall: "Wall",
            badges: "Odznaki",
            znajomi: "Znajomi",
            historia: "Historia",
          };
          const icons: Record<Tab, React.ReactNode> = {
            wall: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            ),
            badges: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <circle cx="12" cy="8" r="6" />
                <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
              </svg>
            ),
            znajomi: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            ),
            historia: (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="15" height="15">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          };
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "5px",
                paddingTop: "7px",
                paddingBottom: "7px",
                paddingLeft: "10px",
                paddingRight: "10px",
                fontSize: "11px",
                fontWeight: 500,
                background: isActive ? "#3b82f6" : "none",
                border: "none",
                borderRadius: "10px",
                color: isActive ? "#ffffff" : "#71717a",
                cursor: "pointer",
                transition: "color 0.15s, background 0.15s",
                marginBottom: "0",
                whiteSpace: "nowrap",
              }}
            >
              {icons[tab]}
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <main className="px-4 pt-4">

        {/* Wall */}
        {activeTab === "wall" && (
          <div className="space-y-3">
            {/* Composer */}
            <div className="rounded-2xl bg-white/5 p-3">
              <div className="flex gap-3">
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                  {currentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-bold`}>{initials}</div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Co słychać? Podziel się z znajomymi…"
                    maxLength={500}
                    rows={2}
                    className="w-full resize-none bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="sr-only"
                        onChange={handlePostImageChange}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">{postContent.length}/500</span>
                      <button
                        type="button"
                        onClick={handleCreatePost}
                        disabled={(!postContent.trim() && !postImageFile) || postingContent}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white disabled:opacity-40"
                      >
                        {postingContent ? (
                          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Image preview */}
              {postImagePreview && (
                <div className="relative mt-2 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={postImagePreview} alt="Podgląd" className="max-h-48 w-full object-cover" />
                  <button
                    type="button"
                    onClick={clearPostImage}
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                  {uploadingPostImage && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <svg className="h-8 w-8 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Posts feed */}
            {localPosts.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-600">Brak postów. Napisz coś!</div>
            ) : (
              localPosts.map((post) => {
                const postInitials = post.author_name
                  ? post.author_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
                  : post.author_email.slice(0, 2).toUpperCase();
                return (
                  <div key={post.id} className="overflow-hidden rounded-2xl bg-white/5">
                    {/* Header + text */}
                    <div className="flex items-start gap-3 px-4 pt-4">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                        {post.author_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-bold`}>{postInitials}</div>
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{post.author_name || post.author_email.split("@")[0]}</span>
                          {post.event_title && (
                            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300">
                              🎫 {post.event_title.length > 15 ? post.event_title.slice(0, 15) + "…" : post.event_title}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {new Date(post.created_at).toLocaleDateString("pl-PL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                        {post.content && <p className="mt-2 text-sm leading-relaxed text-zinc-200">{post.content}</p>}
                      </div>
                    </div>
                    {/* Full-width image */}
                    {post.image_url && (
                      <div className="px-3 pb-1">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.image_url} alt="" className="w-full rounded-xl object-cover max-h-80" />
                      </div>
                    )}
                    {/* Reactions */}
                    <div className="px-4 pb-3">
                    <div className="mt-3 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => handleReaction(post.id)}
                            disabled={reactingPostId === post.id}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${post.user_reacted ? "text-rose-400" : "text-zinc-500 hover:text-rose-400"}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={post.user_reacted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                            {post.reaction_count > 0 && <span>{post.reaction_count}</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleComments(post.id)}
                            className={`flex items-center gap-1.5 text-sm transition-colors ${openCommentsPostId === post.id ? "text-blue-400" : "text-zinc-500 hover:text-blue-400"}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {post.comment_count > 0 && <span>{post.comment_count}</span>}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleShare(post.id)}
                            className="ml-auto flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                          >
                            {copiedPostId === post.id ? (
                              <>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-green-400">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span className="text-xs text-green-400">Skopiowano</span>
                              </>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Comments section */}
                        {openCommentsPostId === post.id && (
                          <div className="mt-3 border-t border-white/5 pt-3">
                            {loadingCommentsId === post.id ? (
                              <p className="text-xs text-zinc-600">Ładowanie…</p>
                            ) : (
                              <div className="space-y-2">
                                {(commentsMap[post.id] ?? []).length === 0 && (
                                  <p className="text-xs text-zinc-600">Brak komentarzy. Napisz pierwszy!</p>
                                )}
                                {(commentsMap[post.id] ?? []).map((c) => {
                                  const cInitials = c.author_name
                                    ? c.author_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
                                    : c.author_email.slice(0, 2).toUpperCase();
                                  return (
                                    <div key={c.id} className="flex gap-2">
                                      <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full">
                                        {c.author_avatar ? (
                                          // eslint-disable-next-line @next/next/no-img-element
                                          <img src={c.author_avatar} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                          <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-[9px] font-bold`}>{cInitials}</div>
                                        )}
                                      </div>
                                      <div className="flex-1 rounded-xl bg-white/5 px-3 py-1.5">
                                        <span className="text-xs font-semibold text-zinc-300">{c.author_name || c.author_email.split("@")[0]}</span>
                                        <p className="text-xs text-zinc-400">{c.content}</p>
                                      </div>
                                    </div>
                                  );
                                })}
                                {/* Comment input */}
                                <div className="flex gap-2 pt-1">
                                  <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full">
                                    {currentAvatarUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={currentAvatarUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-[9px] font-bold`}>{initials}</div>
                                    )}
                                  </div>
                                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5">
                                    <input
                                      type="text"
                                      value={commentInputs[post.id] ?? ""}
                                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                                      onKeyDown={(e) => e.key === "Enter" && handleSubmitComment(post.id)}
                                      placeholder="Napisz komentarz…"
                                      maxLength={300}
                                      className="flex-1 bg-transparent text-xs text-white placeholder-zinc-600 outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSubmitComment(post.id)}
                                      disabled={!(commentInputs[post.id] ?? "").trim() || submittingCommentId === post.id}
                                      className="text-blue-500 disabled:opacity-30 hover:text-blue-400"
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Odznaki */}
        {activeTab === "badges" && (
          <div className="space-y-5 pb-4">

            {/* Utwórz własną odznakę */}
            <Link
              href="/badges/create"
              className="flex w-full items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-zinc-400 transition-colors hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Utwórz własną odznakę
            </Link>

            {/* Postęp globalny */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="1.5" width="15" height="15">
                  <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm font-semibold text-zinc-300">Postęp globalny</span>
              </div>

              <div className="space-y-2">
                {badgesWithProgress.map((badge) => (
                  <div key={badge.id} className="rounded-2xl bg-white/5 p-3">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5">
                        <BadgeIcon id={badge.id} size={18} color={badge.unlocked ? rarityColor(badge.rarity) : "#52525b"} />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">{badge.label}</span>
                          <span className="shrink-0 text-xs font-medium" style={{ color: rarityColor(badge.rarity) }}>
                            {badge.rarity}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-500">{badge.description}</p>

                        {badge.unlocked ? (
                          <p className="mt-1.5 text-xs font-medium text-emerald-500">Odblokowana ✓</p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            <BadgeProgressBar current={badge.current} max={badge.max} />
                            <p className="text-xs text-zinc-600">{badge.current}/{badge.max}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Odblokowane */}
            {badgesWithProgress.filter((b) => b.unlocked).length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Odblokowane ({badgesWithProgress.filter((b) => b.unlocked).length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {badgesWithProgress.filter((b) => b.unlocked).map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center gap-1.5 text-center">
                      <div
                        className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl"
                        style={{ background: rarityGradient(badge.rarity) }}
                      >
                        <span
                          className="absolute right-2 top-2 h-2 w-2 rounded-full bg-blue-400"
                          style={{ boxShadow: "0 0 6px #60a5fa" }}
                        />
                        <BadgeIcon id={badge.id} size={30} color="white" />
                      </div>
                      <span className="w-full truncate text-center text-[11px] font-medium leading-tight text-zinc-300">
                        {badge.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Do zdobycia */}
            {badgesWithProgress.filter((b) => !b.unlocked).length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                  Do zdobycia ({badgesWithProgress.filter((b) => !b.unlocked).length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {badgesWithProgress.filter((b) => !b.unlocked).map((badge) => (
                    <div key={badge.id} className="flex flex-col items-center gap-1.5 text-center">
                      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-white/5">
                        <BadgeIcon id={badge.id} size={26} color="#52525b" />
                      </div>
                      <span className="w-full truncate text-center text-[11px] leading-tight text-zinc-600">
                        {badge.label}
                      </span>
                      {badge.max > 1 && (
                        <div className="w-full space-y-0.5 px-1">
                          <BadgeProgressBar current={badge.current} max={badge.max} dim />
                          <p className="text-[10px] text-zinc-700">{badge.current}/{badge.max}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historia */}
        {activeTab === "historia" && (() => {
          const MONTHS = ["sty","lut","mar","kwi","maj","cze","lip","sie","wrz","paź","lis","gru"];
          const fmtDate = (iso: string) => {
            const d = new Date(iso);
            return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
          };

          const allEvents = [
            ...goingEvents.map((e) => ({ ...e, _status: "going" as const })),
            ...savedEvents.map((e) => ({ ...e, _status: "saved" as const })),
          ]
            .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)
            .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime());

          const uniqueCategories = new Set(
            allEvents.flatMap((e) => getEventCategories(e)),
          ).size;
          const unlockedBadges = badgesWithProgress.filter((b) => b.unlocked).length;

          return (
            <div className="space-y-4 pb-4">
              {/* Stats bar */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: allEvents.length,  label: "Wszystkich wydarzeń" },
                  { value: uniqueCategories,  label: "Kategorie" },
                  { value: unlockedBadges,    label: "Odznaki" },
                ].map(({ value, label }) => (
                  <div key={label} className="flex flex-col items-center justify-center rounded-2xl bg-white/5 py-3 px-2 text-center">
                    <span className="text-xl font-bold text-white">{value}</span>
                    <span className="mt-0.5 text-[11px] text-zinc-500 leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* Event list */}
              {allEvents.length === 0 ? (
                <div className="rounded-2xl bg-white/5 py-10 text-center">
                  <p className="text-2xl">📅</p>
                  <p className="mt-2 text-sm text-zinc-500">Brak aktywności.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allEvents.map((event) => (
                    <Link
                      key={`${event._status}-${event.id}`}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      {/* Thumbnail */}
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {event.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">
                            🎪
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{event.title}</p>
                        <p className="text-xs text-amber-400">{fmtDate(event.starts_at)}</p>
                        <p className="truncate text-xs text-blue-400">{event.location}</p>
                      </div>

                      {/* Chevron */}
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-zinc-600">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Znajomi */}
        {activeTab === "znajomi" && (
          <div className="space-y-5 pb-4">

            {/* Obserwowani */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Znajomi ({localFollowing.length})
              </h3>

              {localFollowing.length === 0 ? (
                <div className="rounded-2xl bg-white/5 px-4 py-8 text-center">
                  <p className="text-2xl">👥</p>
                  <p className="mt-2 text-sm text-zinc-500">Nie obserwujesz jeszcze nikogo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {localFollowing.map((user) => {
                    const name = user.full_name ?? "Użytkownik";
                    const handle = "@" + name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
                    const uInitials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div key={user.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                        {/* Avatar */}
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold">
                              {uInitials}
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{name}</p>
                          <p className="truncate text-xs text-zinc-500">{handle}</p>
                        </div>

                        {/* Unfollow */}
                        <button
                          type="button"
                          onClick={() => handleUnfollow(user.id)}
                          disabled={unfollowingUserId === user.id}
                          className="shrink-0 rounded-full p-1.5 text-zinc-600 transition-colors hover:text-zinc-300 disabled:opacity-40"
                          title="Przestań obserwować"
                        >
                          {unfollowingUserId === user.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <line x1="22" y1="11" x2="16" y2="11"/>
                            </svg>
                          )}
                        </button>

                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 shrink-0 text-zinc-600">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Możesz znać */}
            {localSuggestions.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-zinc-300">Możesz znać</h3>
                <div className="space-y-2">
                  {localSuggestions.map((user) => {
                    const name = user.full_name ?? "Użytkownik";
                    const uInitials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                    return (
                      <div key={user.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                        {/* Avatar */}
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-xs font-bold">
                              {uInitials}
                            </div>
                          )}
                        </div>

                        {/* Name + mutual */}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{name}</p>
                          {user.mutual_count > 0 ? (
                            <p className="truncate text-xs text-zinc-500">{user.mutual_count} wspólnych znajomych</p>
                          ) : (
                            <p className="truncate text-xs text-zinc-600">Użytkownik IKU</p>
                          )}
                        </div>

                        {/* Follow button */}
                        <button
                          type="button"
                          onClick={() => handleFollow(user)}
                          disabled={addingUserId === user.id}
                          className="flex shrink-0 items-center gap-1.5 rounded-full bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:bg-blue-600 disabled:opacity-50"
                        >
                          {addingUserId === user.id ? (
                            <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                              <line x1="19" y1="8" x2="19" y2="14"/>
                              <line x1="22" y1="11" x2="16" y2="11"/>
                            </svg>
                          )}
                          Dodaj
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {localSuggestions.length === 0 && localFollowing.length > 0 && (
              <p className="text-center text-xs text-zinc-700">Brak nowych sugestii znajomych.</p>
            )}
          </div>
        )}
      </main>


      <BottomNav activePage="profile" />
    </div>
  );
}
