"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BottomNav } from "@/components/events/bottom-nav";
import { LocationPicker } from "@/components/events/location-picker";
import { ProfileAccountMenu } from "@/components/profile/profile-account-menu";
import { updateBio, updateAvatarUrl, updateFullName, updateLocation } from "@/app/profile/actions";
import { createPost } from "@/app/profile/wall-actions";
import { followUser, unfollowUser, searchUsers, searchAllUsers } from "@/app/profile/znajomi-actions";
import type { Event } from "@/types/event";
import type { EventLocation } from "@/types/location";
import type { BadgeWithProgress } from "@/lib/profile/badges";
import type { Post } from "@/app/profile/wall-actions";
import type { FollowingUser, SuggestedUser } from "@/app/profile/znajomi-actions";
import { usernameFromEmail } from "@/lib/profile/username";
import {
  PostGridThumb,
  MAX_POST_IMAGES,
  MAX_POST_IMAGE_BYTES,
  MAX_POST_VIDEO_BYTES,
} from "@/components/profile/post-media";
import type { PostMediaItem } from "@/lib/profile/post-media";

type DraftMedia = {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
};

type ProfilePageProps = {
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  username: string;
  location?: string | null;
  locationName?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  locationPlaceId?: string | null;
  userId: string;
  savedEvents?: Event[];
  followers: number;
  following: number;
  badgesWithProgress: BadgeWithProgress[];
  posts: Post[];
  taggedPosts?: Post[];
  savedPosts?: Post[];
  followingUsers: FollowingUser[];
  followerUsers: FollowingUser[];
  suggestedUsers: SuggestedUser[];
  hasActiveStory?: boolean;
  isOwner?: boolean;
  isFollowing?: boolean;
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

type Tab = "posty" | "badges" | "saved" | "oznaczone";
type StatsPanel = "followers" | "following" | "badges" | "posts" | null;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
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
    case "social_butterfly":
      return <svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case "city_hopper":
      return <svg {...p}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>;
    case "loyal_fan":
      return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinejoin="round"/></svg>;
    default:
      return <svg {...p}><circle cx="12" cy="12" r="10"/></svg>;
  }
}

export function ProfilePage({
  email,
  bio,
  avatarUrl,
  fullName,
  username: profileUsername,
  location: initialLocation = null,
  locationName: initialLocationName = null,
  locationLat: initialLocationLat = null,
  locationLng: initialLocationLng = null,
  locationPlaceId: initialLocationPlaceId = null,
  userId,
  savedEvents = [],
  followers,
  following,
  badgesWithProgress,
  posts,
  taggedPosts = [],
  savedPosts = [],
  followingUsers,
  followerUsers,
  suggestedUsers,
  hasActiveStory = false,
  isOwner = true,
  isFollowing: initialIsFollowing = false,
}: ProfilePageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("posty");
  const [composeOpen, setComposeOpen] = useState(false);
  const [statsPanel, setStatsPanel] = useState<StatsPanel>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState(bio ?? "");
  const [savingBio, setSavingBio] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postingContent, setPostingContent] = useState(false);
  const [postMedia, setPostMedia] = useState<DraftMedia[]>([]);
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [localPosts, setLocalPosts] = useState<Post[]>(posts);
  const [localTaggedPosts, setLocalTaggedPosts] = useState<Post[]>(taggedPosts);
  const [localSavedPosts, setLocalSavedPosts] = useState<Post[]>(savedPosts);
  const [taggedPeople, setTaggedPeople] = useState<SuggestedUser[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<SuggestedUser[]>([]);
  const [tagSearching, setTagSearching] = useState(false);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(avatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(fullName ?? "");
  const [savingName, setSavingName] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValue, setLocationValue] = useState(initialLocation ?? "");
  const [selectedLocation, setSelectedLocation] = useState<EventLocation | null>(() => {
    if (
      initialLocation &&
      initialLocationLat != null &&
      initialLocationLng != null
    ) {
      return {
        location: initialLocation,
        location_name: initialLocationName,
        latitude: initialLocationLat,
        longitude: initialLocationLng,
        place_id: initialLocationPlaceId,
      };
    }
    return null;
  });
  const [savingLocation, setSavingLocation] = useState(false);
  const [localFollowing, setLocalFollowing] = useState<FollowingUser[]>(followingUsers);
  const [localSuggestions, setLocalSuggestions] = useState<SuggestedUser[]>(suggestedUsers);
  const [followingCount, setFollowingCount] = useState(following);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [unfollowingUserId, setUnfollowingUserId] = useState<string | null>(null);
  const [suggestQuery, setSuggestQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SuggestedUser[] | null>(null);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [followingThisProfile, setFollowingThisProfile] = useState(initialIsFollowing);
  const [togglingFollowProfile, setTogglingFollowProfile] = useState(false);
  const [badgesExpanded, setBadgesExpanded] = useState(false);

  // Przy zmianie profilu (nawigacja /profile/A → /profile/B) zsynchronizuj lokalny stan z propsami
  useEffect(() => {
    setLocalPosts(posts);
    setLocalTaggedPosts(taggedPosts);
    setLocalSavedPosts(savedPosts);
    setCurrentAvatarUrl(avatarUrl);
    setBioValue(bio ?? "");
    setNameValue(fullName ?? "");
    setLocationValue(initialLocation ?? "");
    setLocalFollowing(followingUsers);
    setLocalSuggestions(suggestedUsers);
    setFollowingCount(following);
    setFollowingThisProfile(initialIsFollowing);
    setActiveTab("posty");
    setStatsPanel(null);
    setComposeOpen(false);
    setBadgesExpanded(false);
    setEditingBio(false);
    setEditingName(false);
    setEditingLocation(false);
    setSuggestQuery("");
    setSearchResults(null);
    setTaggedPeople([]);
    setTagQuery("");
    setTagResults([]);
    setTagPickerOpen(false);
    if (
      initialLocation &&
      initialLocationLat != null &&
      initialLocationLng != null
    ) {
      setSelectedLocation({
        location: initialLocation,
        location_name: initialLocationName,
        latitude: initialLocationLat,
        longitude: initialLocationLng,
        place_id: initialLocationPlaceId,
      });
    } else {
      setSelectedLocation(null);
    }
    // Tylko przy zmianie użytkownika profilu — nie przy każdym odświeżeniu propsów tego samego profilu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const initials = getInitials(email);
  const avatarGradient = getAvatarColor(email);
  const fallbackName = email.split("@")[0].replace(/[._-]/g, " ");
  const displayName = nameValue || fallbackName;
  const username = profileUsername;
  const unlockedBadges = badgesWithProgress.filter((b) => b.unlocked);
  const previewBadgesOrdered = [
    ...unlockedBadges,
    ...badgesWithProgress.filter((b) => !b.unlocked),
  ];
  const PREVIEW_BADGES_COUNT = 3;
  const visiblePreviewBadges = badgesExpanded
    ? previewBadgesOrdered
    : previewBadgesOrdered.slice(0, PREVIEW_BADGES_COUNT);
  const postsCount = localPosts.length;

  async function handleShareProfile() {
    const url = `${window.location.origin}/profile/${encodeURIComponent(username)}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: displayName,
          text: `Profil ${displayName} na IKU`,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link do profilu skopiowany.");
      }
    } catch {
      // cancelled
    }
  }

  async function handleToggleFollowProfile() {
    if (isOwner || togglingFollowProfile) return;
    setTogglingFollowProfile(true);
    try {
      if (followingThisProfile) {
        await unfollowUser(userId);
        setFollowingThisProfile(false);
      } else {
        await followUser(userId);
        setFollowingThisProfile(true);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się zmienić obserwowania.");
    } finally {
      setTogglingFollowProfile(false);
    }
  }

  useEffect(() => {
    const q = suggestQuery.trim();
    if (!q) {
      setSearchResults(null);
      setSearchingUsers(false);
      return;
    }

    setSearchingUsers(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(q);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [suggestQuery]);

  useEffect(() => {
    if (!tagPickerOpen) return;
    const q = tagQuery.trim();
    if (!q) {
      setTagResults([]);
      setTagSearching(false);
      return;
    }

    setTagSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchAllUsers(q);
        const selectedIds = new Set(taggedPeople.map((p) => p.id));
        setTagResults(results.filter((u) => !selectedIds.has(u.id)));
      } catch {
        setTagResults([]);
      } finally {
        setTagSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [tagQuery, tagPickerOpen, taggedPeople]);

  const displayedSuggestions = searchResults ?? localSuggestions;

  function resetCompose() {
    setPostContent("");
    clearPostMedia();
    setTaggedPeople([]);
    setTagQuery("");
    setTagResults([]);
    setTagPickerOpen(false);
  }

  function clearPostMedia() {
    setPostMedia((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.preview);
      return [];
    });
  }

  function removePostMedia(id: string) {
    setPostMedia((prev) => {
      const target = prev.find((m) => m.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((m) => m.id !== id);
    });
  }

  function handlePostImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setPostMedia((prev) => {
      const withoutVideo = prev.filter((m) => m.type !== "video");
      for (const v of prev.filter((m) => m.type === "video")) {
        URL.revokeObjectURL(v.preview);
      }

      const room = MAX_POST_IMAGES - withoutVideo.length;
      if (room <= 0) {
        alert(`Możesz dodać max ${MAX_POST_IMAGES} zdjęć.`);
        return withoutVideo;
      }

      const next = [...withoutVideo];
      for (const file of files.slice(0, room)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > MAX_POST_IMAGE_BYTES) {
          alert(`Zdjęcie „${file.name}” jest za duże (max 5 MB).`);
          continue;
        }
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          file,
          preview: URL.createObjectURL(file),
          type: "image",
        });
      }
      if (files.length > room) {
        alert(`Dodano tylko ${room} zdjęć (limit ${MAX_POST_IMAGES}).`);
      }
      return next;
    });
  }

  function handlePostVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      alert("Wybierz plik wideo (mp4, webm, mov).");
      return;
    }
    if (file.size > MAX_POST_VIDEO_BYTES) {
      alert("Wideo max 50 MB.");
      return;
    }
    setPostMedia((prev) => {
      for (const item of prev) URL.revokeObjectURL(item.preview);
      return [
        {
          id: `${Date.now()}-video`,
          file,
          preview: URL.createObjectURL(file),
          type: "video",
        },
      ];
    });
  }

  function toggleTagPerson(person: SuggestedUser) {
    setTaggedPeople((prev) => {
      if (prev.some((p) => p.id === person.id)) {
        return prev.filter((p) => p.id !== person.id);
      }
      if (prev.length >= 10) {
        alert("Możesz oznaczyć max 10 osób.");
        return prev;
      }
      return [...prev, person];
    });
    setTagQuery("");
    setTagResults([]);
  }

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
    if (!postContent.trim() && postMedia.length === 0) return;
    setPostingContent(true);
    const mediaItems: PostMediaItem[] = [];
    try {
      if (postMedia.length > 0) {
        setUploadingPostImage(true);
        const supabase = createClient();
        for (const item of postMedia) {
          const ext = item.file.name.split(".").pop() || (item.type === "video" ? "mp4" : "jpg");
          const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from("post-images")
            .upload(path, item.file, { upsert: false, contentType: item.file.type });
          if (upErr) throw upErr;
          const { data } = supabase.storage.from("post-images").getPublicUrl(path);
          mediaItems.push({ url: data.publicUrl, type: item.type });
        }
        setUploadingPostImage(false);
      }
      let finalContent = postContent.trim();
      for (const person of taggedPeople) {
        const handle =
          person.username?.trim() ||
          usernameFromEmail(person.email, person.id);
        const already = new RegExp(
          `(^|\\s)@?${handle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i",
        ).test(finalContent);
        if (!already) {
          finalContent = `${finalContent} @${handle}`.trim();
        }
      }

      const cover = mediaItems.find((m) => m.type === "image")?.url ?? mediaItems[0]?.url ?? null;
      const postId = await createPost(
        finalContent,
        cover,
        undefined,
        taggedPeople.map((p) => p.id),
        mediaItems,
      );
      const newPost: Post = {
        id: postId,
        content: finalContent,
        image_url: cover,
        media_urls: mediaItems,
        created_at: new Date().toISOString(),
        user_id: userId,
        author_name: nameValue || null,
        author_avatar: currentAvatarUrl,
        author_email: email,
        author_username: username,
        event_id: null,
        event_title: null,
        event_location: null,
        reaction_count: 0,
        user_reacted: false,
        comment_count: 0,
      };
      setLocalPosts((prev) => [newPost, ...prev]);
      resetCompose();
      setComposeOpen(false);
      setActiveTab("posty");
      router.push(`/post/${postId}`);
    } catch {
      alert("Nie udało się dodać posta.");
    } finally {
      setPostingContent(false);
      setUploadingPostImage(false);
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

  async function handleSaveLocation() {
    if (!selectedLocation) {
      alert("Wybierz lokalizację z listy podpowiedzi Google.");
      return;
    }
    setSavingLocation(true);
    try {
      await updateLocation({
        location: selectedLocation.location,
        locationName: selectedLocation.location_name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        placeId: selectedLocation.place_id,
      });
      setLocationValue(selectedLocation.location);
      setEditingLocation(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się zapisać lokalizacji.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleClearLocation() {
    setSavingLocation(true);
    try {
      await updateLocation({
        location: "",
        locationName: null,
        latitude: null,
        longitude: null,
        placeId: null,
      });
      setLocationValue("");
      setSelectedLocation(null);
      setEditingLocation(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Nie udało się usunąć lokalizacji.");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleFollow(user: SuggestedUser) {
    setAddingUserId(user.id);
    try {
      await followUser(user.id);
      setLocalFollowing((prev) => [
        ...prev,
        {
          id: user.id,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          bio: null,
          email: user.email,
          username: user.username,
        },
      ]);
      setLocalSuggestions((prev) => prev.filter((u) => u.id !== user.id));
      setSearchResults((prev) => (prev ? prev.filter((u) => u.id !== user.id) : prev));
      setFollowingCount((prev) => prev + 1);
    } catch {
      alert("Nie udało się zacząć obserwować.");
    } finally {
      setAddingUserId(null);
    }
  }

  async function handleUnfollow(targetId: string) {
    setUnfollowingUserId(targetId);
    try {
      await unfollowUser(targetId);
      const removed = localFollowing.find((u) => u.id === targetId);
      setLocalFollowing((prev) => prev.filter((u) => u.id !== targetId));
      setFollowingCount((prev) => Math.max(0, prev - 1));
      if (removed) {
        setLocalSuggestions((prev) => [{ id: removed.id, full_name: removed.full_name, avatar_url: removed.avatar_url, email: removed.email, username: removed.username, mutual_count: 0 }, ...prev]);
      }
    } catch {
      alert("Nie udało się przestać obserwować.");
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
    <div className="mx-auto min-h-dvh w-full max-w-md overflow-x-hidden bg-[#080810] pb-28 text-white">
      {/* Górny pasek — + jak na Instagramie */}
      {isOwner && (
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            title="Nowy post"
            aria-label="Nowy post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <rect x="3" y="3" width="18" height="18" rx="4" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
          <p className="text-sm font-semibold text-white">@{username}</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void handleShareProfile()}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              title="Udostępnij profil"
              aria-label="Udostępnij profil"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
            <ProfileAccountMenu userEmail={email} />
          </div>
        </div>
      )}

      {/* Górka profilu */}
      <section className={`px-4 ${isOwner ? "pt-3" : "pt-5"}`}>
        <div className="flex items-start justify-between">
          {isOwner ? (
          <label className="group relative cursor-pointer shrink-0">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleAvatarChange}
              disabled={uploadingAvatar}
            />
            <div
              className="rounded-full p-[3px]"
              style={{
                background: "linear-gradient(135deg, #22d3ee, #a855f7, #6366f1)",
              }}
            >
              <div className="rounded-full bg-[#080810] p-[3px]">
                <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full">
                  {currentAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={currentAvatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatarGradient} text-2xl font-bold`}>
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                    {uploadingAvatar ? (
                      <svg className="h-6 w-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5 text-white">
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
          ) : (
            <div className="shrink-0">
              <div
                className="rounded-full p-[3px]"
                style={{
                  background: "linear-gradient(135deg, #22d3ee, #a855f7, #6366f1)",
                }}
              >
                <div className="rounded-full bg-[#080810] p-[3px]">
                  <div className="relative h-[88px] w-[88px] overflow-hidden rounded-full">
                    {currentAvatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentAvatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatarGradient} text-2xl font-bold`}>
                        {initials}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isOwner && <div className="pt-1" />}
        </div>

        <div className="mt-4">
          {isOwner && editingName ? (
            <div className="flex max-w-sm flex-col gap-2">
              <input
                type="text"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                maxLength={50}
                placeholder="Twoje imię i nazwisko"
                className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-violet-500"
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                autoFocus
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveName} disabled={savingName} className="flex-1 cursor-pointer rounded-xl bg-violet-600 py-1.5 text-sm font-medium text-white disabled:opacity-60">
                  {savingName ? "Zapisywanie…" : "Zapisz"}
                </button>
                <button type="button" onClick={() => { setEditingName(false); setNameValue(fullName ?? ""); }} className="flex-1 cursor-pointer rounded-xl bg-white/10 py-1.5 text-sm text-zinc-300">
                  Anuluj
                </button>
              </div>
            </div>
          ) : isOwner ? (
            <button type="button" onClick={() => setEditingName(true)} className="group cursor-pointer text-left">
              <h1 className="text-[22px] font-bold leading-tight text-white">{displayName}</h1>
            </button>
          ) : (
            <h1 className="text-[22px] font-bold leading-tight text-white">{displayName}</h1>
          )}

          <p className="mt-0.5 text-sm font-medium text-violet-400">@{username}</p>

          {isOwner && editingLocation ? (
            <div className="mt-2 max-w-md space-y-2">
              <LocationPicker
                value={selectedLocation}
                onChange={setSelectedLocation}
                disabled={savingLocation}
                variant="compact"
                showMapHint={false}
                inputId="profile-location"
                placeholder="Wpisz miasto lub miejsce…"
                initialLabel={locationValue || undefined}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleSaveLocation()}
                  disabled={savingLocation || !selectedLocation}
                  className="flex-1 cursor-pointer rounded-xl bg-violet-600 py-1.5 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingLocation ? "Zapisywanie…" : "Zapisz"}
                </button>
                {locationValue ? (
                  <button
                    type="button"
                    onClick={() => void handleClearLocation()}
                    disabled={savingLocation}
                    className="cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-400 hover:text-red-300 disabled:opacity-60"
                  >
                    Usuń
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setEditingLocation(false);
                    if (
                      initialLocation &&
                      initialLocationLat != null &&
                      initialLocationLng != null
                    ) {
                      setSelectedLocation({
                        location: initialLocation,
                        location_name: initialLocationName,
                        latitude: initialLocationLat,
                        longitude: initialLocationLng,
                        place_id: initialLocationPlaceId,
                      });
                    } else {
                      setSelectedLocation(null);
                    }
                  }}
                  className="flex-1 cursor-pointer rounded-xl bg-white/10 py-1.5 text-sm text-zinc-300"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : isOwner ? (
            <button
              type="button"
              onClick={() => setEditingLocation(true)}
              className="mt-2 flex cursor-pointer items-center gap-1.5 text-left text-sm text-zinc-500 hover:text-zinc-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 shrink-0">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className={locationValue ? "text-zinc-400" : ""}>
                {locationValue || "Dodaj lokalizację"}
              </span>
            </button>
          ) : locationValue ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 shrink-0 text-zinc-500">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{locationValue}</span>
            </p>
          ) : null}

          {isOwner && editingBio ? (
            <div className="mt-3 max-w-md">
              <textarea
                value={bioValue}
                onChange={(e) => setBioValue(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Napisz coś o sobie…"
                className="w-full resize-none rounded-xl bg-white/10 px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-violet-500"
              />
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={handleSaveBio} disabled={savingBio} className="flex-1 cursor-pointer rounded-xl bg-violet-600 py-1.5 text-sm font-medium text-white disabled:opacity-60">
                  {savingBio ? "Zapisywanie…" : "Zapisz"}
                </button>
                <button type="button" onClick={() => { setEditingBio(false); setBioValue(bio ?? ""); }} className="flex-1 cursor-pointer rounded-xl bg-white/10 py-1.5 text-sm text-zinc-300">
                  Anuluj
                </button>
              </div>
            </div>
          ) : isOwner ? (
            <button
              type="button"
              onClick={() => setEditingBio(true)}
              className="mt-2 block max-w-md cursor-pointer text-left text-sm leading-relaxed text-zinc-400 hover:text-zinc-200"
            >
              {bioValue ? bioValue : (
                <span className="text-zinc-600">+ Dodaj bio</span>
              )}
            </button>
          ) : bioValue ? (
            <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{bioValue}</p>
          ) : null}
        </div>

        {/* Stats */}
        <div className="mt-5 flex w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]">
          {([
            { key: "following" as const, value: followingCount, label: "Obserwowani" },
            { key: "followers" as const, value: followers, label: "Obserwujący" },
            { key: "badges" as const, value: unlockedBadges.length, label: "Odznaki" },
            { key: "posts" as const, value: postsCount, label: "Posty" },
          ]).map((stat, index) => (
            <button
              key={stat.key}
              type="button"
              onClick={() => setStatsPanel(stat.key)}
              className={`flex min-w-0 flex-1 cursor-pointer flex-col items-center gap-0.5 px-1 py-3.5 transition-colors hover:bg-white/5 active:bg-white/10 ${
                index > 0 ? "border-l border-white/10" : ""
              }`}
            >
              <span className="text-xl font-bold leading-none text-white">{formatCount(stat.value)}</span>
              <span className="max-w-full truncate text-[11px] text-zinc-500">{stat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Panel listy ze statystyk */}
      {statsPanel && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Zamknij"
            className="absolute inset-0 bg-black/60"
            onClick={() => setStatsPanel(null)}
          />
          <div className="relative z-10 flex max-h-[80dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-[#0f0f18] sm:rounded-3xl sm:mx-4">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">
                {statsPanel === "followers" && `Obserwujący (${followerUsers.length})`}
                {statsPanel === "following" && `Obserwowani (${localFollowing.length})`}
                {statsPanel === "badges" && `Odznaki (${unlockedBadges.length})`}
                {statsPanel === "posts" && `Posty (${postsCount})`}
              </h2>
              <button
                type="button"
                onClick={() => setStatsPanel(null)}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto px-4 py-3 pb-8">
              {statsPanel === "followers" && (
                followerUsers.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-500">Nikt Cię jeszcze nie obserwuje.</p>
                ) : (
                  <div className="space-y-2">
                    {followerUsers.map((person) => {
                      const name = person.full_name ?? "Użytkownik";
                      const uInitials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                      const href = person.username ? `/profile/${encodeURIComponent(person.username)}` : undefined;
                      const row = (
                        <>
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                            {person.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-xs font-bold">
                                {uInitials}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">{name}</p>
                            <p className="truncate text-xs text-zinc-500">
                              {person.username ? `@${person.username}` : (person.email ?? "Użytkownik IKU")}
                            </p>
                          </div>
                        </>
                      );
                      return href ? (
                        <Link
                          key={person.id}
                          href={href}
                          onClick={() => setStatsPanel(null)}
                          className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                        >
                          {row}
                        </Link>
                      ) : (
                        <div key={person.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                          {row}
                        </div>
                      );
                    })}
                  </div>
                )
              )}
              {statsPanel === "following" && (
                localFollowing.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-500">Nie obserwujesz jeszcze nikogo.</p>
                ) : (
                  <div className="space-y-2">
                    {localFollowing.map((person) => {
                      const name = person.full_name ?? "Użytkownik";
                      const uInitials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
                      const href = person.username ? `/profile/${encodeURIComponent(person.username)}` : undefined;
                      return (
                        <div key={person.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                          {href ? (
                            <Link href={href} onClick={() => setStatsPanel(null)} className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                                {person.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-xs font-bold">
                                    {uInitials}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{name}</p>
                                <p className="truncate text-xs text-zinc-500">
                                  {person.username ? `@${person.username}` : (person.email ?? "Użytkownik IKU")}
                                </p>
                              </div>
                            </Link>
                          ) : (
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                                {person.avatar_url ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-purple-700 text-xs font-bold">
                                    {uInitials}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{name}</p>
                                <p className="truncate text-xs text-zinc-500">{person.email ?? "Użytkownik IKU"}</p>
                              </div>
                            </div>
                          )}
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleUnfollow(person.id)}
                              disabled={unfollowingUserId === person.id}
                              className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-red-500/40 hover:text-red-300 disabled:opacity-40"
                            >
                              {unfollowingUserId === person.id ? "…" : "Obserwowany"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )
              )}

              {statsPanel === "posts" && (
                localPosts.length === 0 ? (
                  <p className="py-10 text-center text-sm text-zinc-500">Brak postów.</p>
                ) : (
                  <div className="space-y-2">
                    {localPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/post/${post.id}`}
                        onClick={() => setStatsPanel(null)}
                        className="block rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                      >
                        <p className="text-sm text-zinc-200 line-clamp-3">
                          {post.content?.trim() ||
                            (post.media_urls?.some((m) => m.type === "video")
                              ? "🎬 Wideo"
                              : post.media_urls?.length || post.image_url
                                ? "📷 Zdjęcie"
                                : "Post")}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {new Date(post.created_at).toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </Link>
                    ))}
                  </div>
                )
              )}

              {statsPanel === "badges" && (() => {
                if (unlockedBadges.length === 0) {
                  return <p className="py-10 text-center text-sm text-zinc-500">Brak odblokowanych odznak.</p>;
                }
                return (
                  <div className="space-y-2">
                    {unlockedBadges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/20 text-lg">
                          {badge.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-white">{badge.label}</p>
                          <p className="truncate text-xs text-zinc-500">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Przyciski właściciela / gościa */}
      <div className="mt-4 flex gap-3 px-4">
        {isOwner ? (
          <>
            <Link
              href="/settings/profil"
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 text-zinc-400">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edytuj profil
            </Link>
            <button
              type="button"
              onClick={() => void handleShareProfile()}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5 text-zinc-400">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Udostępnij profil
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void handleToggleFollowProfile()}
            disabled={togglingFollowProfile}
            className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
              followingThisProfile
                ? "border border-white/10 bg-white/[0.04] text-white hover:bg-white/10"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
          >
            {togglingFollowProfile
              ? "…"
              : followingThisProfile
                ? "Obserwowany"
                : "Obserwuj"}
          </button>
        )}
      </div>

      {/* Podgląd odznak — tylko właściciel; 3 widoczne, „Pokaż wszystkie” rozwija listę */}
      {isOwner && (
      <section className="mt-5 px-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" aria-hidden>
              <path d="M8 21h8m-4-4v-5" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" />
              <path d="M4 7h16v5a8 8 0 0 1-16 0V7z" stroke="#f59e0b" strokeWidth="1.7" strokeLinejoin="round" />
              <line x1="4" y1="7" x2="4" y2="4" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="20" y1="7" x2="20" y2="4" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" />
              <line x1="4" y1="4" x2="20" y2="4" stroke="#f59e0b" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="12" cy="10" r="2.2" fill="#fbbf24" opacity="0.9" />
            </svg>
            <div>
              <h2 className="text-base font-bold text-white">
                {badgesExpanded ? "Wszystkie odznaki" : "Odznaki"}
              </h2>
              {badgesExpanded && (
                <p className="text-xs text-zinc-500">
                  {unlockedBadges.length} zdobytych z {previewBadgesOrdered.length}
                </p>
              )}
            </div>
          </div>
          {previewBadgesOrdered.length > PREVIEW_BADGES_COUNT && (
            <button
              type="button"
              onClick={() => setBadgesExpanded((v) => !v)}
              className="cursor-pointer text-sm font-medium text-violet-400 transition-colors hover:text-violet-300"
            >
              {badgesExpanded ? "Zwiń" : "Pokaż wszystkie >"}
            </button>
          )}
        </div>

        {previewBadgesOrdered.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-zinc-500">
            Brak odznak.
          </p>
        ) : badgesExpanded ? (
          <div className="max-h-[340px] overflow-y-auto overscroll-contain rounded-2xl border border-white/10 bg-[#0c0c14] p-3 [scrollbar-width:thin] [scrollbar-color:#52525b_transparent]">
            <div className="grid grid-cols-3 gap-2.5">
              {visiblePreviewBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center ${
                    badge.unlocked
                      ? "border-white/15 bg-white/[0.04]"
                      : "border-white/5 bg-transparent opacity-45"
                  }`}
                  style={
                    badge.unlocked
                      ? { boxShadow: `0 0 0 1px ${rarityColor(badge.rarity)}33` }
                      : undefined
                  }
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{
                      background: badge.unlocked
                        ? rarityGradient(badge.rarity)
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <BadgeIcon
                      id={badge.id}
                      size={24}
                      color={badge.unlocked ? "white" : "#71717a"}
                    />
                  </div>
                  <span
                    className={`line-clamp-2 w-full text-[11px] font-medium leading-snug ${
                      badge.unlocked ? "text-zinc-300" : "text-zinc-600"
                    }`}
                  >
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {visiblePreviewBadges.map((badge) => (
              <button
                key={badge.id}
                type="button"
                onClick={() => setBadgesExpanded(true)}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border px-2 py-3 text-center transition-colors hover:border-white/20 ${
                  badge.unlocked
                    ? "border-white/10 bg-[#0c0c14]"
                    : "border-white/5 bg-[#0c0c14] opacity-50"
                }`}
              >
                <div
                  className="relative flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: badge.unlocked
                      ? `radial-gradient(circle, ${rarityColor(badge.rarity)}33 0%, transparent 70%)`
                      : "transparent",
                  }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                      background: badge.unlocked
                        ? rarityGradient(badge.rarity)
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <BadgeIcon
                      id={badge.id}
                      size={22}
                      color={badge.unlocked ? "white" : "#71717a"}
                    />
                  </div>
                </div>
                <span
                  className={`line-clamp-2 w-full text-[11px] font-medium leading-snug ${
                    badge.unlocked ? "text-zinc-400" : "text-zinc-600"
                  }`}
                >
                  {badge.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      )}

      {/* Tabs — właściciel: Posty/Odznaki/…, gość: Posty/Oznaczone */}
      <div className="mt-5 border-b border-white/10 px-2">
        <div className="flex min-w-0">
          {(
            [
              { key: "posty" as const, label: "Posty", show: true },
              { key: "oznaczone" as const, label: "Oznaczone", show: !isOwner },
              { key: "badges" as const, label: "Odznaki", show: isOwner },
              { key: "saved" as const, label: "Zapisane", show: isOwner },
              { key: "historia" as const, label: "Historia", show: isOwner },
            ] as const
          )
            .filter((t) => t.show)
            .map((tab) => {
              const isActive = tab.key !== "historia" && activeTab === tab.key;
              const icons: Record<string, React.ReactNode> = {
                posty: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                  </svg>
                ),
                oznaczone: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                ),
                badges: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <circle cx="12" cy="8" r="5" />
                    <path d="M8.21 13.89 7 22l5-3 5 3-1.21-8.11" />
                  </svg>
                ),
                saved: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                ),
                historia: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                ),
              };
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    if (tab.key === "historia") {
                      router.push("/settings/historia");
                      return;
                    }
                    setActiveTab(tab.key);
                  }}
                  className={`relative flex flex-1 cursor-pointer flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition-colors ${
                    isActive ? "text-violet-400" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {icons[tab.key]}
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-violet-500" />
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Tab content */}
      <main className="min-w-0 w-full overflow-x-hidden px-4 pt-4">

        {/* Posty — siatka 3x3 */}
        {activeTab === "posty" && (
          <div className="space-y-3 pb-4">
            {localPosts.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-600">
                {isOwner ? "Brak postów. Kliknij + u góry, żeby dodać." : "Brak postów."}
              </div>
            ) : (
              <div className="-mx-4 grid grid-cols-3 gap-0.5">
                {localPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="relative aspect-square overflow-hidden bg-white/5 transition-opacity hover:opacity-90"
                  >
                    <PostGridThumb
                      media={post.media_urls?.length ? post.media_urls : post.image_url ? [{ url: post.image_url, type: "image" }] : []}
                      fallbackText={post.content || "Post"}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Oznaczone — posty, na których oznaczono tego użytkownika */}
        {activeTab === "oznaczone" && !isOwner && (
          <div className="space-y-3 pb-4">
            {localTaggedPosts.length === 0 ? (
              <div className="py-10 text-center text-sm text-zinc-600">
                Brak oznaczonych postów.
              </div>
            ) : (
              <div className="-mx-4 grid grid-cols-3 gap-0.5">
                {localTaggedPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="relative aspect-square overflow-hidden bg-white/5 transition-opacity hover:opacity-90"
                  >
                    <PostGridThumb
                      media={post.media_urls?.length ? post.media_urls : post.image_url ? [{ url: post.image_url, type: "image" }] : []}
                      fallbackText={post.content?.trim() || "Post"}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Odznaki */}
        {activeTab === "badges" && isOwner && (
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

        {/* Zapisane — posty + wydarzenia */}
        {activeTab === "saved" && isOwner && (
          <div className="space-y-5 pb-4">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Posty
              </h3>
              {localSavedPosts.length === 0 ? (
                <div className="rounded-2xl bg-white/5 px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">
                    Brak zapisanych postów. Wejdź w czyjś post i kliknij zakładkę.
                  </p>
                </div>
              ) : (
                <div className="-mx-4 grid grid-cols-3 gap-0.5">
                  {localSavedPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.id}`}
                      className="relative aspect-square overflow-hidden bg-white/5 transition-opacity hover:opacity-90"
                    >
                      <PostGridThumb
                        media={
                          post.media_urls?.length
                            ? post.media_urls
                            : post.image_url
                              ? [{ url: post.image_url, type: "image" }]
                              : []
                        }
                        fallbackText={post.content?.trim() || "Post"}
                      />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Wydarzenia
              </h3>
              {savedEvents.length === 0 ? (
                <div className="rounded-2xl bg-white/5 px-4 py-8 text-center">
                  <p className="text-sm text-zinc-500">Brak zapisanych wydarzeń.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                        {event.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={event.cover_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl">🎪</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{event.title}</p>
                        <p className="text-xs text-amber-400">
                          {new Date(event.starts_at).toLocaleDateString("pl-PL", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="truncate text-xs text-blue-400">{event.location}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Modal nowego posta */}
      {isOwner && composeOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Zamknij"
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              if (!postingContent) {
                setComposeOpen(false);
                resetCompose();
              }
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl border border-white/10 bg-[#0f0f18] p-4 sm:rounded-3xl sm:mx-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Nowy post</h2>
              <button
                type="button"
                onClick={() => {
                  if (!postingContent) {
                    setComposeOpen(false);
                    resetCompose();
                  }
                }}
                className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="flex gap-3">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full">
                {currentAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={currentAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br ${avatarGradient} text-xs font-bold`}>
                    {initials}
                  </div>
                )}
              </div>
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Co słychać? Podziel się z obserwującymi…"
                maxLength={500}
                rows={4}
                autoFocus
                className="w-full resize-none bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
              />
            </div>

            {taggedPeople.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {taggedPeople.map((person) => {
                  const handle =
                    person.username?.trim() ||
                    usernameFromEmail(person.email, person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => toggleTagPerson(person)}
                      className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200"
                    >
                      @{handle}
                      <span className="text-violet-400">×</span>
                    </button>
                  );
                })}
              </div>
            )}

            {tagPickerOpen && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-3">
                <input
                  type="search"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  placeholder="Szukaj osoby do oznaczenia…"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-violet-500/40"
                  autoFocus
                />
                <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                  {tagSearching ? (
                    <p className="px-1 py-2 text-xs text-zinc-600">Szukam…</p>
                  ) : tagQuery.trim() && tagResults.length === 0 ? (
                    <p className="px-1 py-2 text-xs text-zinc-600">Brak wyników.</p>
                  ) : (
                    tagResults.map((person) => {
                      const name =
                        person.full_name?.trim() ||
                        person.email?.split("@")[0] ||
                        "Użytkownik";
                      const handle =
                        person.username?.trim() ||
                        usernameFromEmail(person.email, person.id);
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => toggleTagPerson(person)}
                          className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-white/5"
                        >
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
                            {person.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-400">
                                {name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{name}</p>
                            <p className="truncate text-xs text-zinc-500">@{handle}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {postMedia.length > 0 && (
              <div className="relative mt-3">
                {postMedia.length === 1 && postMedia[0].type === "video" ? (
                  <div className="relative overflow-hidden rounded-xl">
                    <video
                      src={postMedia[0].preview}
                      controls
                      playsInline
                      className="max-h-56 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePostMedia(postMedia[0].id)}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-white/10 p-1.5">
                    <div className="grid grid-cols-3 gap-1.5">
                      {postMedia.map((item) => (
                        <div key={item.id} className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900">
                          {item.type === "video" ? (
                            <video src={item.preview} muted playsInline className="h-full w-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.preview} alt="" className="h-full w-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removePostMedia(item.id)}
                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-white hover:bg-black/80"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3 w-3">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-1.5 px-1 text-[11px] text-zinc-500">
                      {postMedia.length}/{MAX_POST_IMAGES} · kolaż
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-3">
                <label className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${
                  postMedia.some((m) => m.type === "image")
                    ? "text-violet-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="sr-only"
                    onChange={handlePostImagesChange}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  Zdjęcia
                </label>
                <label className={`flex cursor-pointer items-center gap-1.5 text-sm transition-colors ${
                  postMedia.some((m) => m.type === "video")
                    ? "text-violet-300"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="sr-only"
                    onChange={handlePostVideoChange}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Wideo
                </label>
                <button
                  type="button"
                  onClick={() => setTagPickerOpen((v) => !v)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    tagPickerOpen || taggedPeople.length > 0
                      ? "text-violet-300"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                    <line x1="7" y1="7" x2="7.01" y2="7" />
                  </svg>
                  Oznacz{taggedPeople.length > 0 ? ` (${taggedPeople.length})` : ""}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-600">{postContent.length}/500</span>
                <button
                  type="button"
                  onClick={() => void handleCreatePost()}
                  disabled={(!postContent.trim() && postMedia.length === 0) || postingContent}
                  className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-40"
                >
                  {uploadingPostImage ? "Wysyłam…" : postingContent ? "Publikuję…" : "Opublikuj"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav activePage="profile" />
    </div>
  );
}
