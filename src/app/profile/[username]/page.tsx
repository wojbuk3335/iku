import { notFound, redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { loadProfilePageData } from "@/lib/profile/load-profile-page-data";
import { normalizeUsername } from "@/lib/profile/username";
import { createClient } from "@/lib/supabase/server";
import { ProfilePage } from "@/components/profile/profile-page";

export const dynamic = "force-dynamic";

type TargetProfile = {
  id: string;
  email: string | null;
  bio: string | null;
  avatar_url: string | null;
  full_name: string | null;
  username: string;
  location: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  place_id: string | null;
  role: string;
  onboarding_completed: boolean | null;
};

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = normalizeUsername(decodeURIComponent(rawUsername));

  const { user, profile: sessionProfile } = await getSessionProfile();

  if (!user) redirect("/");
  if (sessionProfile?.role === "admin") redirect("/admin");
  if (!sessionProfile?.onboarding_completed) redirect("/onboarding");

  const supabase = await createClient();
  let target: TargetProfile | null = null;

  const withCoords = await supabase
    .from("profiles")
    .select(
      "id, email, bio, avatar_url, full_name, username, location, location_name, latitude, longitude, place_id, role, onboarding_completed",
    )
    .ilike("username", username)
    .maybeSingle();

  if (!withCoords.error && withCoords.data) {
    target = {
      ...withCoords.data,
      location: withCoords.data.location ?? null,
      location_name: withCoords.data.location_name ?? null,
      latitude: withCoords.data.latitude ?? null,
      longitude: withCoords.data.longitude ?? null,
      place_id: withCoords.data.place_id ?? null,
    };
  } else {
    const withLocation = await supabase
      .from("profiles")
      .select("id, email, bio, avatar_url, full_name, username, location, role, onboarding_completed")
      .ilike("username", username)
      .maybeSingle();

    if (!withLocation.error && withLocation.data) {
      target = {
        ...withLocation.data,
        location: withLocation.data.location ?? null,
        location_name: null,
        latitude: null,
        longitude: null,
        place_id: null,
      };
    } else {
      const base = await supabase
        .from("profiles")
        .select("id, email, bio, avatar_url, full_name, username, role, onboarding_completed")
        .ilike("username", username)
        .maybeSingle();

      if (base.error) {
        console.error("PublicProfilePage:", base.error.message);
      }
      if (base.data) {
        target = {
          ...base.data,
          location: null,
          location_name: null,
          latitude: null,
          longitude: null,
          place_id: null,
        };
      }
    }
  }

  if (!target?.username || target.role === "admin") {
    notFound();
  }

  if (target.username !== username) {
    redirect(`/profile/${encodeURIComponent(target.username)}`);
  }

  const isOwner = target.id === user.id;

  if (isOwner) {
    const { checkAndAwardBadges } = await import("@/lib/profile/badges");
    await checkAndAwardBadges(user.id).catch(() => {});
  }

  const data = await loadProfilePageData({
    profileUserId: target.id,
    viewerUserId: user.id,
    email: target.email,
    bio: target.bio,
    avatarUrl: target.avatar_url,
    fullName: target.full_name,
    username: target.username,
    location: target.location,
    locationName: target.location_name,
    locationLat: target.latitude,
    locationLng: target.longitude,
    locationPlaceId: target.place_id,
    isOwner,
  });

  return (
    <ProfilePage
      {...data}
      isOwner={isOwner}
    />
  );
}
