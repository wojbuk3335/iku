import { notFound, redirect } from "next/navigation";
import { getCreatorEvent } from "@/app/admin/actions";
import {
  getEventAchievements,
  getEventAchievementStats,
} from "@/app/admin/events/achievements-actions";
import { AchievementsList } from "@/components/achievements/achievements-list";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function EventAchievementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") {
    redirect("/events");
  }

  const event = await getCreatorEvent(id);
  if (!event) notFound();

  const [achievements, stats] = await Promise.all([
    getEventAchievements(id),
    getEventAchievementStats(id),
  ]);

  return (
    <AchievementsList
      eventId={id}
      eventTitle={event.title}
      achievements={achievements}
      stats={stats}
    />
  );
}
