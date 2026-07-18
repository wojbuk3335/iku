import { notFound, redirect } from "next/navigation";
import { getCreatorEvent } from "@/app/admin/actions";
import { getEventAchievement } from "@/app/admin/events/achievements-actions";
import { AchievementWizard } from "@/components/achievements/achievement-wizard";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function EditAchievementPage({
  params,
}: {
  params: Promise<{ id: string; achievementId: string }>;
}) {
  const { id, achievementId } = await params;
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") {
    redirect("/events");
  }

  const event = await getCreatorEvent(id);
  if (!event) notFound();

  const achievement = await getEventAchievement(id, achievementId);
  if (!achievement) notFound();

  return (
    <AchievementWizard
      eventId={id}
      eventTitle={event.title}
      achievement={achievement}
    />
  );
}
