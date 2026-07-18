import { redirect } from "next/navigation";
import { getCreatorEvents } from "@/app/admin/actions";
import { CreatorAchievementsHub } from "@/components/admin/creator-achievements-hub";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function CreatorAchievementsPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  const events = await getCreatorEvents();

  return (
    <CreatorAchievementsHub events={events} userEmail={user.email ?? null} />
  );
}
