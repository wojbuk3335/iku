import { redirect } from "next/navigation";
import {
  getCreatorDemographics,
  getCreatorEventBadges,
  getCreatorEvents,
  getCreatorFollowerStats,
  getCreatorFollowersList,
  getCreatorParticipantStats,
  getCreatorViewStats,
} from "@/app/admin/actions";
import { CreatorStatsPage } from "@/components/admin/creator-stats-page";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function CreatorStatsRoute({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { user, profile } = await getSessionProfile();
  const { tab } = await searchParams;

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") {
    redirect("/events");
  }

  const [
    events,
    badgesByEvent,
    viewStats,
    participantStats,
    followerStats,
    followers,
    demographics,
  ] = await Promise.all([
    getCreatorEvents(),
    getCreatorEventBadges(),
    getCreatorViewStats(),
    getCreatorParticipantStats(),
    getCreatorFollowerStats(),
    getCreatorFollowersList(),
    getCreatorDemographics(),
  ]);

  const initialTab =
    tab === "events" || tab === "widownia" || tab === "analityka"
      ? tab
      : "analityka";

  return (
    <CreatorStatsPage
      events={events}
      badgesByEvent={badgesByEvent}
      viewStats={viewStats}
      participantStats={participantStats}
      followerStats={followerStats}
      followers={followers}
      demographics={demographics}
      initialTab={initialTab}
    />
  );
}
