import { redirect } from "next/navigation";
import { getCreatorEvents } from "@/app/admin/actions";
import { CreatorEventsList } from "@/components/admin/creator-events-list";
import { getSessionProfile } from "@/lib/auth/get-session-profile";

export const dynamic = "force-dynamic";

export default async function CreatorEventsPage() {
  const { user, profile } = await getSessionProfile();

  if (!user) redirect("/");
  if (profile?.role !== "admin" && profile?.role !== "creator") redirect("/events");

  const events = await getCreatorEvents();

  return <CreatorEventsList events={events} userEmail={user.email ?? null} />;
}
