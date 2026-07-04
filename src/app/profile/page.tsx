import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth/get-session-profile";
import { getUserEventsByStatus } from "@/lib/profile/get-user-events";
import { getFollowCounts } from "@/lib/profile/get-follow-counts";
import { getAllBadgesWithProgress } from "@/lib/profile/badges";
import { getUserPosts } from "@/app/profile/wall-actions";
import { ProfilePage } from "@/components/profile/profile-page";

export const dynamic = "force-dynamic";

export default async function Profile() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role === "admin") redirect("/admin");
  if (!profile?.onboarding_completed) redirect("/onboarding");

  // Retroaktywne przyznanie odznak dla istniejących danych
  const { checkAndAwardBadges } = await import("@/lib/profile/badges");
  await checkAndAwardBadges(user.id).catch(() => {});

  const [goingEvents, savedEvents, followCounts, badgesWithProgress, posts] = await Promise.all([
    getUserEventsByStatus(user.id, "going"),
    getUserEventsByStatus(user.id, "saved"),
    getFollowCounts(user.id).catch(() => ({ followers: 0, following: 0 })),
    getAllBadgesWithProgress(user.id).catch(() => []),
    getUserPosts(user.id).catch(() => []),
  ]);

  return (
    <ProfilePage
      email={user.email ?? ""}
      bio={profile?.bio ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      fullName={profile?.full_name ?? null}
      userId={user.id}
      goingEvents={goingEvents}
      savedEvents={savedEvents}
      followers={followCounts.followers}
      following={followCounts.following}
      badgesWithProgress={badgesWithProgress}
      posts={posts}
    />
  );
}
