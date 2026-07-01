"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/events/bottom-nav";
import { updateBio, updateAvatarUrl, updateFullName } from "@/app/profile/actions";
import { createPost, toggleReaction } from "@/app/profile/wall-actions";
import type { Event } from "@/types/event";
import type { Badge } from "@/lib/profile/badges";
import type { Post } from "@/app/profile/wall-actions";

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
  badges: Badge[];
  posts: Post[];
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

export function ProfilePage({ email, bio, avatarUrl, fullName, userId, goingEvents, savedEvents, followers, following, badges, posts }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("wall");
  const [signingOut, setSigningOut] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postingContent, setPostingContent] = useState(false);
  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  const [reactingPostId, setReactingPostId] = useState<string | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(fullName ?? "");
  const [savingName, setSavingName] = useState(false);

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

  async function handleCreatePost() {
    if (!postContent.trim()) return;
    setPostingContent(true);
    try {
      await createPost(postContent);
      setPostContent("");
      const newPost: Post = {
        id: Date.now().toString(),
        content: postContent.trim(),
        created_at: new Date().toISOString(),
        user_id: userId,
        author_name: nameValue || null,
        author_avatar: currentAvatarUrl,
        author_email: email,
        event_id: null,
        event_title: null,
        reaction_count: 0,
        user_reacted: false,
      };
      setLocalPosts((prev) => [newPost, ...prev]);
    } catch {
      alert("Nie udało się dodać posta.");
    } finally {
      setPostingContent(false);
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

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/");
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-[#080810] pb-28 text-white">
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
        <div className="w-6" />
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
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#3b82f6", padding: 3, position: "relative" }}>
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

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 px-4">
          {badges.map((badge) => (
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
        <button
          type="button"
          onClick={() => setActiveTab("badges")}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-zinc-800 py-2.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-zinc-300">
            <circle cx="12" cy="8" r="6" />
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
          </svg>
          Odznaka
        </button>
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
            <div className="flex gap-3 rounded-2xl bg-white/5 p-3">
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
                  placeholder="Co słychać? Podziel się z innymi…"
                  maxLength={500}
                  rows={2}
                  className="w-full resize-none bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600">{postContent.length}/500</span>
                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={!postContent.trim() || postingContent}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white disabled:opacity-40"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                    </svg>
                  </button>
                </div>
              </div>
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
                  <div key={post.id} className="rounded-2xl bg-white/5 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full">
                        {post.author_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-bold`}>{postInitials}</div>
                        )}
                      </div>
                      <div className="flex-1">
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
                        <p className="mt-2 text-sm leading-relaxed text-zinc-200">{post.content}</p>
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
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Odznaki */}
        {activeTab === "badges" && (
          <div>
            {badges.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl">🏅</p>
                <p className="mt-3 text-sm text-zinc-500">Brak odznak. Kliknij „Idę" na wydarzeniu!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center gap-2 rounded-2xl bg-white/5 p-4 text-center">
                    <span className="text-3xl">{badge.emoji}</span>
                    <span className="text-sm font-semibold">{badge.label}</span>
                    <span className="text-xs text-zinc-500">{badge.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Historia */}
        {activeTab === "historia" && (
          <div>
            {goingEvents.length + savedEvents.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-3xl">📅</p>
                <p className="mt-3 text-sm text-zinc-500">Brak aktywności.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...goingEvents.map((e) => ({ ...e, _status: "going" as const })), ...savedEvents.map((e) => ({ ...e, _status: "saved" as const }))]
                  .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
                  .map((event) => (
                    <Link key={`${event._status}-${event.id}`} href={`/events/${event.id}`} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 hover:bg-white/10">
                      <span className="text-lg">{event._status === "going" ? "🎟️" : "🔖"}</span>
                      <div>
                        <p className="text-sm font-medium">{event.title}</p>
                        <p className="text-xs text-zinc-500">{event.location}</p>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Znajomi */}
        {activeTab === "znajomi" && (
          <div className="py-10 text-center">
            <p className="text-3xl">👥</p>
            <p className="mt-3 text-sm text-zinc-500">Znajomi już wkrótce.</p>
            <p className="mt-1 text-xs text-zinc-600">Ta funkcja jest w przygotowaniu.</p>
          </div>
        )}
      </main>

      {/* Sign out */}
      <div className="px-4 pt-8">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="w-full rounded-2xl border border-white/10 py-3 text-sm font-medium text-zinc-400 transition-colors hover:border-red-500/30 hover:text-red-400 disabled:opacity-40"
        >
          {signingOut ? "Wylogowywanie…" : "Wyloguj się"}
        </button>
      </div>

      <BottomNav activePage="profile" />
    </div>
  );
}
