import { redirect } from "next/navigation";
import {
  getCreatorEventBadges,
  getCreatorEvents,
} from "@/app/admin/actions";
import { CreatorEventsList } from "@/components/admin/creator-events-list";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function CreatorEventsPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  const [events, badgesByEvent] = await Promise.all([
    getCreatorEvents(),
    getCreatorEventBadges(),
  ]);

  return (
    <CreatorEventsList
      events={events}
      badgesByEvent={badgesByEvent}
      userEmail={user.email ?? null}
    />
  );
}
