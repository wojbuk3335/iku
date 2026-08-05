import { createClient } from "@/lib/supabase/server";
import { getFollowCounts } from "@/lib/profile/get-follow-counts";
import { getAllBadgesWithProgress } from "@/lib/profile/badges";
import { getUserPosts, getTaggedPosts } from "@/app/profile/wall-actions";
import { getUserEventsByStatus } from "@/lib/profile/get-user-events";
import {
  getFollowingUsers,
  getFollowerUsers,
  getSuggestedUsers,
} from "@/app/profile/znajomi-actions";
import { userHasActiveStory } from "@/app/stories/actions";
import type { Event } from "@/types/event";
import type { BadgeWithProgress } from "@/lib/profile/badges";
import type { Post } from "@/app/profile/wall-actions";
import type { FollowingUser, SuggestedUser } from "@/app/profile/znajomi-actions";

export type ProfilePageData = {
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  username: string;
  location: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationPlaceId: string | null;
  userId: string;
  savedEvents: Event[];
  followers: number;
  following: number;
  badgesWithProgress: BadgeWithProgress[];
  posts: Post[];
  taggedPosts: Post[];
  followingUsers: FollowingUser[];
  followerUsers: FollowingUser[];
  suggestedUsers: SuggestedUser[];
  hasActiveStory: boolean;
  isFollowing: boolean;
};

export async function loadProfilePageData(options: {
  profileUserId: string;
  viewerUserId: string;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
  fullName: string | null;
  username: string;
  location: string | null;
  locationName: string | null;
  locationLat: number | null;
  locationLng: number | null;
  locationPlaceId: string | null;
  isOwner: boolean;
}): Promise<ProfilePageData> {
  const {
    profileUserId,
    viewerUserId,
    email,
    bio,
    avatarUrl,
    fullName,
    username,
    location,
    locationName,
    locationLat,
    locationLng,
    locationPlaceId,
    isOwner,
  } = options;

  const [
    savedEvents,
    followCounts,
    badgesWithProgress,
    posts,
    taggedPosts,
    followingUsers,
    followerUsers,
    suggestedUsers,
    hasActiveStory,
  ] = await Promise.all([
    isOwner
      ? getUserEventsByStatus(profileUserId, "saved").catch(() => [] as Event[])
      : Promise.resolve([] as Event[]),
    getFollowCounts(profileUserId).catch(() => ({ followers: 0, following: 0 })),
    getAllBadgesWithProgress(profileUserId).catch(() => []),
    getUserPosts(profileUserId).catch(() => []),
    getTaggedPosts(profileUserId).catch(() => [] as Post[]),
    getFollowingUsers(profileUserId).catch(() => []),
    getFollowerUsers(profileUserId).catch(() => []),
    isOwner
      ? getSuggestedUsers(viewerUserId).catch(() => [])
      : Promise.resolve([] as SuggestedUser[]),
    userHasActiveStory(profileUserId).catch(() => false),
  ]);

  let isFollowing = false;
  if (!isOwner) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", viewerUserId)
      .eq("following_id", profileUserId)
      .maybeSingle();
    isFollowing = Boolean(data);
  }

  return {
    email: email ?? "",
    bio,
    avatarUrl,
    fullName,
    username,
    location,
    locationName,
    locationLat,
    locationLng,
    locationPlaceId,
    userId: profileUserId,
    savedEvents,
    followers: followCounts.followers,
    following: followCounts.following,
    badgesWithProgress,
    posts,
    taggedPosts,
    followingUsers,
    followerUsers,
    suggestedUsers,
    hasActiveStory,
    isFollowing,
  };
}
